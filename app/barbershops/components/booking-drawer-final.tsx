'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Scissors,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import type {
  BookingDayOption,
  BookingDrawerProps,
  MarketplaceBookingResponse,
  MarketplaceProfessional,
} from '@/types/marketplace/booking';
import type { MarketplaceService } from '@/types/marketplace/shops';

const DAY_INDEX: Record<string, number> = {
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

type Step = 1 | 2 | 3 | 4;

function buildDays(count = 14): BookingDayOption[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const full = date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return {
      dateStr,
      weekdayShort: date
        .toLocaleDateString('pt-PT', { weekday: 'short' })
        .replace('.', '')
        .toUpperCase(),
      dayNumeric: date.getDate(),
      fullDateFormatted: full.charAt(0).toUpperCase() + full.slice(1),
      isToday: index === 0,
    };
  });
}

function parseBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return '';
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const date = new Date(year, month - 1, day, 12);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    year < 1900 ||
    date > new Date()
  ) {
    return '';
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function closedForDay(shop: BookingDrawerProps['shop'], day: BookingDayOption) {
  const raw = shop?.closed_days ?? shop?.closedDays ?? shop?.off_days;
  const values = typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : [];
  const weekday = new Date(`${day.dateStr}T12:00:00`).getDay();
  return values.some(
    (value) =>
      (typeof value === 'number' && value === weekday) ||
      DAY_INDEX[String(value).trim().toLowerCase()] === weekday,
  );
}

export function BookingDrawerFinal({
  shop,
  isOpen,
  onClose,
  onSuccess,
  selectedServiceId = null,
}: BookingDrawerProps) {
  const days = useMemo(() => buildDays(), []);
  const [step, setStep] = useState<Step>(1);
  const [dayIndex, setDayIndex] = useState(0);
  const [professional, setProfessional] = useState<MarketplaceProfessional | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(selectedServiceId);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(
    new Map<string, { data: MarketplaceBookingResponse; timestamp: number }>(),
  );

  const currentDay = days[dayIndex];
  const service = services.find((item) => item.id === serviceId) ?? null;
  const isClosed = closedForDay(shop, currentDay);

  useEffect(() => {
    if (!isOpen || !shop) return;
    setStep(1);
    setDayIndex(0);
    setProfessional(null);
    setServiceId(selectedServiceId);
    setServices([]);
    setProfessionals([]);
    setSlots([]);
    setSelectedSlot(null);
    setLoadingPeople(false);
    setLoadingSlots(false);
    setSubmitting(false);
    setError('');
    setName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    cacheRef.current.clear();
    controllerRef.current?.abort();
  }, [isOpen, selectedServiceId, shop]);

  useEffect(() => {
    if (!isOpen || !shop) return;
    const controller = new AbortController();
    setLoadingPeople(true);
    fetch(
      `/api/shops/${shop.id}/booking-data?date=${encodeURIComponent(currentDay.dateStr)}`,
      { signal: controller.signal, cache: 'no-store' },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar os barbeiros.');
        }
        return data as MarketplaceBookingResponse;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfessionals(data.professionals ?? []);
        setServices(data.services ?? []);
      })
      .catch((reason) => {
        if (reason?.name !== 'AbortError') {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar os barbeiros.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingPeople(false);
      });
    return () => controller.abort();
  }, [currentDay.dateStr, isOpen, shop]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [currentDay.dateStr, professional?.id, serviceId]);

  useEffect(() => {
    if (!isOpen || !shop || !professional || !serviceId || isClosed) {
      setSlots([]);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const key = `${shop.id}|${professional.id}|${serviceId}|${currentDay.dateStr}`;
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < 8000) {
      setSlots(cached.data.availableSlots ?? []);
      setLoadingSlots(false);
      return () => controller.abort();
    }

    setLoadingSlots(true);
    fetch(
      `/api/shops/${shop.id}/booking-data?date=${encodeURIComponent(currentDay.dateStr)}&professionalId=${encodeURIComponent(professional.id)}&serviceId=${encodeURIComponent(serviceId)}`,
      { signal: controller.signal, cache: 'no-store' },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar os horários.');
        }
        return data as MarketplaceBookingResponse;
      })
      .then((data) => {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
        setSlots(data.availableSlots ?? []);
      })
      .catch((reason) => {
        if (reason?.name !== 'AbortError') {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar os horários.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [currentDay.dateStr, isClosed, isOpen, professional, serviceId, shop]);

  function continueStepOne() {
    if (!professional) return toast.error('Escolhe um barbeiro.');
    if (isClosed) return toast.error('A barbearia está fechada nesse dia.');
    if (!service) return toast.error('Escolhe o serviço.');
    setStep(2);
  }

  function continueStepTwo() {
    if (!selectedSlot) return toast.error('Escolhe um horário disponível.');
    setStep(3);
  }

  async function submit() {
    const parsedBirthDate = parseBirthDate(birthDate);
    if (!shop || !professional || !service || !selectedSlot) return;
    if (!name.trim() || !phone.trim() || !email.trim()) {
      return toast.error('Preenche todos os campos obrigatórios.');
    }
    if (!parsedBirthDate) return toast.error('Indica uma data de nascimento válida.');

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          service: service.id,
          date: currentDay.dateStr,
          slot: selectedSlot,
          professionalId: professional.id,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim(),
          customerBirthDate: parsedBirthDate,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível concluir a marcação.');
      }
      cacheRef.current.clear();
      setStep(4);
      toast.success('Agendamento efetuado com sucesso!');
      onSuccess?.({
        shopName: shop.name,
        serviceName: service.name,
        date: currentDay.dateStr,
        time: selectedSlot,
        customerEmail: email.trim(),
      });
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : 'Não foi possível concluir a marcação.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border-white/10 bg-zinc-950 text-zinc-100 sm:h-auto sm:max-h-[90dvh] sm:rounded-t-3xl">
        <header className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Agendamento</p>
              <h2 className="mt-1 text-lg font-semibold">
                {step === 4 ? 'Reserva confirmada' : shop?.name ?? 'Agendamento'}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {step === 1
                  ? 'Escolhe o barbeiro, o dia e o serviço.'
                  : step === 2
                    ? 'Agora escolhe um horário.'
                    : step === 3
                      ? 'Confirma os teus dados.'
                      : 'O teu horário ficou reservado.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar agendamento"
              className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {step < 4 && (
            <div className="mt-4 grid grid-cols-3 gap-1.5" aria-label={`Passo ${step} de 3`}>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`h-1 rounded-full ${step >= item ? 'bg-emerald-300' : 'bg-white/10'}`}
                />
              ))}
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          {error ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center" role="alert">
              <XCircle className="size-8 text-red-400" aria-hidden="true" />
              <p className="max-w-sm text-sm text-zinc-400">{error}</p>
              <Button variant="outline" onClick={() => setError('')}>Tentar novamente</Button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <section aria-labelledby="booking-professional-title">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound className="size-4 text-emerald-300" aria-hidden="true" />
                  <h3 id="booking-professional-title" className="text-sm font-semibold">1. Barbeiro</h3>
                </div>
                {loadingPeople ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 p-4 text-sm text-zinc-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> A carregar barbeiros…
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {professionals.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={professional?.id === item.id}
                        onClick={() => setProfessional(item)}
                        className={`flex min-h-16 w-full items-center justify-between rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${professional?.id === item.id ? 'border-emerald-400/40 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}
                      >
                        <span>
                          <span className="block text-sm font-semibold">{item.name}</span>
                          <span className="mt-0.5 block text-xs text-zinc-500">{item.role || 'Barbeiro profissional'}</span>
                        </span>
                        {professional?.id === item.id && <Check className="size-5 text-emerald-300" aria-hidden="true" />}
                      </button>
                    ))}
                    {!professionals.length && (
                      <p className="rounded-2xl border border-white/10 p-4 text-sm text-zinc-500">
                        Não existem barbeiros disponíveis para agendamento.
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section aria-labelledby="booking-day-title">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="size-4 text-emerald-300" aria-hidden="true" />
                  <h3 id="booking-day-title" className="text-sm font-semibold">2. Dia</h3>
                </div>
                <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {days.map((day, index) => {
                    const closed = closedForDay(shop, day);
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        aria-pressed={dayIndex === index}
                        onClick={() => setDayIndex(index)}
                        className={`min-w-[68px] rounded-2xl border px-2 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${dayIndex === index ? 'border-emerald-400/40 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}
                      >
                        <span className="block text-[10px] font-bold text-zinc-500">{day.isToday ? 'HOJE' : day.weekdayShort}</span>
                        <span className="mt-1 block text-xl font-black">{day.dayNumeric}</span>
                        {closed && <span className="mt-0.5 block text-[8px] font-semibold text-amber-300">FECHADO</span>}
                      </button>
                    );
                  })}
                </div>
                {isClosed && (
                  <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs text-amber-100">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                    A barbearia não aceita marcações neste dia.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4" aria-labelledby="booking-service-title">
                <div className="mb-3 flex items-center gap-2">
                  <Scissors className="size-4 text-zinc-400" aria-hidden="true" />
                  <h3 id="booking-service-title" className="text-sm font-semibold">3. Serviço</h3>
                </div>
                <select
                  aria-label="Escolher serviço"
                  value={serviceId ?? ''}
                  onChange={(event) => setServiceId(event.target.value || null)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="">Seleciona um serviço</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.durationMinutes} min · €{Number(item.price ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </section>

              <Button
                type="button"
                onClick={continueStepOne}
                disabled={loadingPeople || !professionals.length || !service}
                className="min-h-11 w-full rounded-xl bg-zinc-100 font-semibold text-zinc-950 hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Continuar <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="grid gap-3 text-xs sm:grid-cols-3">
                  <div><p className="text-zinc-500">Barbeiro</p><p className="mt-1 font-semibold text-zinc-100">{professional?.name}</p></div>
                  <div><p className="text-zinc-500">Dia</p><p className="mt-1 font-semibold text-zinc-100">{currentDay.fullDateFormatted}</p></div>
                  <div><p className="text-zinc-500">Serviço</p><p className="mt-1 font-semibold text-zinc-100">{service?.name}</p></div>
                </div>
              </div>
              <section aria-labelledby="booking-slots-title">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-emerald-300" aria-hidden="true" />
                    <h3 id="booking-slots-title" className="text-sm font-semibold">Horários disponíveis</h3>
                  </div>
                  {loadingSlots && <Loader2 className="size-4 animate-spin text-zinc-500" aria-label="A carregar horários" />}
                </div>
                {loadingSlots ? (
                  <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-zinc-500">A procurar horários…</div>
                ) : slots.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={selectedSlot === slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`min-h-11 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${selectedSlot === slot ? 'border-emerald-400/40 bg-emerald-300 text-zinc-950' : 'border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 p-6 text-center">
                    <Clock3 className="mx-auto size-6 text-zinc-600" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium">Sem horários disponíveis</p>
                    <p className="mt-1 text-xs text-zinc-500">Experimenta outro dia ou barbeiro.</p>
                  </div>
                )}
              </section>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="min-h-11 rounded-xl">
                  <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Voltar
                </Button>
                <Button type="button" onClick={continueStepTwo} disabled={!selectedSlot} className="min-h-11 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white">
                  Continuar <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-500">Reserva</p>
                    <p className="mt-1 text-sm font-semibold">{professional?.name} · {currentDay.fullDateFormatted} · {selectedSlot}</p>
                    <p className="mt-1 text-xs text-zinc-500">{service?.name}</p>
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-300" aria-hidden="true" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="grid gap-1.5 text-xs text-zinc-500">Nome<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
                <label className="grid gap-1.5 text-xs text-zinc-500">Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" required className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
                <label className="grid gap-1.5 text-xs text-zinc-500">Email<input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" type="email" required className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
                <label className="grid gap-1.5 text-xs text-zinc-500">Data de nascimento<input value={birthDate} onChange={(event) => setBirthDate(event.target.value.replace(/[^0-9/]/g, '').slice(0, 10))} inputMode="numeric" placeholder="DD/MM/AAAA" required className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="min-h-11 rounded-xl">
                  <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Voltar
                </Button>
                <Button type="button" onClick={() => void submit()} disabled={submitting} className="min-h-11 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> A reservar…</> : 'Confirmar reserva'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                <CheckCircle2 className="size-8 text-emerald-300" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Reserva confirmada</h3>
                <p className="mt-1 text-sm text-zinc-400">{currentDay.fullDateFormatted} às {selectedSlot}</p>
                <p className="mt-1 text-xs text-zinc-500">{professional?.name} · {service?.name}</p>
              </div>
              <Button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white">Fechar</Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
