'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

type Analytics = {
  plan: 'free' | 'pro' | 'enterprise';
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  overview: {
    revenue: number;
    previousRevenue: number;
    revenueChangePercent: number | null;
    appointments: number;
    completedAppointments: number;
    scheduledAppointments: number;
    cancelledAppointments: number;
    cancellationRate: number;
    newClients: number;
    totalClients: number;
    activeClientsInPeriod: number;
  };
  revenueByDay: { date: string; value: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  professionals: { name: string; appointments: number; revenue: number }[];
  clientAgeGroups: { label: string; count: number }[];
  enterprise?: {
    posRevenue: number;
    posTransactions: number;
    combinedRevenue: number;
    locations: { locationId: string; transactions: number; revenue: number }[];
  };
};

function money(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function downloadUrl(type: 'appointments' | 'clients' | 'pos', from: string, to: string) {
  return `/api/analytics/export?type=${type}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

function excelUrl(type: 'appointments' | 'clients' | 'pos', from: string, to: string) {
  return `/api/analytics/export-excel?type=${type}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

function humanDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function AnalyticsPage() {
  const { hasFeature, plan, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature('advanced_analytics');
  const [from, setFrom] = useState(() => dateInput(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Não foi possível carregar os analytics.');
      setData(json as Analytics);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar analytics.');
    } finally {
      setLoading(false);
    }
  }, [allowed, from, to]);

  useEffect(() => { void load(); }, [load]);

  const maxRevenue = useMemo(() => Math.max(...(data?.revenueByDay.map((item) => item.value) ?? [1]), 1), [data]);
  const maxAgeGroup = useMemo(() => Math.max(...(data?.clientAgeGroups.map((item) => item.count) ?? [1]), 1), [data]);

  if (accessLoading) {
    return <main className="min-h-screen bg-background p-8"><div className="mx-auto max-w-7xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-32 w-full" /></div></main>;
  }

  if (!allowed) {
    return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Analytics avançado</h1><p className="text-muted-foreground">Esta área está disponível no plano Pro e superiores.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-medium uppercase tracking-widest text-primary">Analytics · {plan === 'enterprise' ? 'Enterprise' : 'Pro'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Performance do negócio</h1><p className="mt-1 text-muted-foreground">Receita, marcações, clientes e desempenho num único painel.</p></div>
          <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button>
        </header>

        <Card><CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end">
          <div className="flex-1"><label className="text-xs text-muted-foreground" htmlFor="analytics-from">De</label><Input id="analytics-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" /></div>
          <div className="flex-1"><label className="text-xs text-muted-foreground" htmlFor="analytics-to">Até</label><Input id="analytics-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" /></div>
          <Button onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
        </CardContent></Card>

        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric title="Receita" value={money(data.overview.revenue)} icon={<Wallet className="h-4 w-4" />} change={data.overview.revenueChangePercent} />
              <Metric title="Marcações" value={String(data.overview.appointments)} icon={<CalendarDays className="h-4 w-4" />} />
              <Metric title="Clientes novos" value={String(data.overview.newClients)} icon={<Users className="h-4 w-4" />} />
              <Metric title="Cancelamentos" value={`${data.overview.cancellationRate.toFixed(1)}%`} icon={<CheckCircle2 className="h-4 w-4" />} />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Receita diária</CardTitle></CardHeader><CardContent>{data.revenueByDay.length === 0 ? <Empty /> : <><div className="flex h-64 min-w-0 items-end gap-1 overflow-hidden">{data.revenueByDay.map((item) => <div key={item.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${item.date}: ${money(item.value)}`}><div className="min-h-1 rounded-t bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max((item.value / maxRevenue) * 100, item.value ? 3 : 0)}%` }} /></div>)}</div><div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground"><span>{data.revenueByDay[0]?.date}</span><span>{data.revenueByDay.at(-1)?.date}</span></div></>}</CardContent></Card>
              <Card><CardHeader><CardTitle>Resumo operacional</CardTitle></CardHeader><CardContent className="space-y-4"><Stat label="Concluídas" value={data.overview.completedAppointments} /><Stat label="Agendadas" value={data.overview.scheduledAppointments} /><Stat label="Canceladas" value={data.overview.cancelledAppointments} /><Stat label="Clientes ativos" value={data.overview.activeClientsInPeriod} /></CardContent></Card>
            </section>

            <Card><CardHeader><CardTitle>Perfil etário dos clientes</CardTitle><p className="text-sm text-muted-foreground">Clientes únicos com data de nascimento conhecida que tiveram serviços concluídos no período.</p></CardHeader><CardContent>{data.clientAgeGroups.length === 0 ? <Empty /> : <div className="space-y-4">{data.clientAgeGroups.map((item) => <div key={item.label} className="grid gap-2 sm:grid-cols-[100px_1fr_48px] sm:items-center"><span className="text-sm text-muted-foreground">{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max((item.count / maxAgeGroup) * 100, 4)}%` }} /></div><span className="text-right text-sm font-semibold">{item.count}</span></div>)}</div>}</CardContent></Card>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Serviços mais vendidos</CardTitle></CardHeader><CardContent className="space-y-3">{data.topServices.length ? data.topServices.map((item) => <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.count} marcações</p></div><span className="shrink-0 font-semibold">{money(item.revenue)}</span></div>) : <Empty />}</CardContent></Card>
              <Card><CardHeader><CardTitle>Performance dos profissionais</CardTitle></CardHeader><CardContent className="space-y-3">{data.professionals.length ? data.professionals.map((item) => <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.appointments} marcações</p></div><span className="shrink-0 font-semibold">{money(item.revenue)}</span></div>) : <Empty />}</CardContent></Card>
            </section>

            <section>
              <Card className="overflow-hidden"><CardHeader className="border-b border-border bg-muted/20"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Exportar dados úteis</CardTitle><p className="mt-1 text-sm text-muted-foreground">Relatórios profissionais para arquivo e exportações Excel formatadas.</p></div><div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"><FileSpreadsheet className="h-3.5 w-3.5" />{humanDate(from)} — {humanDate(to)}</div></div></CardHeader>
                <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
                  <ExportCard href={downloadUrl('appointments', from, to)} excelHref={excelUrl('appointments', from, to)} eyebrow="Operação" title="Marcações" description="Data, estado, cliente, serviço, profissional, pagamento e total." icon={<CalendarDays className="h-5 w-5" />} cta="Relatório" />
                  <ExportCard href={downloadUrl('clients', from, to)} excelHref={excelUrl('clients', from, to)} eyebrow="CRM" title="Clientes" description="Contactos, data de nascimento e data de registo para gestão de clientes." icon={<Users className="h-5 w-5" />} cta="Relatório" />
                  {plan === 'enterprise' ? <ExportCard href={downloadUrl('pos', from, to)} excelHref={excelUrl('pos', from, to)} eyebrow="Financeiro" title="POS" description="Subtotal, descontos, total, pagamento e estado das transações." icon={<Wallet className="h-5 w-5" />} cta="Relatório" /> : <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 opacity-75"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Wallet className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financeiro</p><h3 className="font-semibold">POS</h3></div></div><p className="mt-4 text-sm leading-5 text-muted-foreground">Exportação financeira disponível no plano Enterprise.</p><Button asChild variant="outline" className="mt-5 w-full"><Link href="/plans">Ver Enterprise</Link></Button></div>}
                </CardContent>
              </Card>
            </section>

            {data.enterprise && <section><Card><CardHeader><CardTitle>Enterprise · visão financeira</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Stat label="Receita POS" value={money(data.enterprise.posRevenue)} /><Stat label="Transações POS" value={data.enterprise.posTransactions} /><Stat label="Receita combinada" value={money(data.enterprise.combinedRevenue)} /></CardContent></Card></section>}
          </>
        )}
      </div>
    </main>
  );
}

function ExportCard({ href, excelHref, eyebrow, title, description, icon, cta }: { href: string; excelHref: string; eyebrow: string; title: string; description: string; icon: React.ReactNode; cta: string }) {
  return <div className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</span></div><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><div className="mt-5 grid grid-cols-2 gap-2"><Button asChild variant="outline"><a href={href}><Download className="mr-2 h-4 w-4" />{cta}</a></Button><Button asChild><a href={excelHref}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</a></Button></div></div>;
}

function Metric({ title, value, icon, change }: { title: string; value: string; icon: React.ReactNode; change?: number | null }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">{title}{icon}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{value}</p>{change !== undefined && change !== null && <p className={`mt-1 flex items-center text-xs ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{change >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}{Math.abs(change).toFixed(1)}% vs período anterior</p>}</CardContent></Card>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function Empty() { return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados para o período selecionado.</p>; }
