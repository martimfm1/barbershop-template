"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock3, LogOut, Mail, MapPin, RefreshCw, ShieldCheck, X, XCircle } from "lucide-react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  dateHour: string;
  durationMinutes: number;
  status: string;
  serviceName: string;
  servicePrice: number;
  professionalName: string | null;
  professionalId: string | null;
  barbershopName: string;
  barbershopAddress: string | null;
  cancellationHours: number;
};

type Availability = {
  date: string;
  availableSlots: string[];
  closedDay: boolean;
  blockedIntervals: Array<{ startTime: string | null; endTime: string | null; reason: string }>;
};

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
const statusLabel = (value: string) => ({ scheduled: "Confirmada", pending: "Pendente", cancelled: "Cancelada", completed: "Concluída" } as Record<string, string>)[value] ?? value;
const todayPortugal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(true);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/customer-portal/appointments", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setSessionEmail(null);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as marcações.");
      setSessionEmail(data.email ?? null);
      setUpcoming(data.upcoming ?? []);
      setPast(data.past ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as marcações.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/customer-portal/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o código.");
      setStep("code");
      toast.success("Código enviado. Verifica o teu email.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o código.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/customer-portal/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Código inválido.");
      await load();
      setCode("");
      toast.success("Email confirmado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (!window.confirm("Queres mesmo cancelar esta marcação?")) return;
    setActionId(id);
    try {
      const response = await fetch(`/api/customer-portal/appointments/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível cancelar.");
      await load();
      toast.success("Marcação cancelada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar.");
    } finally {
      setActionId(null);
    }
  }

  async function loadAvailability(date: string) {
    if (!reschedule || !date) return;
    setAvailabilityLoading(true);
    try {
      const response = await fetch(`/api/customer-portal/appointments/${reschedule.id}?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os horários.");
      setAvailability({ date, availableSlots: data.availableSlots ?? [], closedDay: Boolean(data.closedDay), blockedIntervals: data.blockedIntervals ?? [] });
    } catch (error) {
      setAvailability(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os horários.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function openReschedule(item: Appointment) {
    const initialDate = item.dateHour.slice(0, 10);
    setReschedule(item);
    setRescheduleDate(initialDate);
    setAvailability(null);
    void loadAvailability(initialDate);
  }

  async function applyReschedule(slot: string) {
    if (!reschedule || !rescheduleDate) return;
    setActionId(reschedule.id);
    try {
      const response = await fetch(`/api/customer-portal/appointments/${reschedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, slot }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível reagendar.");
      setReschedule(null);
      setAvailability(null);
      await load();
      toast.success("Marcação reagendada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reagendar.");
      await load();
    } finally {
      setActionId(null);
    }
  }

  async function logout() {
    await fetch("/api/customer-portal/logout", { method: "POST" });
    setSessionEmail(null);
    setUpcoming([]);
    setPast([]);
    setStep("email");
    setCode("");
    setReschedule(null);
  }

  const hasBookings = upcoming.length > 0 || past.length > 0;
  const minRescheduleDate = useMemo(() => todayPortugal(), []);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/barbershops" className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-500 hover:text-zinc-300">Explorar barbearias</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Gerir marcações</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Consulta, cancela ou reagenda as tuas marcações usando apenas o email associado às reservas. Não precisas de criar uma conta.</p>
          </div>
          {sessionEmail && <button onClick={logout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm hover:bg-white/5"><LogOut className="size-4" /> Sair</button>}
        </header>

        {!sessionEmail ? (
          <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-[1fr_.72fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[.03] p-6 shadow-2xl sm:p-8">
              {step === "email" ? (
                <form onSubmit={requestCode} className="space-y-5">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Mail className="size-5" /></div>
                  <div><h2 className="text-xl font-semibold">Começa pelo teu email</h2><p className="mt-1 text-sm leading-6 text-zinc-400">Usa o mesmo email que colocaste nas tuas marcações.</p></div>
                  <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@email.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 outline-none ring-0 placeholder:text-zinc-600 focus:border-white/30" />
                  <button disabled={busy} className="h-12 w-full rounded-xl bg-white font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "A processar…" : "Enviar código"}</button>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="space-y-5">
                  <div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><ShieldCheck className="size-5" /></div><div><h2 className="text-xl font-semibold">Confirma o teu email</h2><p className="text-sm text-zinc-400">Enviámos um código de 6 dígitos para {email}.</p></div></div>
                  <input required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-16 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-center text-3xl tracking-[.35em] outline-none focus:border-white/30" />
                  <button disabled={busy || code.length !== 6} className="h-12 w-full rounded-xl bg-white font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "A confirmar…" : "Confirmar email"}</button>
                  <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="w-full text-sm text-zinc-500 hover:text-zinc-300">Usar outro email</button>
                </form>
              )}
            </section>
            <aside className="rounded-3xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-zinc-500">Como funciona</p>
              <div className="mt-5 space-y-5">
                {["Introduz o email usado nas reservas.", "Recebe um código único por email.", "Acede às tuas marcações e gere-as num só lugar."] .map((item, index) => <div key={item} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{index + 1}</span><p className="text-sm leading-6 text-zinc-400">{item}</p></div>)}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">O email serve apenas para localizar as marcações associadas e confirmar que tens acesso a elas.</div>
            </aside>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-wide text-emerald-400">Email confirmado</p><p className="mt-1 text-sm text-zinc-200">{sessionEmail}</p></div><button onClick={() => void load()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs hover:bg-white/5"><RefreshCw className="size-3.5" /> Atualizar</button></div>

            <section>
              <div className="mb-4"><h2 className="text-xl font-semibold">Próximas marcações</h2><p className="mt-1 text-sm text-zinc-500">Aqui podes reagendar ou cancelar dentro das regras da barbearia.</p></div>
              {busy ? <div className="rounded-2xl border border-white/10 p-10 text-center text-sm text-zinc-500">A carregar as tuas marcações…</div> : upcoming.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center"><p className="font-medium">Não tens próximas marcações.</p><p className="mt-2 text-sm text-zinc-500">Podes explorar as barbearias e fazer uma nova reserva com o mesmo email.</p><Link href="/barbershops" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950">Explorar barbearias</Link></div> : <div className="grid gap-4 lg:grid-cols-2">{upcoming.map((item) => <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[.03] p-5 shadow-xl"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs uppercase tracking-wide text-zinc-500">{item.barbershopName}</p><h3 className="mt-1 truncate font-semibold">{item.serviceName}</h3></div><span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">{statusLabel(item.status)}</span></div><div className="mt-5 space-y-3 text-sm text-zinc-300"><div className="flex gap-3"><CalendarDays className="size-4 shrink-0 text-zinc-500"/><span className="capitalize">{formatDate(item.dateHour)}</span></div><div className="flex gap-3"><Clock3 className="size-4 shrink-0 text-zinc-500"/><span>{item.durationMinutes} min{item.professionalName ? ` · ${item.professionalName}` : " · Qualquer barbeiro"}</span></div>{item.barbershopAddress && <div className="flex gap-3"><MapPin className="size-4 shrink-0 text-zinc-500"/><span>{item.barbershopAddress}</span></div>}</div><div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => openReschedule(item)} disabled={actionId === item.id} className="min-h-11 rounded-xl border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50">Reagendar</button><button onClick={() => void cancel(item.id)} disabled={actionId === item.id} className="min-h-11 rounded-xl border border-red-400/20 text-sm text-red-300 hover:bg-red-500/5 disabled:opacity-50">{actionId === item.id ? "A processar…" : "Cancelar"}</button></div><p className="mt-3 text-xs leading-5 text-zinc-600">Cancelamento/reagendamento sujeito ao limite de {item.cancellationHours}h definido pela barbearia.</p></article>)}</div>}
            </section>

            <section>
              <div className="mb-4"><h2 className="text-xl font-semibold">Histórico</h2><p className="mt-1 text-sm text-zinc-500">Marcações concluídas e canceladas associadas a este email.</p></div>
              {!hasBookings || past.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Ainda não tens histórico.</div> : <div className="space-y-2">{past.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><XCircle className="mt-0.5 size-4 shrink-0 text-zinc-500"/><div className="min-w-0"><p className="truncate text-sm font-medium">{item.serviceName} · {item.barbershopName}</p><p className="mt-1 text-xs text-zinc-500">{formatDate(item.dateHour)} · {statusLabel(item.status)}</p></div></div><span className="text-xs text-zinc-600">{item.servicePrice.toFixed(2)} €</span></div>)}</div>}
            </section>
          </div>
        )}
      </div>

      {reschedule && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"><div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Reagendar</p><h2 id="reschedule-title" className="mt-1 text-xl font-semibold">Escolhe uma nova data e hora</h2><p className="mt-1 text-sm text-zinc-500">{reschedule.serviceName} · {reschedule.professionalName ?? "Qualquer barbeiro"}</p></div><button onClick={() => setReschedule(null)} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 hover:bg-white/5" aria-label="Fechar"><X className="size-4" /></button></div><div className="mt-6"><label htmlFor="reschedule-date" className="text-sm font-medium">Nova data</label><input id="reschedule-date" type="date" min={minRescheduleDate} value={rescheduleDate} onChange={(event) => { setRescheduleDate(event.target.value); void loadAvailability(event.target.value); }} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[.03] px-3 outline-none focus:border-white/30" /></div><div className="mt-6"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Horários disponíveis</p><p className="mt-1 text-xs text-zinc-500">Só aparecem horários compatíveis com o serviço e a agenda.</p></div>{availabilityLoading && <RefreshCw className="size-4 animate-spin text-zinc-500" />}</div>{availability?.closedDay ? <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">Este dia é de folga da barbearia.</div> : availability && availability.availableSlots.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">Não existem horários disponíveis neste dia.</div> : availability ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">{availability.availableSlots.map((slot) => <button key={slot} onClick={() => void applyReschedule(slot)} disabled={actionId === reschedule.id} className="min-h-11 rounded-xl border border-white/10 bg-white/[.02] text-sm hover:border-white/30 hover:bg-white/5 disabled:opacity-50">{slot}{slot === reschedule.dateHour.slice(11, 16) && rescheduleDate === reschedule.dateHour.slice(0, 10) ? <Check className="mx-auto mt-1 size-3 text-zinc-500"/> : null}</button>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">Escolhe uma data para ver os horários.</div>}{availability?.blockedIntervals?.length ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Horários bloqueados</p><div className="mt-2 space-y-1 text-xs text-zinc-400">{availability.blockedIntervals.map((block, index) => <p key={`${block.reason}-${index}`}>{block.reason}{block.startTime && block.endTime ? ` · ${block.startTime}–${block.endTime}` : " · todo o dia"}</p>)}</div></div> : null}</div><div className="mt-6 flex justify-end"><button onClick={() => setReschedule(null)} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm hover:bg-white/5">Fechar</button></div></div></div>}
    </main>
  );
}
