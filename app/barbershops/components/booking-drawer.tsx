"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  Scissors,
  Sparkles,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type {
  BookingDayOption,
  BookingDrawerProps,
  MarketplaceBookingResponse,
  MarketplaceProfessional,
} from "@/types/marketplace/booking";
import type { MarketplaceService } from "@/types/marketplace/shops";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  domingo: 0,
  segunda: 1,
  terca: 2,
  terça: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
  sábado: 6,
};

function parsedClosedDayIndices(closedDays: unknown): Set<number> {
  if (!closedDays) return new Set();
  const values = typeof closedDays === "string"
    ? closedDays.split(",").map((value) => value.trim().toLowerCase())
    : Array.isArray(closedDays)
      ? closedDays
      : [];
  const result = new Set<number>();
  for (const value of values) {
    if (typeof value === "number") result.add(value);
    if (typeof value === "string" && DAY_NAME_TO_INDEX[value] !== undefined) {
      result.add(DAY_NAME_TO_INDEX[value]);
    }
  }
  return result;
}

function getNextDays(count = 7): BookingDayOption[] {
  const days: BookingDayOption[] = [];
  const today = new Date();
  for (let index = 0; index < count; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const fullDate = date.toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    days.push({
      dateStr: iso,
      weekdayShort: date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").toUpperCase(),
      dayNumeric: date.getDate(),
      fullDateFormatted: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
      isToday: index === 0,
    });
  }
  return days;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date() && date.getFullYear() >= 1900;
}

