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
  Users,
  Wallet,
  Sparkles,
  Target,
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
function humanDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
function downloadUrl(
  type: 'appointments' | 'clients' | 'pos',
  from: string,
  to: string,
  format: 'html' | 'excel',
) {
  const endpoint =
    format === 'excel'
      ? '/api/analytics/export-excel'
      : '/api/analytics/export';
  return `${endpoint}?type=${type}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export default function AnalyticsPage() {
  const { hasFeature, plan, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature('advanced_analytics');
  const [from, setFrom] = useState(() =>
    dateInput(new Date(Date.now() - 29 * 86400000)),
  );
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: 'no-store' },
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(
          json.error ?? 'Não foi possível carregar os analytics.',
        );
      setData(json as Analytics);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar analytics.',
      );
    } finally {
      setLoading(false);
    }
  }, [allowed, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const insights = useMemo(() => {
    if (!data) return [] as string[];
    const start = new Date(
      `${data.period.from.slice(0, 10)}T00:00:00`,
    ).getTime();
    const end = new Date(`${data.period.to.slice(0, 10)}T00:00:00`).getTime();
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
    const avgDailyAppointments = data.overview.appointments / days;
    const avgTicket =
      data.overview.completedAppointments > 0
        ? data.overview.revenue / data.overview.completedAppointments
        : 0;
    const completionRate =
      data.overview.appointments > 0
        ? (data.overview.completedAppointments / data.overview.appointments) *
          100
        : 0;
    const topService = data.topServices[0];
    const messages: string[] = [];
    if (data.overview.revenueChangePercent !== null) {
      messages.push(
        data.overview.revenueChangePercent >= 0
          ? `A receita cresceu ${Math.abs(data.overview.revenueChangePercent).toFixed(1)}% face ao período anterior.`
          : `A receita caiu ${Math.abs(data.overview.revenueChangePercent).toFixed(1)}% face ao período anterior.`,
      );
    }
    messages.push(
      `Ticket médio de ${money(avgTicket)} por marcação concluída.`,
    );
    messages.push(
      `${completionRate.toFixed(1)}% das marcações do período foram concluídas.`,
    );
    if (topService)
      messages.push(
        `${topService.name} lidera em receita, com ${money(topService.revenue)}.`,
      );
    messages.push(
      `Média de ${avgDailyAppointments.toFixed(1)} marcações por dia.`,
    );
    return messages.slice(0, 5);
  }, [data]);

  const businessMetrics = useMemo(() => {
    if (!data) return null;
    const start = new Date(
      `${data.period.from.slice(0, 10)}T00:00:00`,
    ).getTime();
    const end = new Date(`${data.period.to.slice(0, 10)}T00:00:00`).getTime();
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
    const completed = data.overview.completedAppointments;
    const appointments = data.overview.appointments;
    const averageTicket = completed ? data.overview.revenue / completed : 0;
    const completionRate = appointments ? (completed / appointments) * 100 : 0;
    const clientRevenue = data.overview.activeClientsInPeriod
      ? data.overview.revenue / data.overview.activeClientsInPeriod
      : 0;
    const newClientRate = data.overview.totalClients
      ? (data.overview.newClients / data.overview.totalClients) * 100
      : 0;
    return {
      averageTicket,
      completionRate,
      clientRevenue,
      newClientRate,
      cancellationRate: data.overview.cancellationRate,
      dailyAppointments: appointments / days,
    };
  }, [data]);

  if (accessLoading)
    return (
      <main className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </main>
    );

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-24">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
              <Lock className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold">Analytics avançado</h1>
              <p className="text-muted-foreground">
                Esta área está disponível no plano Pro e superiores.
              </p>
              <Button asChild>
                <Link href="/dashboard/billing">Fazer upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const maxRevenue = Math.max(
    ...(data?.revenueByDay.map((item) => item.value) ?? [1]),
    1,
  );
  const maxServiceRevenue = Math.max(
    ...(data?.topServices.map((item) => item.revenue) ?? [1]),
    1,
  );
  const maxProfessionalRevenue = Math.max(
    ...(data?.professionals.map((item) => item.revenue) ?? [1]),
    1,
  );
  const maxAgeGroup = Math.max(
    ...(data?.clientAgeGroups.map((item) => item.count) ?? [1]),
    1,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-border bg-gradient-to-br from-background via-background to-primary/[0.05] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <BarChart3 className="h-4 w-4" /> Analytics ·{' '}
                {plan === 'enterprise' ? 'Enterprise' : 'Pro'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Performance do negócio
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Uma leitura rápida do que está a acontecer na tua barbearia, com
                foco em receita, operação, clientes e equipa.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="analytics-from"
              >
                De
              </label>
              <Input
                id="analytics-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="analytics-to"
              >
                Até
              </label>
              <Input
                id="analytics-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={() => void load()} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              {loading ? 'A atualizar' : 'Atualizar'}
            </Button>
          </div>
        </header>

        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                title="Receita"
                value={money(data.overview.revenue)}
                detail={
                  data.overview.revenueChangePercent === null
                    ? 'Sem comparação disponível'
                    : `${data.overview.revenueChangePercent >= 0 ? '+' : ''}${data.overview.revenueChangePercent.toFixed(1)}% vs período anterior`
                }
                icon={<Wallet className="h-4 w-4" />}
                positive={
                  data.overview.revenueChangePercent === null
                    ? undefined
                    : data.overview.revenueChangePercent >= 0
                }
              />
              <Metric
                title="Ticket médio"
                value={money(businessMetrics?.averageTicket ?? 0)}
                detail="Por marcação concluída"
                icon={<Target className="h-4 w-4" />}
              />
              <Metric
                title="Clientes ativos"
                value={String(data.overview.activeClientsInPeriod)}
                detail={`${data.overview.newClients} novos no período`}
                icon={<Users className="h-4 w-4" />}
              />
              <Metric
                title="Taxa de conclusão"
                value={`${(businessMetrics?.completionRate ?? 0).toFixed(1)}%`}
                detail={`${data.overview.cancelledAppointments} cancelamentos`}
                icon={<CheckCircle2 className="h-4 w-4" />}
                positive={(businessMetrics?.completionRate ?? 0) >= 70}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Receita ao longo do período
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {humanDate(data.period.from)} —{' '}
                        {humanDate(data.period.to)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {money(data.overview.revenue)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {data.revenueByDay.length === 0 ? (
                    <Empty />
                  ) : (
                    <>
                      <div className="flex h-72 items-end gap-1.5 overflow-hidden sm:gap-2">
                        {data.revenueByDay.map((item) => (
                          <div
                            key={item.date}
                            className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                            title={`${humanDate(item.date)} · ${money(item.value)}`}
                          >
                            <div
                              className="rounded-t-md bg-primary/75 transition-all group-hover:bg-primary"
                              style={{
                                height: `${item.value ? Math.max((item.value / maxRevenue) * 100, 3) : 0}%`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          {humanDate(
                            data.revenueByDay[0]?.date ?? data.period.from,
                          )}
                        </span>
                        <span>
                          {humanDate(
                            data.revenueByDay.at(-1)?.date ?? data.period.to,
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resumo operacional</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Volume e qualidade da operação.
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Stat label="Marcações" value={data.overview.appointments} />
                  <Stat
                    label="Concluídas"
                    value={data.overview.completedAppointments}
                  />
                  <Stat
                    label="Agendadas"
                    value={data.overview.scheduledAppointments}
                  />
                  <Stat
                    label="Canceladas"
                    value={data.overview.cancelledAppointments}
                  />
                  <Stat
                    label="Média / dia"
                    value={(businessMetrics?.dailyAppointments ?? 0).toFixed(1)}
                  />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Insights automáticos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Sinais úteis para decidir onde agir.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-2xl border border-border bg-muted/10 p-4 text-sm leading-6"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Saúde da base de clientes</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Indicadores derivados do período selecionado.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <MetricMini
                    label="Receita / cliente ativo"
                    value={money(businessMetrics?.clientRevenue ?? 0)}
                  />
                  <MetricMini
                    label="Novos / base total"
                    value={`${(businessMetrics?.newClientRate ?? 0).toFixed(1)}%`}
                  />
                  <MetricMini
                    label="Taxa de cancelamento"
                    value={`${(businessMetrics?.cancellationRate ?? 0).toFixed(1)}%`}
                  />
                  <MetricMini
                    label="Clientes totais"
                    value={String(data.overview.totalClients)}
                  />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços mais vendidos</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Ordenados por receita.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.topServices.length ? (
                    data.topServices.map((item) => (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                          <span className="min-w-0 truncate font-medium">
                            {item.name}
                          </span>
                          <span className="shrink-0 font-semibold">
                            {money(item.revenue)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.max((item.revenue / maxServiceRevenue) * 100, 4)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.count} marcações
                        </p>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Performance dos profissionais</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Receita e volume concluído por profissional.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.professionals.length ? (
                    data.professionals.map((item) => (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                          <span className="min-w-0 truncate font-medium">
                            {item.name}
                          </span>
                          <span className="shrink-0 font-semibold">
                            {money(item.revenue)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/75"
                            style={{
                              width: `${Math.max((item.revenue / maxProfessionalRevenue) * 100, 4)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.appointments} marcações concluídas
                        </p>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil etário</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Clientes únicos com idade conhecida.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.clientAgeGroups.length ? (
                    data.clientAgeGroups.map((item) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-[72px_1fr_38px] items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/65"
                            style={{
                              width: `${Math.max((item.count / maxAgeGroup) * 100, 4)}%`,
                            }}
                          />
                        </div>
                        <span className="text-right font-semibold">
                          {item.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </CardContent>
              </Card>
              {data.enterprise ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Enterprise · visão financeira</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      POS combinado com a operação de marcações.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <MetricMini
                      label="Receita POS"
                      value={money(data.enterprise.posRevenue)}
                    />
                    <MetricMini
                      label="Transações POS"
                      value={String(data.enterprise.posTransactions)}
                    />
                    <MetricMini
                      label="Receita combinada"
                      value={money(data.enterprise.combinedRevenue)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Próximo passo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                      Ativa o Enterprise para acompanhar POS e receita combinada
                      por localização.
                    </div>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/plans">Comparar planos</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            <section>
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/20">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        Exportar dados
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Relatórios prontos para arquivo e Excel.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {humanDate(from)} — {humanDate(to)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ExportCard
                    title="Relatório de marcações"
                    description="Operação, estados, profissionais e receita."
                    type="appointments"
                    from={from}
                    to={to}
                  />
                  <ExportCard
                    title="Relatório de clientes"
                    description="Base CRM e evolução de clientes."
                    type="clients"
                    from={from}
                    to={to}
                  />
                  {plan === 'enterprise' ? (
                    <ExportCard
                      title="Relatório financeiro"
                      description="Transações POS, descontos e pagamentos."
                      type="pos"
                      from={from}
                      to={to}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5">
                      <p className="font-medium">Relatório financeiro</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Disponível no Enterprise.
                      </p>
                      <Button asChild variant="outline" className="mt-4 w-full">
                        <Link href="/plans">Ver Enterprise</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  detail,
  icon,
  positive,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p
          className={`mt-1 text-xs ${positive === undefined ? 'text-muted-foreground' : positive ? 'text-emerald-600' : 'text-red-500'}`}
        >
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}
function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
function Empty() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Sem dados para o período selecionado.
    </p>
  );
}
function ExportCard({
  title,
  description,
  type,
  from,
  to,
}: {
  title: string;
  description: string;
  type: 'appointments' | 'clients' | 'pos';
  from: string;
  to: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className="w-full">
          <a href={downloadUrl(type, from, to, 'html')}>
            <Download className="mr-2 h-4 w-4" />
            Relatório
          </a>
        </Button>
        <Button asChild className="w-full">
          <a href={downloadUrl(type, from, to, 'excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </a>
        </Button>
      </div>
    </div>
  );
}
