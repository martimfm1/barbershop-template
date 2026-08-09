"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Lock, RefreshCw, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type Analytics = {
  plan: "free" | "pro" | "enterprise";
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  overview: { revenue: number; previousRevenue: number; revenueChangePercent: number | null; appointments: number; completedAppointments: number; scheduledAppointments: number; cancelledAppointments: number; cancellationRate: number; newClients: number; totalClients: number; activeClientsInPeriod: number };
  revenueByDay: { date: string; value: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  professionals: { name: string; appointments: number; revenue: number }[];
  enterprise?: { posRevenue: number; posTransactions: number; combinedRevenue: number; locations: { locationId: string; transactions: number; revenue: number }[] };
};

function money(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value); }
function dateInput(date: Date) { return date.toISOString().slice(0, 10); }

export default function AnalyticsPage() {
  const { hasFeature, plan, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("advanced_analytics");
  const [from, setFrom] = useState(() => dateInput(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" });
      const json: unknown = await response.json();
      if (!response.ok) throw new Error(typeof json === "object" && json && "error" in json ? String(json.error) : "Não foi possível carregar os analytics.");
      setData(json as Analytics);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar analytics.");
    } finally { setLoading(false); }
  }, [allowed, from, to]);

  useEffect(() => { void load(); }, [load]);
  const maxRevenue = useMemo(() => Math.max(...(data?.revenueByDay.map((item) => item.value) ?? [1]), 1), [data]);

  if (accessLoading) return <main className="min-h-screen bg-background p-8"><div className="mx-auto max-w-7xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-32 w-full" /></div></main>;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Analytics avançado</h1><p className="text-muted-foreground">Esta área está disponível no plano Pro e superiores.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium uppercase tracking-widest text-primary">Analytics · {plan === "enterprise" ? "Enterprise" : "Pro"}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Performance do negócio</h1><p className="mt-1 text-muted-foreground">Receita, marcações, clientes e desempenho num único painel.</p></div><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button></header>

    <Card><CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end"><div className="flex-1"><label className="text-xs text-muted-foreground">De</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" /></div><div className="flex-1"><label className="text-xs text-muted-foreground">Até</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" /></div><Button onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button></CardContent></Card>

    {loading && !data ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : data && <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Receita" value={money(data.overview.revenue)} icon={<Wallet className="h-4 w-4" />} change={data.overview.revenueChangePercent} />
        <Metric title="Marcações" value={String(data.overview.appointments)} icon={<CalendarDays className="h-4 w-4" />} />
        <Metric title="Clientes novos" value={String(data.overview.newClients)} icon={<Users className="h-4 w-4" />} />
        <Metric title="Cancelamentos" value={`${data.overview.cancellationRate.toFixed(1)}%`} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Receita diária</CardTitle></CardHeader><CardContent>
          {data.revenueByDay.length === 0 ? <Empty /> : <><div className="flex h-64 min-w-0 items-end gap-1 overflow-hidden">{data.revenueByDay.map((item) => <div key={item.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${item.date}: ${money(item.value)}`}><div className="min-h-1 rounded-t bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max((item.value / maxRevenue) * 100, item.value ? 3 : 0)}%` }} /></div>)}</div><div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground"><span>{data.revenueByDay[0]?.date}</span><span>{data.revenueByDay.at(-1)?.date}</span></div></>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Resumo operacional</CardTitle></CardHeader><CardContent className="space-y-4"><Stat label="Concluídas" value={data.overview.completedAppointments} /><Stat label="Agendadas" value={data.overview.scheduledAppointments} /><Stat label="Canceladas" value={data.overview.cancelledAppointments} /><Stat label="Clientes ativos" value={data.overview.activeClientsInPeriod} /></CardContent></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Serviços mais vendidos</CardTitle></CardHeader><CardContent className="space-y-3">{data.topServices.length ? data.topServices.map((item) => <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.count} marcações</p></div><span className="shrink-0 font-semibold">{money(item.revenue)}</span></div>) : <Empty />}</CardContent></Card><Card><CardHeader><CardTitle>Performance dos profissionais</CardTitle></CardHeader><CardContent className="space-y-3">{data.professionals.length ? data.professionals.map((item) => <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.appointments} marcações</p></div><span className="shrink-0 font-semibold">{money(item.revenue)}</span></div>) : <Empty />}</CardContent></Card></section>

      {data.enterprise && <section><Card><CardHeader><CardTitle>Enterprise · visão financeira</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Stat label="Receita POS" value={money(data.enterprise.posRevenue)} /><Stat label="Transações POS" value={data.enterprise.posTransactions} /><Stat label="Receita combinada" value={money(data.enterprise.combinedRevenue)} /></CardContent></Card></section>}
    </>}
  </div></main>;
}

function Metric({ title, value, icon, change }: { title: string; value: string; icon: React.ReactNode; change?: number | null }) { return <Card><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">{title}{icon}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{value}</p>{change !== undefined && change !== null && <p className={`mt-1 flex items-center text-xs ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>{change >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}{Math.abs(change).toFixed(1)}% vs período anterior</p>}</CardContent></Card>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>; }
function Empty() { return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados para o período selecionado.</p>; }