export function BookingDrawer({ shop, isOpen, onClose, onSuccess }: BookingDrawerProps) {
  const days = useMemo(() => getNextDays(7), []);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<MarketplaceProfessional | "any">("any");
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerBirthDate, setCustomerBirthDate] = useState("");

  const currentDay = days[selectedDayIndex];
  const closedDays = useMemo(
    () => parsedClosedDayIndices((shop as any)?.closed_days ?? (shop as any)?.closedDays ?? (shop as any)?.off_days),
    [shop],
  );
  const selectedDateIsClosed = closedDays.has(new Date(`${currentDay.dateStr}T12:00:00`).getDay());
  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedDayIndex(0);
    setSelectedSlot(null);
    setSelectedProfessional("any");
    setHasError(false);
    setErrorMessage("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerBirthDate("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shop) return;
    let mounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setSelectedSlot(null);

    fetch(`/api/shops/${shop.id}/booking-data?date=${currentDay.dateStr}${selectedService ? `&serviceId=${selectedService.id}` : ""}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar a disponibilidade.");
        return (await response.json()) as MarketplaceBookingResponse;
      })
      .then((data) => {
        if (!mounted) return;
        setServices(data.services ?? []);
        setProfessionals(data.professionals ?? (data as any).barbers ?? []);
        setAvailableSlots(data.availableSlots ?? []);
        setIsClosed(selectedDateIsClosed || Boolean(data.isClosed));
        if (!selectedService && data.services?.[0]) setSelectedService(data.services[0]);
      })
      .catch((error) => {
        if (!mounted || error?.name === "AbortError") return;
        console.error("[BookingAvailability]", error);
        toast.error("Não foi possível carregar os horários disponíveis.");
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isOpen, shop, currentDay.dateStr, selectedService, selectedDateIsClosed]);

  const handleConfirm = async () => {
    if (!shop || !selectedService || !selectedSlot) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !customerBirthDate) {
      toast.error("Preenche todos os campos obrigatórios, incluindo a data de nascimento.");
      return;
    }
    if (!isValidBirthDate(customerBirthDate)) {
      toast.error("Indica uma data de nascimento válida.");
      return;
    }

    setIsSubmitting(true);
    setHasError(false);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          service: selectedService.id,
          date: currentDay.dateStr,
          slot: selectedSlot,
          professionalId: selectedProfessional === "any" ? null : selectedProfessional.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          customerBirthDate,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Não foi possível concluir a marcação.");

      toast.success("Agendamento efetuado com sucesso!");
      setStep(4);
      onSuccess?.({
        shopName: shop.name,
        serviceName: selectedService.name,
        date: currentDay.dateStr,
        time: selectedSlot,
        customerEmail: customerEmail.trim(),
      });
    } catch (error) {
      console.error("[BookingConfirm]", error);
      const message = error instanceof Error ? error.message : "Não foi possível concluir a marcação.";
      setErrorMessage(message);
      setHasError(true);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shop) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto flex max-h-[92dvh] max-w-lg flex-col overflow-hidden border-white/10 bg-zinc-950 text-zinc-100">
        <DrawerHeader className="shrink-0 border-b border-white/10 px-4 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-lg font-bold sm:text-xl">
                {hasError ? "Erro no agendamento" : step === 4 ? "Confirmação" : shop.name}
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-xs text-zinc-400">
                {hasError
                  ? "Não foi possível concluir o teu agendamento."
                  : step === 1
                    ? "Escolhe serviço, dia e horário."
                    : step === 2
                      ? "Escolhe o barbeiro que preferes."
                      : step === 3
                        ? "Introduz os teus dados para finalizar."
                        : "O teu horário ficou reservado."}
              </DrawerDescription>
            </div>
            {!hasError && step < 4 && (
              <div className="flex shrink-0 items-center gap-1.5" aria-label={`Passo ${step} de 3`}>
                {[1, 2, 3].map((item) => (
                  <span key={item} className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${step >= item ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-500"}`}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {hasError ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                <XCircle className="size-7" />
              </div>
              <div>
                <h3 className="font-semibold">Não foi possível reservar</h3>
                <p className="mt-1 max-w-sm text-xs text-zinc-400">{errorMessage}</p>
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <Scissors className="size-3.5" /> Serviço
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {services.map((service) => {
                    const selected = selectedService?.id === service.id;
                    return (
                      <button key={service.id} type="button" onClick={() => setSelectedService(service)} className={`min-w-[150px] rounded-2xl border p-3.5 text-left ${selected ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}>
                        <span className="block text-sm font-bold">{service.name}</span>
                        <span className={`mt-2 block text-xs ${selected ? "text-zinc-700" : "text-zinc-400"}`}>{service.durationMinutes} min · €{service.price?.toFixed(2) ?? "0.00"}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>Dia</span>
                  <span className="font-normal normal-case text-zinc-500">Desliza para mais</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((day, index) => {
                    const closed = closedDays.has(new Date(`${day.dateStr}T12:00:00`).getDay());
                    const selected = index === selectedDayIndex;
                    return (
                      <button key={day.dateStr} type="button" disabled={closed} onClick={() => setSelectedDayIndex(index)} className={`min-w-[64px] rounded-2xl border px-3 py-3 text-center ${closed ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40" : selected ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}>
                        <span className="block text-[10px] font-bold uppercase">{day.isToday ? "Hoje" : day.weekdayShort}</span>
                        <span className="mt-1 block text-lg font-black">{day.dayNumeric}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <Clock className="size-3.5" /> Horários
                </div>
                {isLoading ? (
                  <div className="flex h-28 items-center justify-center"><Loader2 className="size-5 animate-spin text-zinc-400" /></div>
                ) : isClosed || availableSlots.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                    <AlertCircle className="mx-auto size-6 text-zinc-500" />
                    <p className="mt-2 text-sm font-medium">Sem horários disponíveis</p>
                    <p className="mt-1 text-xs text-zinc-500">Escolhe outro dia para continuar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => {
                      const selected = selectedSlot === slot;
                      return <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`min-h-11 rounded-xl border text-sm font-bold ${selected ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}>{slot}</button>;
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : step === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><UserCheck className="size-3.5" /> Profissional</div>
              <button type="button" onClick={() => setSelectedProfessional("any")} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${selectedProfessional === "any" ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}>
                <div><div className="text-sm font-bold">Sem preferência</div><div className={`text-xs ${selectedProfessional === "any" ? "text-zinc-700" : "text-zinc-500"}`}>Atribuição ao primeiro disponível</div></div>
                {selectedProfessional === "any" && <Check className="size-4" />}
              </button>
              {professionals.map((professional) => {
                const selected = selectedProfessional !== "any" && selectedProfessional.id === professional.id;
                return <button key={professional.id} type="button" onClick={() => setSelectedProfessional(professional)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${selected ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}>
                  <div><div className="text-sm font-bold">{professional.name}</div><div className={`text-xs ${selected ? "text-zinc-700" : "text-zinc-500"}`}>{professional.role || "Barbeiro Profissional"}</div></div>
                  {selected && <Check className="size-4" />}
                </button>;
              })}
            </div>
          ) : step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Serviço</span><span className="font-semibold">{selectedService?.name}</span></div>
                <div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Data</span><span className="font-semibold">{currentDay.fullDateFormatted}</span></div>
                <div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Hora</span><span className="font-semibold">{selectedSlot}</span></div>
                <div className="flex items-center justify-between pt-2"><span className="text-zinc-500">Profissional</span><span className="font-semibold">{selectedProfessional === "any" ? "Sem preferência" : selectedProfessional.name}</span></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><User className="size-3.5" /> Os teus dados</div>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" placeholder="Nome completo *" className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="Telemóvel *" className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" />
                  <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="Email *" className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <label htmlFor="booking-birth-date" className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Data de nascimento <span className="text-white">*</span></span>
                    <span className="font-normal text-zinc-500">Obrigatório</span>
                  </label>
                  <input
                    id="booking-birth-date"
                    type="date"
                    value={customerBirthDate}
                    max={todayIso}
                    min="1900-01-01"
                    onChange={(event) => setCustomerBirthDate(event.target.value)}
                    autoComplete="bday"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                  <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">Usamos esta informação para manter o registo do cliente correto caso decidas adicioná-lo à lista de clientes.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="size-8" /></div>
              <div><h3 className="text-xl font-bold">Tudo pronto e reservado!</h3><p className="mt-1 text-xs text-zinc-500">O teu horário foi garantido.</p></div>
              <div className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs"><Mail className="mt-0.5 size-4 text-zinc-400" /><span>Enviámos a confirmação para <strong className="text-white break-all">{customerEmail}</strong>.</span></div>
            </div>
          )}
        </div>

        <DrawerFooter className="shrink-0 border-t border-white/10 px-4 py-3">
          {hasError ? (
            <div className="flex gap-2">
              <DrawerClose asChild><Button variant="outline" className="min-h-11 flex-1">Fechar</Button></DrawerClose>
              <Button className="min-h-11 flex-1" onClick={() => { setHasError(false); setStep(1); }}>Tentar de novo</Button>
            </div>
          ) : step === 4 ? (
            <Button onClick={onClose} className="min-h-11 w-full bg-white font-bold text-zinc-950 hover:bg-zinc-200">Concluir</Button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {step === 1 ? <DrawerClose asChild><Button variant="ghost" className="min-h-11">Cancelar</Button></DrawerClose> : <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="min-h-11"><ChevronLeft className="mr-1.5 size-4" />Voltar</Button>}
              {step < 3 ? (
                <Button disabled={step === 1 ? !selectedService || !selectedSlot || isClosed : selectedProfessional === null} onClick={() => setStep((step + 1) as 2 | 3)} className="min-h-11 bg-white font-bold text-zinc-950 hover:bg-zinc-200">Próximo<ChevronRight className="ml-1.5 size-4" /></Button>
              ) : (
                <Button disabled={!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !customerBirthDate || !isValidBirthDate(customerBirthDate) || isSubmitting} onClick={handleConfirm} className="min-h-11 bg-white font-bold text-zinc-950 hover:bg-zinc-200">
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                  Confirmar (€{selectedService?.price?.toFixed(2) ?? "0.00"})
                </Button>
              )}
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
