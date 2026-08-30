'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Users,
} from 'lucide-react';
import { format, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useBarbershop } from '@/context/BarbershopContext';
import { appointmentService } from '@/app/dashboard/_services/appointments.service';
import { getScheduleBlocksByShop } from '@/app/dashboard/_services/schedule-blocks.service';
import type { Appointment, Professional } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ScheduleConfig = {
  opening_time?: string | null;
  closing_time?: string | null;
  lunch_start?: string | null;
  lunch_end?: string | null;
  closed_days?: string | null;
};

type CalendarBlock = {
  id: string;
  professional_id?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
  professionals?: { name?: string | null } | null;
};

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const statusTone: Record<Appointment['status'], string> = {
  pending: 'bg-amber-400',
  scheduled: 'bg-sky-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
};

function parseClosedDays(value?: string | null) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function dayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function formatTime(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 5);
}

function occupancyLevel(appointments: Appointment[]) {
  const active = appointments.filter((item) => item.status !== 'cancelled');
  if (active.length === 0) return 'empty';
  if (active.length <= 2) return 'light';
  if (active.length <= 5) return 'busy';
  return 'heavy';
}

function occupancyLabel(level: string) {
  if (level === 'empty') return 'Disponível';
  if (level === 'light') return 'Pouco ocupada';
  if (level === 'busy') return 'Ocupada';
  return 'Muito ocupada';
}

