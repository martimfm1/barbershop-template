"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Clock3, Loader2, Mail, Scissors, UserRound, X, XCircle } from "lucide-react";
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
    return { dateStr, weekdayShort: date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").toUpperCase(), dayNumeric: date.getDate(), fullDateFormatted: full.charAt(0).toUpperCase() + full.slice(1), isToday: index === 0 };
  });
}

function parseBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const display = digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length !== 8) return { display, iso: "" };
  const day = Number(digits.slice(0, 2)); const month = Number(digits.slice(2, 4)); const year = Number(digits.slice(4));
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || year < 1900 || date > new Date()) return { display, iso: "" };
  return { display, iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}

export function BookingDrawerBarberAvailability({ shop, isOpen, onClose, onSuccess, selectedServiceId = null }: BookingDrawerProps) {
  const days = useMemo(() => nextDays(), []);
  const [step, setStep] = useState<Step>(1);
  const [dayIndex, setDayIndex] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(selectedServiceId);
  const [professional, setProfessional] = useState<MarketplaceProfessional | "any">("any");
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [professionalAvailability, setProfessionalAvailability] = useState<Record<string, string[]>>({});
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState(""); const [birthDateIso, setBirthDateIso] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, { data: MarketplaceBookingResponse; timestamp: number }>());

  const currentDay = days[dayIndex];
  const professionalId = professional === "any" ? null : professional.id;
  const service = services.find((item) => item.id === serviceId) ?? null;
  const shopClosedDays = useMemo(() => {
    const raw = (shop as any)?.closed_days ?? (shop as any)?.closedDays ?? (shop as any)?.off_days;
    const values = typeof raw === "string" ? raw.split(",") : Array.isArray(raw) ? raw : [];
    const set = new Set<number>();
    for (const value of values) { const key = String(value).trim().toLowerCase(); if (typeof value === "number" && value >= 0 && value <= 6) set.add(value); else if (DAY_INDEX[key] !== undefined) set.add(DAY_INDEX[key]); }
    return set;
  }, [shop]);
  const selectedDateClosed = shopClosedDays.has(new Date(`${currentDay.dateStr}T12:00:00`).getDay());

  useEffect(() => {
    if (!isOpen) return;
    setStep(1); setDayIndex(0); setServiceId(selectedServiceId); setProfessional("any"); setServices([]); setProfessionals([]); setProfessionalAvailability({}); setSlots([]); setSelectedSlot(null); setClosed(false); setClosedDay(false); setLoading(false); setSubmitting(false); setError(""); setName(""); setPhone(""); setEmail(""); setBirthDate(""); setBirthDateIso("");
    cacheRef.current.clear(); controllerRef.current?.abort();
  }, [isOpen, selectedServiceId]);

  useEffect(() => {
    if (!isOpen || !shop) return;
    controllerRef.current?.abort();
    const controller = new AbortController(); controllerRef.current = controller;
    let mounted = true;
    const key = `${shop.id}|${currentDay.dateStr}|${serviceId ?? ""}|${professionalId ?? ""}`;
    const cached = cacheRef.current.get(key);
    const apply = (data: MarketplaceBookingResponse) => { if (!mounted) return; setServices(data.services ?? []); setProfessionals(data.professionals ?? []); setProfessionalAvailability(data.professionalAvailability ?? {}); setSlots(data.availableSlots ?? []); setClosed(Boolean(data.isClosed) || selectedDateClosed); setClosedDay(Boolean(data.closedDay) || selectedDateClosed); setSelectedSlot((current) => current && (data.availableSlots ?? []).includes(current) ? current : null); };
    if (cached && Date.now() - cached.timestamp < 8000) { apply(cached.data); return () => { mounted = false; }; }
    setLoading(true); setError("");
    const params = new URLSearchParams({ date: currentDay.dateStr }); if (serviceId) params.set("serviceId", serviceId); if (professionalId) params.set("professionalId", professionalId);
    fetch(`/api/shops/${shop.id}/booking-data?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => { const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a disponibilidade."); return data as MarketplaceBookingResponse; })
      .then((data) => { if (!mounted) return; cacheRef.current.set(key, { data, timestamp: Date.now() }); apply(data); })
      .catch((reason) => { if (!mounted || reason?.name === "AbortError") return; setError(reason instanceof Error ? reason.message : "Não foi possível carregar a disponibilidade."); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; controller.abort(); };
  }, [isOpen, shop, currentDay.dateStr, serviceId, professionalId, selectedDateClosed]);

  function selectSlot(slot: string) { setSelectedSlot(slot); setProfessional("any"); }
  function chooseProfessional(item: MarketplaceProfessional | "any") { setProfessional(item); }
  function handleBirthDate(value: string) { const parsed = parseBirthDate(value); setBirthDate(parsed.display); setBirthDateIso(parsed.iso); }

  async function submit() {
    if (!shop || !service || !selectedSlot) return;
    if (!name.trim() || !phone.trim() || !email.trim() || !birthDateIso) return toast.error("Preenche todos os campos obrigatórios.");
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId: shop.id, service: service.id, date: currentDay.dateStr, slot: selectedSlot, professionalId, customerName: name.trim(), customerPhone: phone.trim(), customerEmail: email.trim(), customerBirthDate: birthDateIso }) });
      const data = await res.json().catch(() => ({})); if (!res.ok || !data.success) throw new Error(data.error || "Não foi possível concluir a marcação.");
      cacheRef.current.clear(); setStep(4); toast.success("Agendamento efetuado com sucesso!"); onSuccess?.({ shopName: shop.name, serviceName: service.name, date: currentDay.dateStr, time: selectedSlot, customerEmail: email.trim() });
    } catch (reason) { const message = reason instanceof Error ? reason.message : "Não foi possível concluir a marcação."; setError(message); toast.error(message); } finally { setSubmitting(false); }
  }

  if (!shop) return null;
  const selectedProfessionalAvailable = professional === "any" ? true : Boolean(professionalAvailability[professional.id]?.includes(selectedSlot ?? ""));

  return <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DrawerContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border-white/10 bg-zinc-950 text-zinc-100 sm:h-auto sm:max-h-[90dvh] sm:rounded-t-3xl">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Reserva</p><h2 className="mt-1 truncate text-base font-semibold sm:text-xl">{step === 4 ? "Reserva confirmada" : shop.name}</h2><p className="mt-1 text-xs text-zinc-400">{step === 1 ? "Escolhe serviço, dia e hora." : step === 2 ? "Vê quem está disponível para o horário." : step === 3 ? "Confirma os teus dados." : "O teu horário está reservado."}</p></div><button type="button" onClick={onClose} aria-label="Fechar reserva" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><X className="size-4" /></button></div>
          {step < 4 && <div className="mt-4 grid grid-cols-3 gap-1.5" aria-label={`Passo ${step} de 3`}>{[1,2,3].map((item) => <div key={item} className={`h-1.5 rounded-full ${step >= item ? "bg-emerald-300" : "bg-white/10"}`} />)}</div>}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-6 sm:px-5">
          {error && <div className="mb-4 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4"><XCircle className="mt-0.5 size-5 shrink-0 text-red-400" /><div><p className="text-sm font-semibold text-red-200">Não foi possível carregar</p><p className="mt-1 text-xs leading-5 text-red-100/70">{error}</p></div></div>}

          {step === 1 && <div className="space-y-5">
            <section><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><Scissors className="size-3.5" /> Serviço</div><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{services.length ? services.map((item) => <button key={item.id} type="button" onClick={() => { setServiceId(item.id); setSelectedSlot(null); }} className={`min-w-[155px] shrink-0 rounded-2xl border p-3 text-left touch-manipulation ${serviceId === item.id ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}><span className="block truncate text-sm font-semibold">{item.name}</span><span className={`mt-2 block text-xs ${serviceId === item.id ? "text-zinc-700" : "text-zinc-500"}`}>{item.durationMinutes} min · €{Number(item.price ?? 0).toFixed(2)}</span></button>) : <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">{loading ? "A carregar serviços…" : "Não existem serviços disponíveis."}</div>}</div></section>
            <section><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><span>Dia</span><span className="text-[10px] normal-case tracking-normal text-zinc-500">Desliza</span></div><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{days.map((day, index) => <button key={day.dateStr} type="button" onClick={() => { setDayIndex(index); setSelectedSlot(null); }} className={`min-w-[64px] shrink-0 rounded-2xl border px-2 py-3 text-center touch-manipulation ${index === dayIndex ? "border-white/50 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200"}`}><span className="block text-[10px] font-bold uppercase">{day.isToday ? "Hoje" : day.weekdayShort}</span><span className="mt-1 block text-lg font-black">{day.dayNumeric}</span></button>)}</div>{closedDay && <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-amber-100"><div className="flex gap-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-300" /><span>A barbearia não aceita marcações neste dia.</span></div></div>}</section>
            <section><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"><Clock3 className="size-3.5" /> Horário</div>{loading && <Loader2 className="size-4 animate-spin text-zinc-500" />}</div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.length ? slots.map((slot) => <button key={slot} type="button" onClick={() => selectSlot(slot)} className={`min-h-11 rounded-xl border text-sm font-semibold transition ${selectedSlot === slot ? "border-emerald-300 bg-emerald-300 text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20"}`}>{slot}</button>) : <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-zinc-500">{loading ? "A procurar horários…" : "Não existem horários disponíveis."}</div>}</div></section>
            <Button type="button" className="min-h-12 w-full" disabled={!selectedSlot || closed || loading} onClick={() => setStep(2)}>Escolher barbeiro</Button>
          </div>}

          {step === 2 && <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Horário selecionado</p><p className="mt-1 text-lg font-semibold text-white">{currentDay.fullDateFormatted} · {selectedSlot}</p><p className="mt-1 text-xs text-zinc-500">{service?.name ?? "Serviço"}</p></div>
            <button type="button" onClick={() => chooseProfessional("any")} className={`w-full rounded-2xl border p-4 text-left ${professional === "any" ? "border-emerald-300/40 bg-emerald-300/[0.08]" : "border-white/10 bg-white/[0.025]"}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><UserRound className="size-4" /></div><div><p className="text-sm font-semibold">Qualquer barbeiro</p><p className="text-xs text-zinc-500">Escolhe automaticamente um profissional disponível.</p></div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200">Disponível</span></div></button>
            {professionals.map((item) => { const available = Boolean(professionalAvailability[item.id]?.includes(selectedSlot ?? "")); const selected = professional !== "any" && professional.id === item.id; return <button key={item.id} type="button" disabled={!available} onClick={() => chooseProfessional(item)} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-emerald-300/50 bg-emerald-300/[0.08]" : available ? "border-white/10 bg-white/[0.025] hover:border-white/20" : "cursor-not-allowed border-white/5 bg-white/[0.015] opacity-60"}`}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold">{item.name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.name}</p><p className="mt-0.5 text-xs text-zinc-500">{item.role ?? "Barbeiro"}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${available ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border border-red-400/15 bg-red-400/[0.06] text-red-300"}`}>{available ? "Disponível" : "Ocupado"}</span></div></button>; })}
            {!professionals.length && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-amber-100">Não existem perfis de barbeiro configurados para esta barbearia.</div>}
            <div className="grid grid-cols-2 gap-2 pt-2"><Button type="button" variant="outline" className="min-h-12 border-white/10 bg-transparent text-white" onClick={() => setStep(1)}><ChevronLeft className="mr-2 size-4" />Voltar</Button><Button type="button" className="min-h-12" disabled={!selectedSlot || professional !== "any" && !selectedProfessionalAvailable} onClick={() => setStep(3)}>Continuar<ChevronRight className="ml-2 size-4" /></Button></div>
          </div>}

          {step === 3 && <div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Resumo</p><p className="mt-1 text-sm font-semibold text-white">{service?.name} · {currentDay.fullDateFormatted} · {selectedSlot}</p><p className="mt-1 text-xs text-zinc-500">{professional === "any" ? "Qualquer barbeiro" : professional.name}</p></div><label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Nome</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Telefone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Data de nascimento</span><input value={birthDate} onChange={(e) => { const parsed = parseBirthDate(e.target.value); setBirthDate(parsed.display); setBirthDateIso(parsed.iso); }} inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" aria-describedby="birth-help" className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" /><p id="birth-help" className="mt-1 text-[11px] text-zinc-500">Formato: dia/mês/ano. Usamos a data para funcionalidades como fidelização e aniversários.</p></label><div className="grid grid-cols-2 gap-2 pt-2"><Button type="button" variant="outline" className="min-h-12 border-white/10 bg-transparent text-white" onClick={() => setStep(2)}>Voltar</Button><Button type="button" className="min-h-12" disabled={submitting || !name.trim() || !phone.trim() || !email.trim() || !birthDateIso} onClick={() => void submit()}>{submitting ? <Loader2 className="size-4 animate-spin" /> : "Confirmar marcação"}</Button></div></div>}

          {step === 4 && <div className="flex flex-col items-center gap-5 py-10 text-center"><div className="flex size-16 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Check className="size-7" /></div><div><h3 className="text-xl font-semibold">Reserva confirmada</h3><p className="mt-2 text-sm text-zinc-400">Receberás a confirmação no email {email}.</p></div><div className="w-full rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left"><p className="text-sm font-semibold text-white">{service?.name}</p><p className="mt-1 text-xs text-zinc-500">{currentDay.fullDateFormatted} · {selectedSlot} · {professional === "any" ? "Qualquer barbeiro" : professional.name}</p></div><Button type="button" className="min-h-12 w-full" onClick={onClose}>Concluir</Button></div>}
        </main>
      </div>
    </DrawerContent>
  </Drawer>;
}
