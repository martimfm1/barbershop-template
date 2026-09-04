'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Calendar,
  Clock3,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoyaltySummary } from '@/components/customer-portal/loyalty-summary';

type Appointment = {
  id: string;
  dateHour: string;
  durationMinutes: number;
  status: string;
  serviceName: string;
  professionalName: string | null;
  barbershopName: string;
  barbershopAddress: string | null;
};
type Availability = {
  date: string;
  availableSlots: string[];
  closedDay: boolean;
  blockedIntervals: Array<{
    startTime: string | null;
    endTime: string | null;
    reason: string;
  }>;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
const statusLabel = (value: string) =>
  (
    ({
      scheduled: 'Confirmada',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    }) as Record<string, string>
  )[value] ?? value;

export function MyBookingsPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/appointments', {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setSessionEmail(null);
        return;
      }
      if (!response.ok)
        throw new Error(
          data.error || 'Não foi possível carregar as marcações.',
        );
      setSessionEmail(data.email ?? null);
      setUpcoming(data.upcoming ?? []);
      setPast(data.past ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as marcações.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível enviar o código.');
      setStep('code');
      toast.success('Código enviado. Verifica o teu email.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o código.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Código inválido.');
      setCode('');
      await load();
      toast.success('Email confirmado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Código inválido.');
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!window.confirm('Queres mesmo cancelar esta marcação?')) return;
    setActionId(id);
    try {
      const response = await fetch(`/api/customer-portal/appointments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível cancelar.');
      await load();
      toast.success('Marcação cancelada.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível cancelar.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function getAvailability(item: Appointment, nextDate: string) {
    setAvailabilityLoading(true);
    try {
      const response = await fetch(
        `/api/customer-portal/appointments/${item.id}?date=${encodeURIComponent(nextDate)}`,
        { cache: 'no-store' },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível carregar os horários.');
      setAvailability({
        date: nextDate,
        availableSlots: data.availableSlots ?? [],
        closedDay: Boolean(data.closedDay),
        blockedIntervals: data.blockedIntervals ?? [],
      });
    } catch (error) {
      setAvailability(null);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os horários.',
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function openReschedule(item: Appointment) {
    const initial = item.dateHour.slice(0, 10);
    setReschedule(item);
    setDate(initial);
    setAvailability(null);
    void getAvailability(item, initial);
  }

  async function rescheduleTo(slot: string) {
    if (!reschedule) return;
    setActionId(reschedule.id);
    try {
      const response = await fetch(
        `/api/customer-portal/appointments/${reschedule.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, slot }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível reagendar.');
      setReschedule(null);
      setAvailability(null);
      await load();
      toast.success('Marcação reagendada.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível reagendar.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function logout() {
    await fetch('/api/customer-portal/logout', { method: 'POST' });
    setSessionEmail(null);
    setUpcoming([]);
    setPast([]);
    setStep('email');
    setCode('');
    setReschedule(null);
  }

  return (
    <div className="min-h-screen text-zinc-100 antialiased">
      <main className="mx-auto w-full max-w-6xl px-4 pb-6 pt-6 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/barbershops"
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
            >
              Explorar barbearias
            </Link>
            <h1 className="mt-3 text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
              As tuas marcações, num só lugar.
            </h1>
            <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">
              Confirma o email usado nas reservas para consultar, cancelar ou
              reagendar sem criar uma conta.
            </p>
          </div>
          {sessionEmail && (
            <button
              onClick={logout}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300 hover:bg-white/[0.06] sm:self-auto"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          )}
        </header>

        {!sessionEmail ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_0.68fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_38%),rgba(24,24,27,0.65)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-8">
              {step === 'email' ? (
                <form onSubmit={requestCode} className="space-y-5">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 backdrop-blur-2xl">
                    <Mail className="size-5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Passo 1
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Introduz o teu email
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Usa exatamente o email associado às tuas marcações.
                    </p>
                  </div>
                  <input
                    required
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@email.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 placeholder:text-zinc-600 outline-none focus:border-white/30"
                  />
                  <button
                    disabled={loading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 bg-zinc-950/20 backdrop-blur-2xl text-sm font-semibold disabled:opacity-30"
                  >
                    {loading ? 'A enviar…' : 'Enviar código'}
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="space-y-5">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
                    <ShieldCheck className="size-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Passo 2
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Confirma o teu email
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Enviámos um código de 6 dígitos para{' '}
                      <span className="text-zinc-200">{email}</span>.
                    </p>
                  </div>
                  <input
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    className="h-16 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-center text-3xl tracking-[0.3em] outline-none focus:border-white/30"
                  />
                  <button
                    disabled={loading || code.length !== 6}
                    className="h-12 w-full bg-zinc-950/40 backdrop-blur-2xl text-sm font-semibold text-zinc-100 disabled:opacity-50"
                  >
                    {loading ? 'A confirmar…' : 'Confirmar email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                    }}
                    className="w-full text-sm text-zinc-500 hover:text-zinc-300"
                  >
                    Usar outro email
                  </button>
                </form>
              )}
            </div>
            <aside className="rounded-[2rem] border border-white/10 backdrop-blur-2xl p-5 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Como funciona
              </p>
              <div className="mt-6 space-y-5">
                {[
                  'Introduz o email usado nas reservas.',
                  'Recebe um código único.',
                  'Vê e gere todas as marcações associadas.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-zinc-400">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">
                O portal usa o email apenas para confirmar que tens acesso às
                marcações associadas.
              </div>
            </aside>
          </section>
        ) : (
          <section className="space-y-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Acesso confirmado
                </p>
                <p className="mt-1 text-sm text-zinc-200">{sessionEmail}</p>
              </div>
              <button
                onClick={() => void load()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-zinc-300 hover:bg-white/5"
              >
                <RefreshCw className="size-3.5" />
                Atualizar
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr]">
              <div className="mb-5">
                <LoyaltySummary />
              </div>

              <div className="w-full space-y-6">
                {/* Cabeçalho da Secção com Badge Contador */}
                <div className="flex items-end justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Agenda
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Próximas marcações
                      </h2>
                      {!loading && upcoming.length > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs font-semibold text-zinc-300 backdrop-blur-md">
                          {upcoming.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Principal */}
                {loading ? (
                  <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] text-sm text-zinc-500 backdrop-blur-md">
                    A carregar as tuas marcações…
                  </div>
                ) : upcoming.length === 0 ? (
                  /* Estado Vazio (Empty State Clean) */
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] px-6 py-12 text-center backdrop-blur-sm sm:py-16">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400">
                      <Calendar className="size-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">
                      Não tens próximas marcações
                    </h3>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-400">
                      Explora as barbearias disponíveis e faz a tua reserva em
                      poucos segundos.
                    </p>
                    <Link
                      href="/barbershops"
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.98]"
                    >
                      Explorar barbearias
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                ) : (
                  /* Lista de Marcações (Full Width Clean Stream) */
                  <div className="grid gap-4">
                    {upcoming.map((item) => (
                      <article
                        key={item.id}
                        className="glassmorphism group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-2xl backdrop-blur-md transition-all duration-200 hover:border-white/20 sm:p-6"
                      >
                        {/* Topo do Card: Nome da Barbearia, Serviço e Status */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              {item.barbershopName}
                            </p>
                            <h3 className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
                              {item.serviceName}
                            </h3>
                          </div>
                          <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
                            {statusLabel(item.status)}
                          </span>
                        </div>

                        {/* Informações da Reserva (Grid em Pills Muted) */}
                        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-zinc-300">
                            <CalendarDays className="size-4 shrink-0 text-emerald-400" />
                            <span className="truncate font-medium">
                              {formatDate(item.dateHour)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-zinc-300">
                            <Clock3 className="size-4 shrink-0 text-emerald-400" />
                            <span className="truncate font-medium">
                              {item.durationMinutes} min
                              {item.professionalName
                                ? ` · ${item.professionalName}`
                                : ' · Qualquer barbeiro'}
                            </span>
                          </div>

                          {item.barbershopAddress && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-zinc-300 sm:col-span-1">
                              <MapPin className="size-4 shrink-0 text-emerald-400" />
                              <span className="truncate font-medium">
                                {item.barbershopAddress}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Ações (Alinhadas à direita em telas maiores) */}
                        <div className="mt-6 flex flex-col-reverse justify-end gap-2.5 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
                          <button
                            disabled={actionId === item.id}
                            onClick={() => void cancel(item.id)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 text-xs font-medium text-red-300 transition-all hover:bg-red-500/10 disabled:opacity-50 sm:w-auto"
                          >
                            Cancelar reserva
                          </button>
                          <button
                            disabled={actionId === item.id}
                            onClick={() => openReschedule(item)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                          >
                            Reagendar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {past.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Histórico
                </p>
                <div className="mt-3 grid gap-2">
                  {past.map((item) => (
                    <div
                      key={item.id}
                      className="glassmorphism flex items-center justify-between gap-4 border rounded-2xl border-white/8 bg-white/[0.02] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-300">
                          {item.serviceName} · {item.barbershopName}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                          {formatDate(item.dateHour)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </main>

      {reschedule && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reagendar marcação"
        >
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Reagendar
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Escolhe um novo horário
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {reschedule.serviceName} · {reschedule.barbershopName}
                </p>
              </div>
              <button
                onClick={() => setReschedule(null)}
                className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-6 block text-xs font-medium text-zinc-400">
              Nova data
              <input
                type="date"
                min={new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Europe/Lisbon',
                }).format(new Date())}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  void getAvailability(reschedule, event.target.value);
                }}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-zinc-100 outline-none focus:border-white/30"
              />
            </label>
            {availabilityLoading ? (
              <div className="py-10 text-center text-sm text-zinc-500">
                A procurar horários…
              </div>
            ) : availability?.closedDay ? (
              <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4 text-sm text-amber-100">
                Este dia está encerrado para reservas.
              </div>
            ) : availability && availability.availableSlots.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-medium text-zinc-400">
                  Horários disponíveis
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {availability.availableSlots.map((slot) => (
                    <button
                      key={slot}
                      disabled={actionId === reschedule.id}
                      onClick={() => void rescheduleTo(slot)}
                      className="min-h-11 rounded-xl border border-white/10 bg-white/[0.025] text-sm font-medium hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] disabled:opacity-50"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ) : availability ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
                Não há horários disponíveis nesta data. Escolhe outro dia.
              </div>
            ) : null}
            <p className="mt-6 text-xs leading-5 text-zinc-600">
              Os horários mostrados respeitam o funcionamento, pausas, folgas,
              bloqueios e marcações existentes da barbearia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