export function AgendaCalendarView() {
  const { barbershopId } = useBarbershop();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [config, setConfig] = useState<ScheduleConfig>({});
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!barbershopId) return;
    setLoading(true);
    setError(null);
    try {
      const [appointmentsResult, configResult, blocksResult, professionalsResult] =
        await Promise.all([
          appointmentService.getAll(barbershopId),
          (await import('@/app/dashboard/_services/barbershop.service')).barbershopService.getConfig(barbershopId),
          getScheduleBlocksByShop(barbershopId),
          (await import('@/app/dashboard/_services/professionals.service')).professionalService.getAll(barbershopId),
        ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (configResult.error) throw configResult.error;
      if (blocksResult.error) throw blocksResult.error;
      if (professionalsResult.error) throw professionalsResult.error;

      setAppointments(appointmentsResult.data ?? []);
      setConfig((configResult.data ?? {}) as ScheduleConfig);
      setBlocks((blocksResult.data ?? []) as CalendarBlock[]);
      setProfessionals((professionalsResult.data ?? []).filter((item) => item.active !== false));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível carregar o calendário.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      const key = dayKey(new Date(appointment.date_hour));
      const current = map.get(key) ?? [];
      current.push(appointment);
      map.set(key, current);
    });
    return map;
  }, [appointments]);

  const blocksByDay = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>();
    blocks.forEach((block) => {
      if (!block.date) return;
      const current = map.get(block.date) ?? [];
      current.push(block);
      map.set(block.date, current);
    });
    return map;
  }, [blocks]);

  const closedDays = useMemo(() => parseClosedDays(config.closed_days), [config.closed_days]);
  const selectedAppointments = appointmentsByDay.get(dayKey(selectedDate)) ?? [];
  const selectedBlocks = blocksByDay.get(dayKey(selectedDate)) ?? [];

  const selectedWeekday = format(selectedDate, 'EEEE', { locale: pt });
  const selectedClosed = closedDays.has(format(selectedDate, 'EEEE'));
  const activeSelected = selectedAppointments.filter((item) => item.status !== 'cancelled');
  const selectedLevel = occupancyLevel(selectedAppointments);
  const selectedHours = activeSelected.length
    ? Math.round(
        activeSelected.reduce((total, appointment) => total + 1, 0) /
          Math.max(professionals.length, 1) *
          100,
      )
    : 0;

  if (loading) {
    return (
      <Card className="border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardContent className="flex min-h-96 items-center justify-center">
          <Spinner className="size-7" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-400/15 bg-rose-400/[0.03]">
        <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
          <AlertCircle className="size-6 text-rose-300" />
          <p className="mt-3 text-sm font-medium text-zinc-100">Não foi possível carregar o calendário.</p>
          <p className="mt-1 max-w-md text-xs text-zinc-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void load()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/[0.075] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Visão de ocupação</p>
              <CardTitle className="mt-1 text-xl capitalize text-zinc-50">{format(month, 'MMMM yyyy', { locale: pt })}</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">Cada dia mostra a carga da equipa, bloqueios, pausa e disponibilidade.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setMonth((value) => subMonths(value, 1))} aria-label="Mês anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" className="min-w-24" onClick={() => { const value = new Date(); setMonth(value); setSelectedDate(value); }}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => setMonth((value) => addMonths(value, 1))} aria-label="Próximo mês">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1"><span className="size-1.5 rounded-full bg-zinc-700" />Disponível</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1"><span className="size-1.5 rounded-full bg-sky-400" />Ocupada</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1"><span className="size-1.5 rounded-full bg-rose-400" />Bloqueio</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1"><span className="size-1.5 rounded-full bg-amber-300" />Almoço / folga</span>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-white/[0.055]">
            {calendarDays.map((date) => {
              const key = dayKey(date);
              const dayAppointments = appointmentsByDay.get(key) ?? [];
              const dayBlocks = blocksByDay.get(key) ?? [];
              const level = occupancyLevel(dayAppointments);
              const isClosed = closedDays.has(format(date, 'EEEE'));
              const inMonth = isSameMonth(date, month);
              const selected = isSameDay(date, selectedDate);
              const activeCount = dayAppointments.filter((item) => item.status !== 'cancelled').length;
              const total = dayAppointments.length;
              const blockCount = dayBlocks.length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'group relative min-h-32 bg-zinc-950/95 p-2 text-left transition duration-200 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 sm:min-h-36 sm:p-3',
                    !inMonth && 'opacity-40',
                    selected && 'bg-white/[0.06] ring-1 ring-inset ring-emerald-400/30',
                    isClosed && 'bg-white/[0.015]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('flex size-7 items-center justify-center rounded-lg text-xs font-semibold', isToday(date) ? 'bg-emerald-400 text-zinc-950' : selected ? 'bg-white/10 text-white' : 'text-zinc-300')}>{format(date, 'd')}</span>
                    {activeCount > 0 && <span className="text-[10px] font-semibold tabular-nums text-zinc-600">{activeCount}</span>}
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className={cn('h-full rounded-full transition-all', level === 'empty' && 'w-0 bg-zinc-700', level === 'light' && 'w-1/3 bg-emerald-400/80', level === 'busy' && 'w-2/3 bg-sky-400/80', level === 'heavy' && 'w-full bg-violet-400/80')} />
                  </div>
                  <p className="mt-2 truncate text-[10px] font-medium text-zinc-500">{isClosed ? 'Folga' : occupancyLabel(level)}</p>

                  <div className="mt-2 space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment) => (
                      <div key={appointment.id} className="flex min-w-0 items-center gap-1.5 rounded-md bg-white/[0.025] px-1.5 py-1">
                        <span className={cn('size-1.5 shrink-0 rounded-full', statusTone[appointment.status])} />
                        <span className="truncate text-[9px] text-zinc-500">{format(new Date(appointment.date_hour), 'HH:mm')} · {appointment.manual_name || appointment.users?.name_complete || 'Cliente'}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && <span className="block px-1 text-[9px] font-medium text-zinc-600">+{dayAppointments.length - 2} mais</span>}
                    {blockCount > 0 && <div className="flex items-center gap-1 text-[9px] text-rose-300/80"><CalendarOff className="size-3" />{blockCount} bloqueio{blockCount === 1 ? '' : 's'}</div>}
                    {config.lunch_start && config.lunch_end && !isClosed && <div className="flex items-center gap-1 text-[9px] text-amber-300/70"><Coffee className="size-3" />Pausa {formatTime(config.lunch_start)}–{formatTime(config.lunch_end)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit border-white/10 bg-white/[0.02] backdrop-blur-xl xl:sticky xl:top-24">
        <CardHeader className="border-b border-white/[0.075] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Dia selecionado</p>
          <CardTitle className="mt-1 text-xl capitalize">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}</CardTitle>
          <p className="mt-1 text-xs text-zinc-500">{selectedClosed ? 'Dia de folga' : occupancyLabel(selectedLevel)}</p>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-600">Marcações</p><p className="mt-1 text-lg font-semibold">{activeSelected.length}</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-600">Bloqueios</p><p className="mt-1 text-lg font-semibold">{selectedBlocks.length}</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-600">Carga</p><p className="mt-1 text-lg font-semibold">{Math.min(selectedHours, 100)}%</p></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs"><span className="text-zinc-500">Horário</span><span className="font-medium text-zinc-200">{config.opening_time ?? '—'}–{config.closing_time ?? '—'}</span></div>
            {config.lunch_start && config.lunch_end && !selectedClosed && <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-zinc-500"><Coffee className="size-3.5" />Pausa</span><span className="font-medium text-amber-200">{formatTime(config.lunch_start)}–{formatTime(config.lunch_end)}</span></div>}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Agenda do dia</p>
            <div className="space-y-2">
              {selectedAppointments.length === 0 && selectedBlocks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-4 text-center text-xs text-zinc-600">Sem eventos registados para este dia.</div>
              ) : (
                <>
                  {selectedAppointments
                    .sort((a, b) => new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime())
                    .map((appointment) => (
                      <div key={appointment.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="flex items-center gap-2"><Clock3 className="size-3.5 text-sky-300" /><span className="text-xs font-semibold text-zinc-200">{format(new Date(appointment.date_hour), 'HH:mm')}</span><span className="text-[10px] text-zinc-600">{appointment.services?.name ?? 'Serviço'}</span></div>
                        <p className="mt-1 truncate text-xs text-zinc-400">{appointment.manual_name || appointment.users?.name_complete || 'Cliente'}</p>
                        <p className="mt-1 truncate text-[10px] text-zinc-600">{appointment.professionals?.name ?? 'Profissional'}</p>
                      </div>
                    ))}
                  {selectedBlocks.map((block) => (
                    <div key={block.id} className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] p-3">
                      <div className="flex items-center gap-2"><CalendarOff className="size-3.5 text-rose-300" /><span className="text-xs font-semibold text-rose-100">{formatTime(block.start_time)}–{formatTime(block.end_time)}</span></div>
                      <p className="mt-1 text-xs text-zinc-400">{block.reason || 'Bloqueio de horário'}</p>
                      <p className="mt-1 text-[10px] text-zinc-600">{block.professionals?.name || 'Equipa'}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><Users className="size-3.5" /> Equipa</p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">{professionals.length ? `${professionals.length} profissional${professionals.length === 1 ? '' : 'is'} ativo${professionals.length === 1 ? '' : 's'} neste calendário.` : 'Ainda não tens profissionais ativos.'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
