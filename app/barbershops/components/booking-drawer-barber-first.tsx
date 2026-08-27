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
  Mail,
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
  terça: 2,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6,
  sabado: 6,
};
type Step = 1 | 2 | 3 | 4;

function nextDays(count = 10): BookingDayOption[] {
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

function birthDateIso(value: string) {
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
  )
    return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function BookingDrawerBarberFirst({
  shop,
  isOpen,
  onClose,
  onSuccess,
  selectedServiceId = null,
}: BookingDrawerProps) {
  const days = useMemo(() => nextDays(), []);
  const [step, setStep] = useState<Step>(1);
  const [dayIndex, setDayIndex] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(selectedServiceId);
  const [professional, setProfessional] =
    useState<MarketplaceProfessional | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>(
    [],
  );
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  const closedDay = useMemo(() => {
    const raw =
      (shop as any)?.closed_days ??
      (shop as any)?.closedDays ??
      (shop as any)?.off_days;
    const values =
      typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : [];
    const set = new Set<number>();
    for (const value of values) {
      if (typeof value === 'number' && value >= 0 && value <= 6) set.add(value);
      const key = String(value).trim().toLowerCase();
      if (DAY_INDEX[key] !== undefined) set.add(DAY_INDEX[key]);
    }
    return set.has(new Date(`${currentDay.dateStr}T12:00:00`).getDay());
  }, [currentDay, shop]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setDayIndex(0);
    setServiceId(selectedServiceId);
    setProfessional(null);
    setServices([]);
    setProfessionals([]);
    setSlots([]);
    setSelectedSlot(null);
    setLoading(false);
    setSubmitting(false);
    setError('');
    setName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    cacheRef.current.clear();
  }, [isOpen, selectedServiceId]);

  useEffect(() => {
    if (!isOpen || !shop || !professional || !serviceId || closedDay) {
      setSlots([]);
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const key = `${shop.id}|${serviceId}|${professional.id}|${currentDay.dateStr}`;
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < 8000) {
      setSlots(cached.data.availableSlots ?? []);
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      date: currentDay.dateStr,
      serviceId,
      professionalId: professional.id,
    });
    fetch(`/api/shops/${shop.id}/booking-data?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data?.error || 'Não foi possível carregar os horários.',
          );
        return data as MarketplaceBookingResponse;
      })
      .then((data) => {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
        setSlots(data.availableSlots ?? []);
        setServices(data.services ?? []);
        setProfessionals(data.professionals ?? []);
      })
      .catch((reason) => {
        if (reason?.name !== 'AbortError')
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar os horários.',
          );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [currentDay.dateStr, closedDay, isOpen, professional, serviceId, shop]);

  useEffect(() => {
    if (!isOpen || !shop || services.length || professionals.length) return;
    const controller = new AbortController();
    fetch(
      `/api/shops/${shop.id}/booking-data?date=${encodeURIComponent(currentDay.dateStr)}`,
      { signal: controller.signal, cache: 'no-store' },
    )
      .then((response) => response.json())
      .then((data: MarketplaceBookingResponse) => {
        setServices(data.services ?? []);
        setProfessionals(data.professionals ?? []);
      })
      .catch((reason) => {
        if (reason?.name !== 'AbortError')
          setError('Não foi possível carregar os profissionais.');
      });
    return () => controller.abort();
  }, [currentDay.dateStr, isOpen, professionals.length, services.length, shop]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [currentDay.dateStr, professional?.id, serviceId]);

  function continueFromStepOne() {
    if (!service) return toast.error('Escolhe primeiro o serviço.');
    if (!professional) return toast.error('Escolhe um barbeiro.');
    if (closedDay) return toast.error('A barbearia está fechada nesse dia.');
    setStep(2);
  }

  function continueFromSlots() {
    if (!selectedSlot) return toast.error('Escolhe um horário disponível.');
    setStep(3);
  }

  async function submit() {
    if (!shop || !service || !professional || !selectedSlot) return;
    if (!name.trim() || !phone.trim() || !email.trim())
      return toast.error('Preenche todos os campos obrigatórios.');
    const parsedBirthDate = birthDateIso(birthDate);
    if (!parsedBirthDate)
      return toast.error('Indica uma data de nascimento válida.');
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
      if (!response.ok || !data.success)
        throw new Error(data.error || 'Não foi possível concluir a marcação.');
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

  if (!shop) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-none border-white/10 bg-zinc-950 text-zinc-100 sm:h-auto sm:max-h-[90dvh] sm:rounded-t-3xl">
        <header className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Reserva
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {step === 4 ? 'Reserva confirmada' : shop.name}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {step === 1
                  ? 'Primeiro escolhe o barbeiro e o dia.'
                  : step === 2
                    ? 'Agora escolhe apenas entre os horários disponíveis.'
                    : step === 3
                      ? 'Confirma os teus dados.'
                      : 'O teu horário ficou reservado.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar reserva"
              onClick={onClose}
              className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {step < 4 && (
            <div
              className="mt-4 grid grid-cols-3 gap-1.5"
              aria-label={`Passo ${step} de 3`}
            >
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
            <div
              className="flex flex-col items-center gap-4 py-12 text-center"
              role="alert"
            >
              <div className="flex size-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                <XCircle className="size-7" aria-hidden="true" />
              </div>
              <p className="max-w-sm text-sm text-zinc-400">{error}</p>
              <Button variant="outline" onClick={() => setError('')}>
                Tentar novamente
              </Button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <UserRound
                    className="size-4 text-emerald-300"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold">
                    1. Escolhe o barbeiro
                  </h3>
                </div>
                <div className="grid gap-2">
                  {professionals.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={professional?.id === item.id}
                      onClick={() => setProfessional(item)}
                      className={`flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${professional?.id === item.id ? 'border-emerald-400/40 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {item.role || 'Barbeiro profissional'}
                        </span>
                      </span>
                      {professional?.id === item.id && (
                        <Check
                          className="size-5 text-emerald-300"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ))}
                </div>
                {!professionals.length && (
                  <p className="rounded-2xl border border-white/10 p-4 text-sm text-zinc-500">
                    Não existem barbeiros disponíveis para agendamento.
                  </p>
                )}
              </section>
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays
                    className="size-4 text-emerald-300"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold">2. Escolhe o dia</h3>
                </div>
                <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {days.map((day, index) => {
                    const closed = (() => {
                      const raw =
                        (shop as any)?.closed_days ??
                        (shop as any)?.closedDays ??
                        (shop as any)?.off_days;
                      const values =
                        typeof raw === 'string'
                          ? raw.split(',')
                          : Array.isArray(raw)
                            ? raw
                            : [];
                      return values.some(
                        (value: unknown) =>
                          (typeof value === 'number' &&
                            new Date(`${day.dateStr}T12:00:00`).getDay() ===
                              value) ||
                          DAY_INDEX[String(value).trim().toLowerCase()] ===
                            new Date(`${day.dateStr}T12:00:00`).getDay(),
                      );
                    })();
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        aria-pressed={dayIndex === index}
                        onClick={() => setDayIndex(index)}
                        className={`min-w-[66px] rounded-2xl border px-2 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${dayIndex === index ? 'border-emerald-400/40 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}
                      >
                        <span className="block text-[10px] font-bold text-zinc-500">
                          {day.isToday ? 'HOJE' : day.weekdayShort}
                        </span>
                        <span className="mt-1 block text-xl font-black">
                          {day.dayNumeric}
                        </span>
                        {closed && (
                          <span className="mt-0.5 block text-[8px] font-semibold text-amber-300">
                            FECHADO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {closedDay && (
                  <div className="mt-3 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs text-amber-100">
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0 text-amber-300"
                      aria-hidden="true"
                    />
                    A barbearia não aceita marcações nesse dia.
                  </div>
                )}
              </section>
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Scissors
                      className="size-4 text-zinc-400"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-zinc-500">Serviço</span>
                  </div>
                  <select
                    aria-label="Escolher serviço"
                    value={serviceId ?? ''}
                    onChange={(event) =>
                      setServiceId(event.target.value || null)
                    }
                    className="min-h-10 max-w-[68%] rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm"
                  >
                    <option value="">Escolher serviço</option>
                    {services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.durationMinutes} min · €
                        {Number(item.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            </div>
          ) : step === 2 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Selecionado</p>
                <p className="mt-1 font-semibold">{professional?.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {currentDay.fullDateFormatted} · {service?.name}
                </p>
              </div>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3
                      className="size-4 text-emerald-300"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold">
                      Horários disponíveis
                    </h3>
                  </div>
                  {loading && (
                    <Loader2
                      className="size-4 animate-spin text-zinc-500"
                      aria-hidden="true"
                    />
                  )}
                </div>
                {loading ? (
                  <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-zinc-500">
                    A procurar horários…
                  </div>
                ) : !slots.length ? (
                  <div className="rounded-2xl border border-white/10 p-8 text-center">
                    <AlertCircle
                      className="mx-auto size-6 text-zinc-500"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-sm font-medium">
                      Sem horários disponíveis
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Experimenta outro dia.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={selectedSlot === slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`min-h-12 rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${selectedSlot === slot ? 'border-emerald-400/40 bg-emerald-300 text-zinc-950' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Barbeiro</span>
                  <strong>{professional?.name}</strong>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-zinc-500">Dia</span>
                  <strong>{currentDay.fullDateFormatted}</strong>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-zinc-500">Hora</span>
                  <strong>{selectedSlot}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-500">Serviço</span>
                  <strong>{service?.name}</strong>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Os teus dados</h3>
                <label className="block text-xs text-zinc-500">
                  Nome
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/40"
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-500">
                  Telefone
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/40"
                    autoComplete="tel"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-500">
                  <span className="flex items-center gap-2">
                    <Mail className="size-3.5" aria-hidden="true" />
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/40"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="block text-xs text-zinc-500">
                  Data de nascimento
                  <input
                    value={birthDate}
                    inputMode="numeric"
                    onChange={(event) => setBirthDate(event.target.value)}
                    placeholder="DDMMAAAA"
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/40"
                    autoComplete="bday"
                    required
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 className="size-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Reserva confirmada</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {service?.name} com {professional?.name}
                  <br />
                  {currentDay.fullDateFormatted} às {selectedSlot}
                </p>
              </div>
            </div>
          )}
        </div>

        {step < 4 && (
          <footer className="shrink-0 border-t border-white/10 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((current) => (current - 1) as Step)}
                  disabled={submitting}
                >
                  <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                  Voltar
                </Button>
              ) : (
                <span />
              )}
              {step === 1 ? (
                <Button onClick={continueFromStepOne}>
                  Continuar
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              ) : step === 2 ? (
                <Button onClick={continueFromSlots}>
                  Continuar
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={() => void submit()} disabled={submitting}>
                  {submitting ? (
                    <Loader2
                      className="mr-2 size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check className="mr-2 size-4" aria-hidden="true" />
                  )}
                  {submitting ? 'A confirmar…' : 'Confirmar reserva'}
                </Button>
              )}
            </div>
          </footer>
        )}
      </DrawerContent>
    </Drawer>
  );
}
