'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useBarbershop } from '@/context/BarbershopContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_METRIC_DESCRIPTORS,
  MetricKey,
} from '@/app/dashboard/_constants';
import { Appointment, Professional, Service, Client } from '@/types';
import { appointmentService } from '@/app/dashboard/_services/appointments.service';
import { servicesService } from '@/app/dashboard/_services/services.service';
import { professionalService } from '@/app/dashboard/_services/professionals.service';
import { authService } from '@/app/dashboard/_services/auth.service';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { Spotlight } from '@/components/aceternity/spotlight';
import { StatusBadge } from '@/app/state/_components/shared/StatusBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Users,
  Scissors,
  Briefcase,
  CalendarDays,
  Clock,
  ChevronRight,
  Crown,
  CalendarPlus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { PLAN_NAMES } from '@/lib/billing/plan-features';

const getDayIndex = (value: string) => (new Date(value).getDay() + 6) % 7;

export default function DashboardPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const { plan } = useFeatureAccess();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try {
      const [appointmentsRes, servicesRes, professionalsRes, clientsRes] =
        await Promise.all([
          appointmentService.getAll(barbershopId),
          servicesService.getAll(barbershopId),
          professionalService.getAll(barbershopId),
          appointmentService.getClients(barbershopId),
        ]);
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      setAppointments(appointmentsRes.data ?? []);
      setServices(servicesRes.data ?? []);
      setProfessionals(professionalsRes.data ?? []);
      setClients(clientsRes.data ?? []);
    } catch (error) {
      console.error('[Dashboard Sync Error]:', error);
      toast.error('Não foi possível atualizar os dados. Tenta novamente.');
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) queueMicrotask(() => void fetchInitialData());
  }, [barbershopId, fetchInitialData, isLoadingBarbershop]);

  useEffect(() => {
    let cancelled = false;
    void authService.getCurrentUser().then(({ data }) => {
      if (cancelled || !data) return;
      setUserName(data.name_complete || data.email?.split('@')[0] || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chartConfig = {
    revenue: { label: 'Receita', color: 'hsl(var(--chart-1))' },
    bookings: { label: 'Marcações', color: 'hsl(var(--chart-2))' },
  } satisfies ChartConfig;

  const dynamicChartData = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return days.map((day, index) => ({
      day,
      revenue: appointments
        .filter(
          (a) => a.status === 'completed' && getDayIndex(a.date_hour) === index,
        )
        .reduce((acc, a) => acc + Number(a.services?.price || 0), 0),
      bookings: appointments.filter((a) => getDayIndex(a.date_hour) === index)
        .length,
    }));
  }, [appointments]);

  const metrics = useMemo(() => {
    const totalRevenue = appointments
      .filter((a) => a.status === 'completed')
      .reduce((acc, app) => acc + Number(app.services?.price || 0), 0);
    const activeBookingsCount = appointments.filter(
      (a) => a.status === 'scheduled',
    ).length;
    const valuesMap: Record<MetricKey, string> = {
      revenue: `${totalRevenue.toFixed(2)} €`,
      appointments: String(activeBookingsCount),
      clients: String(clients.length),
      services: String(services.length),
    };
    return DASHBOARD_METRIC_DESCRIPTORS.map((descriptor) => ({
      ...descriptor,
      value: valuesMap[descriptor.key],
    }));
  }, [appointments, clients, services]);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'scheduled' || a.status === 'pending')
        .sort(
          (a, b) =>
            new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime(),
        )
        .slice(0, 5),
    [appointments],
  );

  const nextAppointment = upcomingAppointments[0];
  const hasBusinessSetup = services.length > 0 && professionals.length > 0;
  const setupSteps = [
    {
      label: 'Adicionar um serviço',
      done: services.length > 0,
      href: '/dashboard/servicos',
    },
    {
      label: 'Adicionar um barbeiro',
      done: professionals.length > 0,
      href: '/dashboard/equipa',
    },
    {
      label: 'Criar a primeira marcação',
      done: appointments.length > 0,
      href: '/dashboard/agenda',
    },
  ];
  const setupCompleted = setupSteps.filter((step) => step.done).length;
  const nextSetupStep = setupSteps.find((step) => !step.done);

  const iconVariants = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
    default: 'bg-white/5 text-zinc-300',
  } as const;
  const cardHoverVariants = {
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/10',
    blue: 'hover:border-blue-500/40 hover:bg-blue-500/10',
    amber: 'hover:border-amber-500/40 hover:bg-amber-500/10',
    purple: 'hover:border-purple-500/40 hover:bg-purple-500/10',
    default: 'hover:border-zinc-500/40 hover:bg-zinc-500/10',
  } as const;
  const quickActions = [
    {
      href: '/dashboard/agenda',
      label: 'Nova marcação',
      icon: CalendarPlus,
      color: 'emerald' as const,
    },
    {
      href: '/dashboard/clientes',
      label: 'Clientes',
      icon: Users,
      color: 'blue' as const,
    },
    {
      href: '/dashboard/servicos',
      label: 'Serviços',
      icon: Scissors,
      color: 'amber' as const,
    },
    {
      href: '/dashboard/equipa',
      label: 'Equipa',
      icon: Briefcase,
      color: 'purple' as const,
    },
    {
      href: '/dashboard/stats',
      label: 'Estatísticas',
      icon: Clock,
      color: 'blue' as const,
    },
  ];

  return (
    <TooltipProvider>
      <main className="relative min-h-screen overflow-hidden bg-background pb-5 pt-16 text-foreground">
        <Spotlight className="opacity-70" />
        <div className="relative px-3 pb-5 pt-8 sm:px-5 md:px-8 md:pb-12">
          <section
            className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            aria-labelledby="dashboard-greeting"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                Painel
              </p>
              <h1
                id="dashboard-greeting"
                className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl"
              >
                {new Date().getHours() < 12
                  ? 'Bom dia'
                  : new Date().getHours() < 20
                    ? 'Boa tarde'
                    : 'Boa noite'}
                {userName ? `, ${userName}` : ''} 👋
              </h1>
              <p className="mt-1 text-sm capitalize text-zinc-400">
                {new Date().toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Crown className="size-4 text-emerald-400" aria-hidden="true" />
              Plano atual: {PLAN_NAMES[plan]}
              <ChevronRight
                className="size-4 text-zinc-500"
                aria-hidden="true"
              />
            </Link>
          </section>

          {!loadingInitial && nextSetupStep && !hasBusinessSetup && (
            <section
              className="mb-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 backdrop-blur-xl sm:p-6"
              aria-labelledby="setup-title"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15">
                      {setupCompleted + 1}
                    </span>
                    Configuração inicial
                  </div>
                  <h2
                    id="setup-title"
                    className="mt-3 text-xl font-semibold tracking-tight text-zinc-50"
                  >
                    A tua barbearia já começou. Vamos acabar o essencial.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {setupCompleted} de {setupSteps.length} passos concluídos.
                    Só falta completar o próximo passo para começares a aceitar
                    marcações.
                  </p>
                  <div
                    className="mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuenow={setupCompleted}
                    aria-valuemin={0}
                    aria-valuemax={setupSteps.length}
                    aria-label={`Configuração: ${setupCompleted} de ${setupSteps.length} passos`}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{
                        width: `${(setupCompleted / setupSteps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <Link
                  href={nextSetupStep.href}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {nextSetupStep.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          <section aria-label="Ações rápidas" className="pb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                O que precisas de fazer?
              </h2>
              <Link
                href="/dashboard/agenda"
                className="text-xs font-medium text-zinc-500 transition hover:text-zinc-200"
              >
                Abrir agenda <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 md:p-4"
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border',
                        iconVariants[action.color],
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="block font-heading text-sm font-semibold tracking-tight text-zinc-50">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {nextAppointment && !loadingInitial && (
            <section
              className="mb-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-xl backdrop-blur-xl sm:p-5"
              aria-labelledby="next-appointment-title"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <span className="text-sm font-bold">
                      {new Date(nextAppointment.date_hour).toLocaleTimeString(
                        'pt-PT',
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Próxima marcação
                    </p>
                    <h2
                      id="next-appointment-title"
                      className="mt-1 truncate text-base font-semibold text-zinc-50"
                    >
                      {nextAppointment.users?.name_complete ||
                        nextAppointment.manual_name ||
                        'Cliente'}
                    </h2>
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {nextAppointment.services?.name || 'Serviço'} ·{' '}
                      {nextAppointment.professionals?.name ||
                        'Sem barbeiro atribuído'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/agenda"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  Ver agenda{' '}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          <section className="pt-1" aria-labelledby="business-overview">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="business-overview"
                className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400"
              >
                Resumo do negócio
              </h2>
              {!loadingInitial && (
                <span className="text-xs text-zinc-500">
                  {services.length} serviços · {professionals.length}{' '}
                  profissionais
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {loadingInitial
                ? [...Array(4)].map((_, i) => (
                    <Card
                      key={i}
                      className="border border-white/10 bg-white/[0.04]"
                    >
                      <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-24 bg-white/10" />
                          <Skeleton className="h-7 w-16 bg-white/10" />
                        </div>
                        <Skeleton className="size-10 rounded-full bg-white/10" />
                      </CardHeader>
                    </Card>
                  ))
                : metrics.map((metric) => (
                    <Link
                      key={metric.key}
                      href="/dashboard/stats"
                      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Card
                        className={cn(
                          'cursor-pointer border border-white/10 bg-white/[0.04] transition-all duration-200',
                          cardHoverVariants[metric.variant],
                        )}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                          <div className="min-w-0 space-y-1">
                            <CardDescription className="truncate text-xs font-medium text-zinc-400">
                              {metric.label}
                            </CardDescription>
                            <CardTitle className="truncate text-2xl font-bold tracking-tight text-zinc-50">
                              {metric.value}
                            </CardTitle>
                          </div>
                          <span
                            className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-full',
                              iconVariants[metric.variant],
                            )}
                          >
                            <metric.icon className="size-5" />
                          </span>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
            </div>
          </section>

          <section className="grid gap-3 pt-5 md:gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="border border-white/10 bg-zinc-900/60 shadow-xl backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-medium text-zinc-100">
                      Atividade semanal
                    </CardTitle>
                    <CardDescription className="mt-1 text-zinc-500">
                      Compara rapidamente as marcações e a receita de cada dia.
                    </CardDescription>
                  </div>
                  <Link
                    href="/dashboard/stats"
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-200"
                  >
                    Ver análise
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="h-[280px] w-full pt-4">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={dynamicChartData}
                    margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
                    barGap={6}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
                      stroke="rgba(255,255,255,0.07)"
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Receita"
                      fill="var(--color-revenue)"
                      radius={[6, 6, 2, 2]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="bookings"
                      name="Marcações"
                      fill="var(--color-bookings)"
                      radius={[6, 6, 2, 2]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <div
                className="flex flex-wrap items-center justify-center gap-4 px-5 pb-5 pt-1 text-xs text-zinc-500"
                aria-label="Legenda do gráfico"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full bg-[hsl(var(--chart-1))]"
                    aria-hidden="true"
                  />
                  Receita
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full bg-[hsl(var(--chart-2))]"
                    aria-hidden="true"
                  />
                  Marcações
                </span>
              </div>
            </Card>

            <Card className="border border-white/10 bg-zinc-900/60 shadow-xl backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-zinc-100">
                  <CalendarDays
                    className="size-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  Próximas marcações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {loadingInitial ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-white/10" />
                    ))}
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                    <CheckCircle2
                      className="mx-auto size-6 text-zinc-600"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-medium text-zinc-300">
                      A agenda está livre.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Cria uma marcação para começares a organizar o dia.
                    </p>
                    <Link
                      href="/dashboard/agenda"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-950"
                    >
                      Criar marcação <ArrowRight className="size-4" />
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {upcomingAppointments.map((appointment) => {
                      const dataObj = new Date(appointment.date_hour);
                      const nameStr =
                        appointment.users?.name_complete ||
                        appointment.manual_name ||
                        'Cliente';
                      return (
                        <li
                          key={appointment.id}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                        >
                          <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                            <span className="text-xs font-bold leading-none">
                              {dataObj.toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-100">
                              {nameStr}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {appointment.services?.name} ·{' '}
                              {appointment.professionals?.name ||
                                'Sem barbeiro'}
                            </p>
                          </div>
                          <StatusBadge status={appointment.status} />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link
                  href="/dashboard/agenda"
                  className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Ver agenda completa
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </TooltipProvider>
  );
}
