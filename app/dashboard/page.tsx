"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_METRIC_DESCRIPTORS,
  MetricKey,
} from "@/app/dashboard/_constants";
import { Appointment, Professional, Service, Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { Spotlight } from "@/components/aceternity/spotlight";
import { StatusBadge } from "@/app/state/_components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import {
  Users,
  Scissors,
  Briefcase,
  CalendarDays,
  Clock,
  ChevronRight,
  Crown,
  CalendarPlus,
  User,
} from "lucide-react";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

export default function DashboardPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const { plan } = useFeatureAccess();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

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
      console.error("❌ [Dashboard Sync Error]:", error);
      toast.error("Erro ao sincronizar os dados com o servidor.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) {
      queueMicrotask(() => void fetchInitialData());
    }
  }, [barbershopId, fetchInitialData, isLoadingBarbershop]);

  const chartConfig = {
    revenue: { label: "Receita (€)", color: "hsl(var(--chart-1))" },
    bookings: { label: "Marcações", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  const dynamicChartData = useMemo(() => {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return days.map((day, index) => ({
      day,
      revenue: appointments
        .filter(
          (a) =>
            a.status === "completed" &&
            new Date(a.date_hour).getDay() === index,
        )
        .reduce((acc, a) => acc + Number(a.services?.price || 0), 0),
      bookings: appointments.filter(
        (a) => new Date(a.date_hour).getDay() === index,
      ).length,
    }));
  }, [appointments]);

  const metrics = useMemo(() => {
    const totalRevenue = appointments
      .filter((a) => a.status === "completed")
      .reduce((acc, app) => acc + Number(app.services?.price || 0), 0);
    const activeBookingsCount = appointments.filter(
      (a) => a.status === "scheduled",
    ).length;
    const valuesMap: Record<MetricKey, string> = {
      revenue: `${totalRevenue.toFixed(2)}€`,
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
        .filter((a) => a.status === "scheduled" || a.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime(),
        )
        .slice(0, 5),
    [appointments],
  );

  const iconVariants = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/20 text-blue-400",
    amber: "bg-amber-500/20 text-amber-400",
    purple: "bg-purple-500/20 text-purple-400",
    default: "bg-white/5 text-zinc-300",
  };

  const cardHoverVariants = {
    emerald: "hover:border-emerald-500/40 hover:bg-emerald-500/10",
    blue: "hover:border-blue-500/40 hover:bg-blue-500/10",
    amber: "hover:border-amber-500/40 hover:bg-amber-500/10",
    purple: "hover:border-purple-500/40 hover:bg-purple-500/10",
    default: "hover:border-zinc-500/40 hover:bg-zinc-500/10",
  };

  const quickActions = [
    { href: "/dashboard/agenda", label: "Nova marcação", icon: CalendarPlus, color: "emerald" as const },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users, color: "blue" as const },
    { href: "/dashboard/servicos", label: "Serviços", icon: Scissors, color: "amber" as const },
    { href: "/dashboard/equipa", label: "Equipa", icon: Briefcase, color: "purple" as const },
    { href: "/dashboard/stats", label: "Estatísticas", icon: Clock, color: "blue" as const },
  ];

  return (
    <TooltipProvider>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground pb-5 pt-16">
        <Spotlight className="opacity-70" />

        <div className="relative px-3 pb-5 pt-8 text-foreground sm:px-5 md:px-8 md:pb-12">
          <section
            className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
            aria-labelledby="dashboard-greeting"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                Dashboard
              </p>
              <h1
                id="dashboard-greeting"
                className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl"
              >
                {new Date().getHours() < 12
                  ? "Bom dia"
                  : new Date().getHours() < 20
                    ? "Boa tarde"
                    : "Boa noite"}{" "}
                👋
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date().toLocaleDateString("pt-PT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <Crown className="size-4 text-emerald-400" aria-hidden="true" />
              Plano atual: {PLAN_NAMES[plan]}
              <ChevronRight className="size-4 text-zinc-500" aria-hidden="true" />
            </Link>
          </section>

          <section aria-label="Ações rápidas" className="pb-5">
            <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Ações rápidas
            </h2>
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border transition-all duration-300",
                        iconVariants[action.color],
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="block font-heading text-sm font-semibold text-zinc-50 tracking-tight">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="pt-5" aria-labelledby="business-overview">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="business-overview"
                className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400"
              >
                Resumo do negócio
              </h2>
              {loadingInitial ? null : (
                <span className="text-xs text-zinc-500">
                  {services.length} serviços · {professionals.length} profissionais
                </span>
              )}
            </div>

            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loadingInitial
                ? [...Array(4)].map((_, i) => (
                    <Card key={i} className="border border-white/10 bg-white/[0.04]">
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
                      className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                    >
                      <Card
                        className={cn(
                          "border border-white/10 bg-white/[0.04]",
                          "cursor-pointer transition-all duration-200",
                          cardHoverVariants[metric.variant],
                        )}
                      >
                        <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                          <div className="space-y-1 min-w-0">
                            <CardDescription className="text-zinc-400 text-xs font-medium truncate">
                              {metric.label}
                            </CardDescription>
                            <CardTitle className="text-2xl text-zinc-50 font-bold tracking-tight truncate">
                              {metric.value}
                            </CardTitle>
                          </div>
                          <span
                            className={cn(
                              "flex size-10 items-center justify-center rounded-full transition-colors shrink-0",
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

          <section className="pt-5 grid gap-3 md:gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-100">
                  Evolução semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full pt-4">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart
                    data={dynamicChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
                      stroke="rgba(255, 255, 255, 0.07)"
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="url(#revenueGradient)"
                      stroke="#ffffff"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#ffffff", strokeWidth: 0 }}
                      activeDot={{
                        r: 5,
                        fill: "#ffffff",
                        stroke: "#18181b",
                        strokeWidth: 2,
                      }}
                    />
                    <Line
                      dataKey="bookings"
                      type="monotone"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{
                        r: 5,
                        fill: "#10b981",
                        stroke: "#18181b",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                  <CalendarDays className="size-4 text-emerald-400" aria-hidden="true" />
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
                  <div className="py-8 text-center text-sm text-zinc-500">
                    Sem marcações futuras.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {upcomingAppointments.map((appointment) => {
                      const dataObj = new Date(appointment.date_hour);
                      const nameStr =
                        appointment.users?.name_complete ||
                        appointment.manual_name ||
                        "Cliente Manual";
                      return (
                        <li
                          key={appointment.id}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                        >
                          <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                            <span className="text-xs font-bold leading-none">
                              {dataObj.toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-100">
                              {nameStr}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {appointment.services?.name} ·{" "}
                              {appointment.professionals?.name || "Sem barbeiro"}
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
                  className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:border-white/20"
                >
                  <User className="size-4" aria-hidden="true" />
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