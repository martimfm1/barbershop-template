"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, Mail, Scissors, User, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { BookingBlockedInterval, BookingDayOption, BookingDrawerProps, MarketplaceBookingResponse, MarketplaceProfessional } from "@/types/marketplace/booking";
import type { MarketplaceService } from "@/types/marketplace/shops";

const DAY_INDEX: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6 };
const CACHE_TTL = 8000;
type CacheEntry = { data: MarketplaceBookingResponse; timestamp: number };

function closedDaySet(value: unknown) {
  const raw = typeof value === "string" ? value.split(",") : Array.isArray(value) ? value : [];
  return new Set<number>(raw.flatMap((item) => {
    if (typeof item === "number" && item >= 0 && item <= 6) return [item];
    const key = String(item).trim().toLowerCase();
    return DAY_INDEX[key] === undefined ? [] : [DAY_INDEX[key]];
  }));
}

function nextDays(count = 7): BookingDayOption[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const full = date.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
    return { dateStr, weekdayShort: date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").toUpperCase(), dayNumeric: date.getDate(), fullDateFormatted: full.charAt(0).toUpperCase() + full.slice(1), isToday: index === 0 };
  });
}

function validBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date() && date.getFullYear() >= 1900;
}

export function BookingDrawerOptimized({ shop, isOpen, onClose, onSuccess, selectedServiceId: initialServiceId }: BookingDrawerProps) {
  const days = useMemo(() => nextDays(), []);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dayIndex, setDayIndex] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const [professional, setProfessional] = useState<MarketplaceProfessional | "any">("any");
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BookingBlockedInterval[]>([]);
  const [closed, setClosed] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const cache = useRef(new Map<string, CacheEntry>());
  const lastBaseKey = useRef<string | null>(null);
  const currentDay = days[dayIndex];
  const professionalId = professional === "any" ? null : professional.id;
  const service = useMemo(() => services.find((item) => item.id === serviceId) ?? null, [services, serviceId]);
  const shopClosedDays = useMemo(() => closedDaySet((shop as any)?.closed_days ?? (shop as any)?.closedDays ?? (shop as any)?.off_days), [shop]);
  const selectedDateClosed = shopClosedDays.has(new Date(`${currentDay.dateStr}T12:00:00`).getDay());
  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1); setDayIndex(0); setServiceId(initialServiceId ?? null); setProfessional("any"); setSelectedSlot(null);
    setServices([]); setProfessionals([]); setSlots([]); setBlocked([]); setClosed(false); setClosedDay(false); setLoading(false); setSubmitting(false); setError("");
    setName(""); setPhone(""); setEmail(""); setBirthDate(""); lastBaseKey.current = null;
  }, [isOpen, initialServiceId]);

  useEffect(() => {
    if (!isOpen || !shop) return;
    const controller = new AbortController();
    let mounted = true;
    const baseKey = `${currentDay.dateStr}|${serviceId ?? ""}`;
    const key = `${baseKey}|${professionalId ?? ""}`;
    const cached = cache.current.get(key);
    const preserveSlot = lastBaseKey.current === baseKey;

    const apply = (data: MarketplaceBookingResponse) => {
      if (!mounted) return;
      setServices(data.services ?? []);
      setProfessionals(data.professionals ?? (data as any).barbers ?? []);
      setSlots(data.availableSlots ?? []);
      setBlocked(data.blockedIntervals ?? []);
      setClosedDay(Boolean(data.closedDay) || selectedDateClosed);
      setClosed(Boolean(data.isClosed) || selectedDateClosed);
      setSelectedSlot((current) => preserveSlot && current && data.availableSlots?.includes(current) ? current : null);
      lastBaseKey.current = baseKey;
    };

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      apply(cached.data);
      return () => { mounted = false; controller.abort(); };
    }

    setLoading(true);
    const params = new URLSearchParams({ date: currentDay.dateStr });
    if (serviceId) params.set("serviceId", serviceId);
    if (professionalId) params.set("professionalId", professionalId);

    fetch(`/api/shops/${shop.id}/booking-data?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Falha ao carregar a disponibilidade.");
        return payload as MarketplaceBookingResponse;
      })
      .then((data) => { if (mounted) { cache.current.set(key, { data, timestamp: Date.now() }); apply(data); } })
      .catch((reason) => {
        if (!mounted || reason?.name === "AbortError") return;
        console.error("[BookingAvailability]", reason);
        toast.error(reason instanceof Error ? reason.message : "Não foi possível carregar a disponibilidade.");
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; controller.abort(); };
  }, [isOpen, shop, currentDay.dateStr, serviceId, professionalId, selectedDateClosed]);

  const submit = async () => {
    if (!shop || !service || !selectedSlot) return;
    if (!name.trim() || !phone.trim() || !email.trim() || !birthDate) return toast.error("Preenche todos os campos obrigatórios.");
    if (!validBirthDate(birthDate)) return toast.error("Indica uma data de nascimento válida.");
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId: shop.id, service: service.id, date: currentDay.dateStr, slot: selectedSlot, professionalId, customerName: name.trim(), customerPhone: phone.trim(), customerEmail: email.trim(), customerBirthDate: birthDate }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Não foi possível concluir a marcação.");
      cache.current.clear();
      setStep(4);
      toast.success("Agendamento efetuado com sucesso!");
      onSuccess?.({ shopName: shop.name, serviceName: service.name, date: currentDay.dateStr, time: selectedSlot, customerEmail: email.trim() });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Não foi possível concluir a marcação.";
      setError(message); toast.error(message);
    } finally { setSubmitting(false); }
  };

  if (!shop) return null;
  const stepOneReady = Boolean(service && selectedSlot && !closed);
  const stepTwoReady = Boolean(selectedSlot);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border-white/10 bg-zinc-950 text-zinc-100 sm:h-auto sm:max-h-[92dvh] sm:rounded-t-3xl">
        <DrawerHeader className="shrink-0 border-b border-white/10 px-4 py-3 text-left sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><DrawerTitle className="truncate text-base font-bold sm:text-xl">{error ? "Erro no agendamento" : step === 4 ? "Confirmação" : shop.name}</DrawerTitle><DrawerDescription className="mt-1 text-[11px] text-zinc-400">{error ? "Não foi possível concluir a reserva." : step === 1 ? "Serviço, dia e horário." : step === 2 ? "Escolhe o barbeiro." : step === 3 ? "Confirma os teus dados." : "O teu horário ficou reservado."}</DrawerDescription></div>
            {!error && step < 4 && <div className="flex shrink-0 gap-1" aria-label={`Passo ${step} de 3`}>{[1,2,3].map((item) => <span key={item} className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${step >= item ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-500"}`}>{item}</span>)}</div>}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-4 sm:px-4 sm:py-4">
          {error ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center"><div className="flex size-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400"><XCircle className="size-7" /></div><div><h3 className="font-semibold">Não foi possível reservar</h3><p className="mt-1 max-w-sm text-xs text-zinc-400">{error}</p></div></div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <section><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><Scissors className="size-3.5" /> Serviço</div><div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{services.map((item) => <button key={item.id} type="button" onClick={() => setServiceId(item.id)} className={`min-w-[148px] shrink-0 snap-start touch-manipulation rounded-xl border p-3 text-left transition ${serviceId === item.id ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}><span className="block truncate text-sm font-bold">{item.name}</span><span className={`mt-2 block text-xs ${serviceId === item.id ? "text-zinc-700" : "text-zinc-400"}`}>{item.durationMinutes} min · €{Number(item.price ?? 0).toFixed(2)}</span></button>)}</div></section>

              <section><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400"><span>Dia</span><span className="text-[10px] font-normal normal-case text-zinc-500">Desliza</span></div><div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{days.map((day, index) => { const closed = shopClosedDays.has(new Date(`${day.dateStr}T12:00:00`).getDay()); return <button key={day.dateStr} type="button" onClick={() => setDayIndex(index)} className={`min-w-[62px] shrink-0 snap-start touch-manipulation rounded-xl border px-2.5 py-2.5 text-center ${closed ? index === dayIndex ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-amber-500/20 bg-amber-500/[0.04] text-zinc-400" : index === dayIndex ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}><span className="block text-[10px] font-bold uppercase">{day.isToday ? "Hoje" : day.weekdayShort}</span><span className="mt-1 block text-lg font-black">{day.dayNumeric}</span>{closed && <span className="mt-0.5 block text-[8px] font-semibold uppercase text-amber-400">Folga</span>}</button>; })}</div>{closedDay && <div className="mt-3 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" /><div><p className="text-xs font-semibold text-amber-200">Dia de folga</p><p className="mt-1 text-[11px] text-amber-100/60">A barbearia não aceita marcações neste dia.</p></div></div>}{blocked.length > 0 && !closedDay && <div className="mt-3 space-y-2">{blocked.map((block) => <div key={block.id} className="flex gap-3 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-3"><Clock className="mt-0.5 size-4 shrink-0 text-orange-400" /><div><p className="text-xs font-semibold text-orange-200">Horário bloqueado</p><p className="mt-1 text-[11px] text-orange-100/60">{block.allDay ? "Todo o dia" : `${block.startTime}–${block.endTime}`} · {block.reason}</p></div></div>)}</div>}</section>

              <section><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><Clock className="size-3.5" /> Horários</div>{loading && <Loader2 className="size-4 animate-spin text-zinc-500" />}</div>{closed || slots.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">{loading ? <Loader2 className="mx-auto size-5 animate-spin text-zinc-500" /> : <><AlertCircle className="mx-auto size-6 text-zinc-500" /><p className="mt-2 text-sm font-medium">{closedDay ? "Barbearia fechada" : "Sem horários disponíveis"}</p><p className="mt-1 text-xs text-zinc-500">Os horários ocupados ou bloqueados não aparecem.</p></>}</div> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((slot) => <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`min-h-11 touch-manipulation rounded-xl border text-sm font-bold active:scale-[0.98] ${selectedSlot === slot ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}>{slot}</button>)}</div>}</section>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><UserCheck className="size-3.5" /> Profissional</div><button type="button" onClick={() => setProfessional("any")} className={`flex w-full touch-manipulation items-center justify-between rounded-xl border p-4 text-left ${professional === "any" ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}><div><div className="text-sm font-bold">Sem preferência</div><div className={`text-xs ${professional === "any" ? "text-zinc-700" : "text-zinc-500"}`}>Qualquer profissional disponível</div></div>{professional === "any" && <Check className="size-4" />}</button>{professionals.map((item) => <button key={item.id} type="button" onClick={() => setProfessional(item)} className={`flex w-full touch-manipulation items-center justify-between rounded-xl border p-4 text-left ${professional !== "any" && professional.id === item.id ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}><div><div className="text-sm font-bold">{item.name}</div><div className={`text-xs ${professional !== "any" && professional.id === item.id ? "text-zinc-700" : "text-zinc-500"}`}>{item.role || "Barbeiro Profissional"}</div></div>{professional !== "any" && professional.id === item.id && <Check className="size-4" />}</button>)}<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500"><span>Horário</span>{loading && <Loader2 className="size-3.5 animate-spin" />}</div><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-zinc-100">{selectedSlot || "Nenhum horário"}</p><p className="text-xs text-zinc-500">{currentDay.fullDateFormatted}</p></div>{selectedSlot ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Disponível</span> : <span className="text-[10px] text-zinc-500">Volta atrás para escolher</span>}</div></div></div>
          ) : step === 3 ? (
            <div className="space-y-5"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs"><div className="flex items-center justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Serviço</span><span className="max-w-[65%] truncate text-right font-semibold">{service?.name}</span></div><div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Data</span><span className="max-w-[65%] text-right font-semibold">{currentDay.fullDateFormatted}</span></div><div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-zinc-500">Hora</span><span className="font-semibold">{selectedSlot}</span></div><div className="flex items-center justify-between gap-3 pt-2"><span className="text-zinc-500">Profissional</span><span className="max-w-[65%] truncate text-right font-semibold">{professional === "any" ? "Sem preferência" : professional.name}</span></div></div><div className="min-w-0 space-y-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"><User className="size-3.5" /> Os teus dados</div><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome completo *" className="box-border h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" /><div className="grid min-w-0 gap-3 sm:grid-cols-2"><input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="Telemóvel *" className="box-border h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" /><div className="min-w-0"><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="Email *" className="box-border h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" /><p className="mt-1 text-[10px] leading-4 text-zinc-600">Podes usar o mesmo email em várias marcações.</p></div></div><div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"><label htmlFor="booking-birth-date" className="mb-1.5 block text-xs font-semibold text-zinc-200">Data de nascimento <span className="text-white">*</span></label><input id="booking-birth-date" type="date" value={birthDate} max={todayIso} min="1900-01-01" onChange={(event) => setBirthDate(event.target.value)} autoComplete="bday" required className="box-border block h-12 w-full min-w-0 max-w-full appearance-none rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20" /><p className="mt-1.5 text-[11px] leading-4 text-zinc-500">Usamos a tua data de nascimento apenas para questões de estatística.</p></div></div></div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="size-8" /></div><div><h3 className="text-xl font-bold">Tudo pronto e reservado!</h3><p className="mt-1 text-xs text-zinc-500">O teu horário foi garantido.</p></div><div className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs"><Mail className="mt-0.5 size-4 text-zinc-400" /><span>Enviámos a confirmação para <strong className="break-all text-white">{email}</strong>.</span></div></div>
          )}
        </div>

        <DrawerFooter className="shrink-0 border-t border-white/10 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
          <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
            {error ? (
              <>
                <DrawerClose asChild><Button variant="outline" className="min-h-11 flex-1">Fechar</Button></DrawerClose>
                <Button className="min-h-11 flex-1" onClick={() => { setError(""); setStep(1); }}>Tentar de novo</Button>
              </>
            ) : step === 4 ? (
              <Button onClick={onClose} className="min-h-11 w-full bg-white font-bold text-zinc-950">Concluir</Button>
            ) : (
              <>
                {step === 1 ? <DrawerClose asChild><Button variant="ghost" className="min-h-11 flex-1 sm:flex-none">Cancelar</Button></DrawerClose> : <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="min-h-11 flex-1 sm:flex-none"><ChevronLeft className="mr-1.5 size-4" />Voltar</Button>}
                {step < 3 ? (
                  <Button disabled={step === 1 ? !stepOneReady || loading : !stepTwoReady || loading} onClick={() => setStep((step + 1) as 2 | 3)} className="min-h-11 flex-[1.4] bg-white font-bold text-zinc-950">Próximo<ChevronRight className="ml-1.5 size-4" /></Button>
                ) : (
                  <Button disabled={!selectedSlot || !name.trim() || !phone.trim() || !email.trim() || !birthDate || !validBirthDate(birthDate) || submitting} onClick={submit} className="min-h-11 flex-[1.4] bg-white font-bold text-zinc-950">{submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}Confirmar (€{service ? Number(service.price ?? 0).toFixed(2) : "0.00"})</Button>
                )}
              </>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default BookingDrawerOptimized;
