"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, Mail, Scissors, User, UserCheck, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { BookingDayOption, BookingDrawerProps, MarketplaceBookingResponse, MarketplaceProfessional } from "@/types/marketplace/booking";
import type { MarketplaceService } from "@/types/marketplace/shops";

const DAY_INDEX: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6 };

type Step = 1 | 2 | 3 | 4;

function nextDays(count = 7): BookingDayOption[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() + index);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const full = date.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
    return {
      dateStr,
      weekdayShort: date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").toUpperCase(),
      dayNumeric: date.getDate(),
      fullDateFormatted: full.charAt(0).toUpperCase() + full.slice(1),
      isToday: index === 0,
    };
  });
}

function normalizeBirthDateInput(value: string): { display: string; iso: string } {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const display = digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length !== 8) return { display, iso: "" };
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day || year < 1900 || candidate > new Date()) return { display, iso: "" };
  return { display, iso: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}

export function BookingDrawerStable({ shop, isOpen, onClose, onSuccess, selectedServiceId = null }: BookingDrawerProps) {
  const days = useMemo(() => nextDays(), []);
  const [step, setStep] = useState<Step>(1);
  const [dayIndex, setDayIndex] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(selectedServiceId);
  const [professional, setProfessional] = useState<MarketplaceProfessional | "any">("any");
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDateDisplay, setBirthDateDisplay] = useState("");
  const [birthDateIso, setBirthDateIso] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, { data: MarketplaceBookingResponse; timestamp: number }>());

  const currentDay = days[dayIndex];
  const professionalId = professional === "any" ? null : professional.id;
  const service = services.find((item) => item.id === serviceId) ?? null;
  const slotsKey = `${shop?.id ?? ""}|${currentDay.dateStr}|${serviceId ?? ""}|${professionalId ?? ""}`;
  const closedShopDay = useMemo(() => {
    const raw = (shop as any)?.closed_days ?? (shop as any)?.closedDays ?? (shop as any)?.off_days;
    const values = typeof raw === "string" ? raw.split(",") : Array.isArray(raw) ? raw : [];
    const closedIndexes = new Set<number>();
    for (const value of values) {
      if (typeof value === "number" && value >= 0 && value <= 6) closedIndexes.add(value);
      const key = String(value).trim().toLowerCase();
      if (DAY_INDEX[key] !== undefined) closedIndexes.add(DAY_INDEX[key]);
    }
    return closedIndexes.has(new Date(`${currentDay.dateStr}T12:00:00`).getDay());
  }, [currentDay.dateStr, shop]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setDayIndex(0);
    setServiceId(selectedServiceId);
    setProfessional("any");
    setSelectedSlot(null);
    setServices([]);
    setProfessionals([]);
    setSlots([]);
    setClosed(false);
    setClosedDay(false);
    setLoading(false);
    setSubmitting(false);
    setLoadError("");
    setName("");
    setPhone("");
    setEmail("");
    setBirthDateDisplay("");
    setBirthDateIso("");
    cacheRef.current.clear();
    requestRef.current?.abort();
    requestRef.current = null;
  }, [isOpen, selectedServiceId]);

  useEffect(() => {
    if (!isOpen || !shop) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    let mounted = true;
    const cached = cacheRef.current.get(slotsKey);

    if (cached && Date.now() - cached.timestamp < 8000) {
      const data = cached.data;
      setServices(data.services ?? []);
      setProfessionals(data.professionals ?? []);
      setSlots(data.availableSlots ?? []);
      setClosed(Boolean(data.isClosed) || closedShopDay);
      setClosedDay(Boolean(data.closedDay) || closedShopDay);
      return () => { mounted = false; };
    }

    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams({ date: currentDay.dateStr });
    if (serviceId) params.set("serviceId", serviceId);
    if (professionalId) params.set("professionalId", professionalId);

    fetch(`/api/shops/${shop.id}/booking-data?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Não foi possível carregar a disponibilidade.");
        return payload as MarketplaceBookingResponse;
      })
      .then((data) => {
        if (!mounted) return;
        cacheRef.current.set(slotsKey, { data, timestamp: Date.now() });
        setServices(data.services ?? []);
        setProfessionals(data.professionals ?? []);
        setSlots(data.availableSlots ?? []);
        setClosed(Boolean(data.isClosed) || closedShopDay);
        setClosedDay(Boolean(data.closedDay) || closedShopDay);
        if (serviceId && !(data.services ?? []).some((item) => item.id === serviceId)) setServiceId(data.services?.[0]?.id ?? null);
        if (professional !== "any" && !(data.professionals ?? []).some((item) => item.id === professional.id)) setProfessional("any");
        setSelectedSlot((current) => current && data.availableSlots?.includes(current) ? current : null);
      })
      .catch((error) => {
        if (!mounted || error?.name === "AbortError") return;
        console.error("[BookingAvailability]", error);
        setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a disponibilidade.");
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar a disponibilidade.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
    };
  }, [isOpen, shop, currentDay.dateStr, serviceId, professionalId, slotsKey, closedShopDay]);

  function handleBirthDate(value: string) {
    const parsed = normalizeBirthDateInput(value);
    setBirthDateDisplay(parsed.display);
    setBirthDateIso(parsed.iso);
  }

  async function submit() {
    if (!shop || !service || !selectedSlot) return;
    if (!name.trim() || !phone.trim() || !email.trim() || !birthDateIso) {
      toast.error("Preenche todos os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    setLoadError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shop.id, service: service.id, date: currentDay.dateStr, slot: selectedSlot, professionalId, customerName: name.trim(), customerPhone: phone.trim(), customerEmail: email.trim(), customerBirthDate: birthDateIso }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Não foi possível concluir a marcação.");
      setStep(4);
      cacheRef.current.clear();
      toast.success("Agendamento efetuado com sucesso!");
      onSuccess?.({ shopName: shop.name, serviceName: service.name, date: currentDay.dateStr, time: selectedSlot, customerEmail: email.trim() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a marcação.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!shop) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border-white/10 bg-zinc-950 text-zinc-100 sm:h-auto sm:max-h-[90dvh] sm:rounded-t-3xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Reserva</p>
                <h2 className="mt-1 truncate text-base font-semibold sm:text-xl">{step === 4 ? "Reserva confirmada" : shop.name}</h2>
                <p className="mt-1 text-xs text-zinc-400">{step === 1 ? "Escolhe serviço, dia e hora." : step === 2 ? "Escolhe um barbeiro ou deixa sem preferência." : step === 3 ? "Confirma os teus dados." : "O teu horário está reservado."}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar reserva" className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><X className="size-4" /></button>
            </div>
            {step < 4 && <div className="mt-4 grid grid-cols-3 gap-1.5" aria-label={`Passo ${step} de 3`}>{[1, 2, 3].map((item) => <div key={item} className={`h-1.5 rounded-full ${step >= item ? "bg-emerald-300" : "bg-white/10"}`} />)}</div>}
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-6 sm:px-5">
            {loadError && step < 4 ? <div className="mb-4 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4"><XCircle className="mt-0.5 size-5 shrink-0 text-red-400" /><div><p className="text-sm font-semibold text-red-200">Não foi possível carregar o booking</p><p className="mt-1 text-xs leading-5 text-red-100/70">{loadError}</p></div></div> : null}

            {step === 1 && <div className="space-y-5">
              <section><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><Scissors className="size-3.5" /> Serviço</div><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{services.length ? services.map((item) => <button key={item.id} type="button" onClick={() => { setServiceId(item.id); setSelectedSlot(null); }} className={`min-w-[155px] shrink-0 rounded-2xl border p-3 text-left touch-manipulation ${serviceId === item.id ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}><span className="block truncate text-sm font-semibold">{item.name}</span><span className={`mt-2 block text-xs ${serviceId === item.id ? "text-zinc-700" : "text-zinc-500"}`}>{item.durationMinutes} min · €{Number(item.price ?? 0).toFixed(2)}</span></button>) : <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">{loading ? "A carregar serviços…" : "Não existem serviços disponíveis."}</div>}</div></section>

              <section><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><span>Dia</span><span className="text-[10px] normal-case tracking-normal text-zinc-500">Desliza</span></div><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{days.map((day, index) => { const closedDay = ((shop as any)?.closed_days ?? (shop as any)?.closedDays ?? []).includes?.(day.weekdayShort); return <button key={day.dateStr} type="button" onClick={() => { setDayIndex(index); setSelectedSlot(null); }} className={`min-w-[64px] shrink-0 rounded-2xl border px-2 py-3 text-center touch-manipulation ${index === dayIndex ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}><span className="block text-[10px] font-bold uppercase">{day.isToday ? "Hoje" : day.weekdayShort}</span><span className="mt-1 block text-lg font-black">{day.dayNumeric}</span>{closedDay && <span className="mt-1 block text-[8px] font-semibold uppercase text-amber-300">Folga</span>}</button>; })}</div>{closedDay && <div className="mt-3 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-300" /><div><p className="text-xs font-semibold text-amber-200">Dia de folga</p><p className="mt-1 text-[11px] text-amber-100/70">A barbearia não aceita marcações neste dia.</p></div></div>}</section>

              <section><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><span className="flex items-center gap-2"><Clock className="size-3.5" /> Horário</span>{loading ? <Loader2 className="size-4 animate-spin text-zinc-500" /> : null}</div>{slots.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map((slot) => <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`min-h-12 rounded-2xl border text-sm font-semibold touch-manipulation ${selectedSlot === slot ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"}`}>{slot}</button>)}</div> : <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-zinc-500">{loading ? "A verificar horários…" : closed ? "Não existem horários disponíveis para este dia." : "Seleciona um serviço para ver os horários."}</div>}</section>
            </div>}

            {step === 2 && <div className="space-y-4">
              <section><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><UserCheck className="size-3.5" /> Barbeiro</div><button type="button" onClick={() => setProfessional("any")} className={`w-full rounded-2xl border p-4 text-left touch-manipulation ${professional === "any" ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Sem preferência</p><p className={`mt-1 text-xs ${professional === "any" ? "text-zinc-700" : "text-zinc-500"}`}>Qualquer barbeiro disponível</p></div>{professional === "any" ? <Check className="size-4" /> : null}</div></button><div className="mt-2 space-y-2">{professionals.length ? professionals.map((item) => <button key={item.id} type="button" onClick={() => { setProfessional(item); setStep(2); }} className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left touch-manipulation ${professional !== "any" && professional.id === item.id ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}><div><p className="text-sm font-semibold">{item.name}</p><p className={`mt-1 text-xs ${professional !== "any" && professional.id === item.id ? "text-zinc-700" : "text-zinc-500"}`}>{item.role || "Barbeiro Profissional"}</p></div>{professional !== "any" && professional.id === item.id ? <Check className="size-4" /> : null}</button>) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">Não existem perfis de barbeiro associados a esta barbearia.</div>}</div></section>
            </div>}

            {step === 3 && <div className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm"><div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Serviço</span><span className="max-w-[60%] truncate font-semibold">{service?.name ?? "—"}</span></div><div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Data</span><span className="max-w-[60%] truncate text-right font-semibold">{currentDay.fullDateFormatted}</span></div><div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Hora</span><span className="font-semibold">{selectedSlot ?? "—"}</span></div><div className="flex items-center justify-between py-2"><span className="text-zinc-500">Barbeiro</span><span className="max-w-[60%] truncate text-right font-semibold">{professional === "any" ? "Sem preferência" : professional.name}</span></div></section>
              <section className="space-y-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><User className="size-3.5" /> Dados do cliente</div><label className="block"><span className="sr-only">Nome completo</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome completo *" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="sr-only">Telemóvel</span><input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="Telemóvel *" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10" /></label><label className="block"><span className="sr-only">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="Email *" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10" /></label></div><label className="block"><span className="mb-2 block text-xs font-semibold text-zinc-300">Data de nascimento *</span><input value={birthDateDisplay} onChange={(event) => handleBirthDate(event.target.value)} inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" aria-describedby="booking-birth-hint" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10" /><p id="booking-birth-hint" className="mt-1.5 text-[11px] leading-4 text-zinc-500">Introduz no formato DD/MM/AAAA.</p>{birthDateDisplay.length === 10 && !birthDateIso ? <p className="mt-1 text-[11px] text-red-300">Indica uma data válida.</p> : null}</label></section>
            </div>}

            {step === 4 && <div className="flex flex-col items-center gap-5 py-10 text-center"><div className="flex size-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="size-8" /></div><div><h3 className="text-xl font-semibold">Tudo reservado.</h3><p className="mt-1 text-sm text-zinc-500">A confirmação foi enviada para o teu email.</p></div><div className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm"><Mail className="mt-0.5 size-4 shrink-0 text-emerald-300" /><span className="break-all text-zinc-400">{email}</span></div></div>}
          </main>

          <footer className="shrink-0 border-t border-white/10 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
            <div className="flex items-center gap-2">
              {step === 4 ? <Button onClick={onClose} className="min-h-12 w-full bg-white font-semibold text-zinc-950">Concluir</Button> : <>
                <Button variant="ghost" onClick={() => step === 1 ? onClose() : setStep((step - 1) as Step)} className="min-h-12 flex-1">{step === 1 ? "Cancelar" : <><ChevronLeft className="mr-1.5 size-4" />Voltar</>}</Button>
                {step === 1 ? <Button disabled={!service || !selectedSlot || loading || closed} onClick={() => setStep(2)} className="min-h-12 flex-[1.4] bg-white font-semibold text-zinc-950">Continuar<ChevronRight className="ml-1.5 size-4" /></Button> : step === 2 ? <Button disabled={!selectedSlot || loading} onClick={() => setStep(3)} className="min-h-12 flex-[1.4] bg-white font-semibold text-zinc-950">Continuar<ChevronRight className="ml-1.5 size-4" /></Button> : <Button disabled={!service || !selectedSlot || !name.trim() || !phone.trim() || !email.trim() || !birthDateIso || submitting} onClick={submit} className="min-h-12 flex-[1.4] bg-white font-semibold text-zinc-950">{submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}Confirmar · €{service ? Number(service.price ?? 0).toFixed(2) : "0.00"}</Button>}
              </>}
            </div>
          </footer>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default BookingDrawerStable;
