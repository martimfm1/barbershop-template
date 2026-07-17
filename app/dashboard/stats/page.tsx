"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";

// SERVICES
import { appointmentService } from "@/app/dashboard/_services/appointments.service";

// UI COMPONENTS
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

// RECHARTS (GRÁFICOS MIGRADOS)
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
  Legend,
} from "recharts";

// ICONS
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Scissors,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { Appointment } from "@/_types";

// Palete de cores premium para produção (Zinc/Slate harmonizado)
const STATS_COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

export default function StatsPage() {
  // const router = useRouter();
  const { barbershopId } = useBarbershop();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch centralizado das marcações desta unidade
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
    const serviceCounts: Record<string, { count: number; total: number }> = {};
    const paymentGroups: Record<string, number> = {};
    const professionalGroups: Record<string, number> = {};

    completedApps.forEach((app) => {
      const price = Number(app.services?.price || 0);
      const serviceName = app.services?.name || "Outros";
      const paymentMethod = app.payment_method || "Não Especificado";
      const barberName = app.professionals?.name || "Casa / Geral";

      totalRevenue += price;

      if (!serviceCounts[serviceName])
        serviceCounts[serviceName] = { count: 0, total: 0 };
      serviceCounts[serviceName].count += 1;
      serviceCounts[serviceName].total += price;

      paymentGroups[paymentMethod] =
        (paymentGroups[paymentMethod] || 0) + price;

      professionalGroups[barberName] =
        (professionalGroups[barberName] || 0) + price;
    });

    const avgTicket =
      completedApps.length > 0 ? totalRevenue / completedApps.length : 0;

    let mostPopularService = "Nenhum";
    let maxCount = 0;
    Object.entries(serviceCounts).forEach(([name, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostPopularService = name;
      }
    });

    const paymentStatsData = Object.entries(paymentGroups).map(
      ([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }),
    );

    const professionalStatsData = Object.entries(professionalGroups).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    const serviceStatsData = Object.entries(serviceCounts).map(
      ([name, data]) => ({
        name,
        value: data.total,
      }),
    );

    return {
      insights: {
        avgTicket,
        mostPopular: mostPopularService,
        completedCount: completedApps.length,
      },
      paymentStats: paymentStatsData,
      professionalStats: professionalStatsData,
      serviceStats: serviceStatsData,
    };
  }, [appointments]);

  // if (loading) {
  //   return (
  //     <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white">
  //       <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-emerald-500 mb-2" />
  //       <p className="text-xs text-zinc-400 font-medium animate-pulse">
  //         A processar relatórios de faturação em tempo real...
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <TrendingUp className="text-emerald-400 size-8 mr-2" /> Relatórios
            de Faturação
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Métricas financeiras consolidadas da tua barbearia.
          </p>
        </div>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 cursor-pointer text-xs"
          >
            <ArrowLeft className="size-4 mr-2" /> Voltar ao Painel
          </Button>
        </Link>
      </div>

      {/* ⚡ GRID DE KPIS SUPERIORES */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="size-4 text-emerald-400" /> Ticket Médio /
              Corte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              {analytics.insights.avgTicket.toFixed(2)}€
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="size-4 text-purple-400" /> Serviço Mais
              Solicitado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-zinc-100 truncate">
              {analytics.insights.mostPopular}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="size-4 text-blue-400" /> Serviços
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">
              {analytics.insights.completedCount}{" "}
              <span className="text-sm font-normal text-zinc-400">cortes</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 ÁREA METRIFICADA - GRÁFICOS DINÂMICOS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* GRÁFICO 1: MÉTODOS DE PAGAMENTO */}
        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Wallet className="size-4 text-amber-400" /> Fluxo por Método (€)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            {analytics.paymentStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Sem histórico disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.paymentStats}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {analytics.paymentStats.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={STATS_COLORS[index % STATS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => `${Number(value).toFixed(2)}€`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* GRÁFICO 2: FATURAÇÃO POR PROFISSIONAL */}
        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">
              Faturação por Barbeiro (€)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            {analytics.professionalStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Sem dados operacionais
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.professionalStats}>
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => `${Number(value).toFixed(2)}€`}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* GRÁFICO 3: TOP SERVIÇOS EM FATURAÇÃO */}
        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">
              Top Serviços Ganhos (€)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            {analytics.serviceStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Sem registos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.serviceStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="rgba(255,255,255,0.7)"
                    width={90}
                    fontSize={10}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => `${Number(value).toFixed(2)}€`}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
