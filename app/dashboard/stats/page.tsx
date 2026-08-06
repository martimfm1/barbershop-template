"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";

// SERVICES
import { appointmentService } from "@/app/dashboard/_services/appointments.service";

// UI COMPONENTS
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// RECHARTS
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

// ICONS
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Scissors,
  CheckCircle,
  Wallet,
  Loader2,
  Receipt,
} from "lucide-react";
import { Appointment } from "@/types";

const CHART_PALETTE = [
  "#10b981", // Emerald
  "#38bdf8", // Sky
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
];

function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div
        role="tooltip"
        className="rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-md"
      >
        <p className="text-xs font-medium text-zinc-400">{label || item.name}</p>
        <p className="mt-0.5 text-sm font-bold text-zinc-100">
          {typeof item.value === "number" ? `${item.value.toFixed(2)}€` : item.value}
        </p>
      </div>
    );
  }
  return null;
}

export default function StatsPage() {
  const { barbershopId } = useBarbershop();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatsData = useCallback(async () => {
    if (!barbershopId) return;
    try {
      setLoading(true);
      const res = await appointmentService.getAll(barbershopId);
      if (res.error) throw res.error;
      setAppointments(res.data || []);
    } catch (error) {
      console.error("❌ [Stats Fetch Error]:", error);
      toast.error("Erro ao processar métricas de faturação.");
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (barbershopId) {
      void fetchStatsData();
    }
  }, [barbershopId, fetchStatsData]);

  const analytics = useMemo(() => {
    const completedApps = appointments.filter((a) => a.status === "completed");

    let totalRevenue = 0;
    const serviceCounts: Record<
      string,
      { id: string | null; name: string; count: number; total: number }
    > = {};
    const paymentGroups: Record<string, number> = {};
    const professionalGroups: Record<string, number> = {};

    completedApps.forEach((app) => {
      const price = Number(app.services?.price || 0);
      const serviceName = app.services?.name || "Outros";
      const serviceId = app.service_id || null;
      const paymentMethod = app.payment_method || "Não Especificado";
      const barberName = app.professionals?.name || "Casa / Geral";

      totalRevenue += price;

      const key = serviceId || serviceName;

      if (!serviceCounts[key]) {
        serviceCounts[key] = {
          id: serviceId,
          name: serviceName,
          count: 0,
          total: 0,
        };
      }
      serviceCounts[key].count += 1;
      serviceCounts[key].total += price;

      paymentGroups[paymentMethod] =
        (paymentGroups[paymentMethod] || 0) + price;

      professionalGroups[barberName] =
        (professionalGroups[barberName] || 0) + price;
    });

    const avgTicket =
      completedApps.length > 0 ? totalRevenue / completedApps.length : 0;

    let mostPopularService = "Sem registos";
    let mostPopularServiceId: string | null = null;
    let maxCount = 0;

    Object.values(serviceCounts).forEach((data) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostPopularService = data.name;
        mostPopularServiceId = data.id;
      }
    });

    return {
      insights: {
        totalRevenue,
        avgTicket,
        mostPopular: mostPopularService,
        mostPopularId: mostPopularServiceId,
        completedCount: completedApps.length,
      },
      paymentStats: Object.entries(paymentGroups).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      })),
      professionalStats: Object.entries(professionalGroups).map(
        ([name, value]) => ({
          name,
          value,
        }),
      ),
      serviceStats: Object.values(serviceCounts).map((data) => ({
        name: data.name,
        value: data.total,
      })),
    };
  }, [appointments]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Relatórios de Faturação
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Métricas operacionais e consolidação financeira da unidade.
          </p>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button
            variant="ghost"
            className="w-full sm:w-auto min-h-[44px] bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao Painel
          </Button>
        </Link>
      </header>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex h-64 w-full items-center justify-center text-zinc-400"
        >
          <Loader2 className="size-6 animate-spin mr-2 text-emerald-400" aria-hidden="true" />
          <span className="text-sm font-medium">A carregar métricas...</span>
        </div>
      ) : (
        <>
          {/* ⚡ GRID DE KPIS (Semântico com dl/dt/dd) */}
          <section aria-label="Resumo de Métricas">
            <dl className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-1 p-4">
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Faturação Total</span>
                    <Receipt className="size-4 text-emerald-400" aria-hidden="true" />
                  </dt>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <dd className="text-2xl font-bold text-emerald-400">
                    {analytics.insights.totalRevenue.toFixed(2)}€
                  </dd>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-1 p-4">
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Ticket Médio</span>
                    <DollarSign className="size-4 text-zinc-100" aria-hidden="true" />
                  </dt>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <dd className="text-2xl font-bold text-white">
                    {analytics.insights.avgTicket.toFixed(2)}€
                  </dd>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-1 p-4">
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Mais Solicitado</span>
                    <Scissors className="size-4 text-purple-400" aria-hidden="true" />
                  </dt>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <dd className="text-lg font-semibold text-zinc-100 truncate">
                    {analytics.insights.mostPopular}
                  </dd>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-1 p-4">
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Serviços Concluídos</span>
                    <CheckCircle className="size-4 text-sky-400" aria-hidden="true" />
                  </dt>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <dd className="text-2xl font-bold text-sky-400">
                    {analytics.insights.completedCount}{" "}
                    <span className="text-xs font-normal text-zinc-500">cortes</span>
                  </dd>
                </CardContent>
              </Card>
            </dl>
          </section>

          {/* 📊 ÁREA DE GRÁFICOS */}
          <section
            aria-label="Gráficos de Desempenho"
            className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* GRÁFICO 1: MÉTODOS DE PAGAMENTO */}
            <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg flex flex-col justify-between">
              <CardHeader className="p-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Wallet className="size-4 text-amber-400" aria-hidden="true" /> Fluxo por Método (€)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[260px] p-2 pt-4">
                {analytics.paymentStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    Sem histórico disponível
                  </div>
                ) : (
                  <>
                    <div className="sr-only">
                      Tabela de métodos de pagamento:{" "}
                      {analytics.paymentStats
                        .map((s) => `${s.name}: ${s.value.toFixed(2)}€`)
                        .join(", ")}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.paymentStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={5}
                          cornerRadius={4}
                          dataKey="value"
                        >
                          {analytics.paymentStats.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </CardContent>
            </Card>

            {/* GRÁFICO 2: FATURAÇÃO POR BARBEIRO */}
            <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg flex flex-col justify-between">
              <CardHeader className="p-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-zinc-200">
                  Faturação por Barbeiro (€)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[260px] p-2 pt-4">
                {analytics.professionalStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    Sem dados operacionais
                  </div>
                ) : (
                  <>
                    <div className="sr-only">
                      Faturação por barbeiro:{" "}
                      {analytics.professionalStats
                        .map((s) => `${s.name}: ${s.value.toFixed(2)}€`)
                        .join(", ")}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.professionalStats}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 11 }}
                          dy={6}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        />
                        <RechartsTooltip content={<CustomChartTooltip />} />
                        <Bar
                          dataKey="value"
                          fill="#38bdf8"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </CardContent>
            </Card>

            {/* GRÁFICO 3: TOP SERVIÇOS EM FATURAÇÃO */}
            <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-lg flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <CardHeader className="p-4 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-zinc-200">
                  Top Serviços Ganhos (€)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[260px] p-2 pt-4">
                {analytics.serviceStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    Sem registos
                  </div>
                ) : (
                  <>
                    <div className="sr-only">
                      Serviços mais rentáveis:{" "}
                      {analytics.serviceStats
                        .map((s) => `${s.name}: ${s.value.toFixed(2)}€`)
                        .join(", ")}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.serviceStats}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={75}
                          tick={{ fill: "#a1a1aa", fontSize: 10 }}
                        />
                        <RechartsTooltip content={<CustomChartTooltip />} />
                        <Bar
                          dataKey="value"
                          fill="#10b981"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}