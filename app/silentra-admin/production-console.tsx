'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Gauge,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';

type Plan = 'free' | 'pro' | 'enterprise';
type Overview = {
  generatedAt: string;
  stats: {
    barbershops: number;
    users: number;
    owners: number;
    barbers: number;
    clients: number;
    appointments: number;
    upcomingAppointments: number;
    activeSubscriptions: number;
    planAssignments: number;
  };
  plans: { free: number; pro: number; enterprise: number };
  recentShops: Array<{
    id: string;
    name: string;
    slug: string | null;
    created_at: string | null;
    plan: Plan;
    assigned: boolean;
    expires_at: string | null;
  }>;
};
type ShopSnapshot = {
  shop: {
    id: string;
    name: string;
    slug: string | null;
    created_at: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  owner: {
    id: string;
    email: string | null;
    name_complete: string | null;
  } | null;
  plan: {
    effective: Plan;
    source: string;
    assignment: {
      reason: string | null;
      expires_at: string | null;
      assigned_at: string;
    } | null;
    subscription: {
      status: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    } | null;
  };
  metrics: {
    members: number;
    todayAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
  };
};

type Health = { ok: boolean; status: number; latencyMs: number };
const tabs = ['overview', 'tenants', 'plans', 'diagnostics'] as const;
type Tab = (typeof tabs)[number];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
function titleForTab(tab: Tab) {
  return {
    overview: 'Overview',
    tenants: 'Tenants',
    plans: 'Planos',
    diagnostics: 'Diagnóstico',
  }[tab];
}
function planClass(plan: Plan) {
  return plan === 'enterprise'
    ? 'bg-violet-400/10 text-violet-200'
    : plan === 'pro'
      ? 'bg-emerald-400/10 text-emerald-200'
      : 'bg-white/5 text-zinc-400';
}

function Metric({
  label,
  value,
  meta,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const Icon =
    tone === 'good'
      ? CheckCircle2
      : tone === 'warn'
        ? AlertTriangle
        : tone === 'bad'
          ? XCircle
          : Activity;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          {meta ? <p className="mt-1 text-xs text-zinc-500">{meta}</p> : null}
        </div>
        <Icon
          className={`size-4 ${tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-red-400' : 'text-zinc-600'}`}
        />
      </div>
    </div>
  );
}

export default function ProductionConsole() {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<Overview | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<
    Overview['recentShops'][number] | null
  >(null);
  const [snapshot, setSnapshot] = useState<ShopSnapshot | null>(null);
  const [plan, setPlan] = useState<Plan>('pro');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [notice, setNotice] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  const notify = (type: 'ok' | 'error', text: string) =>
    setNotice({ type, text });

  const loadOverview = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/silentra-admin/overview?q=${encodeURIComponent(search)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error || 'Não foi possível carregar o overview.',
        );
      setData(payload);
    } catch (error) {
      notify(
        'error',
        error instanceof Error ? error.message : 'Erro ao carregar o overview.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSnapshot = useCallback(async (shopId: string) => {
    try {
      const response = await fetch(
        `/api/silentra-admin/shop?barbershopId=${encodeURIComponent(shopId)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || 'Não foi possível carregar o tenant.');
      setSnapshot(payload);
      const effective = payload.plan?.effective as Plan | undefined;
      if (effective) setPlan(effective);
      setReason(payload.plan?.assignment?.reason ?? '');
      setExpiresAt(
        payload.plan?.assignment?.expires_at
          ? new Date(payload.plan.assignment.expires_at)
              .toISOString()
              .slice(0, 16)
          : '',
      );
    } catch (error) {
      notify(
        'error',
        error instanceof Error ? error.message : 'Erro ao carregar o tenant.',
      );
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const selectShop = (shop: Overview['recentShops'][number]) => {
    setSelected(shop);
    setTab('tenants');
    void loadSnapshot(shop.id);
  };

  const assignPlan = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch('/api/silentra-admin/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbershopId: selected.id,
          plan,
          reason,
          expiresAt: expiresAt || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || 'Não foi possível atribuir o plano.');
      notify('ok', `Plano ${plan.toUpperCase()} atribuído a ${selected.name}.`);
      await loadOverview(query);
      await loadSnapshot(selected.id);
    } catch (error) {
      notify(
        'error',
        error instanceof Error ? error.message : 'Erro ao atribuir o plano.',
      );
    } finally {
      setSaving(false);
    }
  };

  const clearPlan = async () => {
    if (
      !selected ||
      !window.confirm(`Remover a atribuição manual de ${selected.name}?`)
    )
      return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/silentra-admin/plan?barbershopId=${encodeURIComponent(selected.id)}`,
        { method: 'DELETE' },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error || 'Não foi possível remover a atribuição.',
        );
      notify('ok', `Override removido de ${selected.name}.`);
      await loadOverview(query);
      await loadSnapshot(selected.id);
    } catch (error) {
      notify(
        'error',
        error instanceof Error ? error.message : 'Erro ao remover o plano.',
      );
    } finally {
      setSaving(false);
    }
  };

  const runHealth = async () => {
    const started = performance.now();
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      setHealth({
        ok: response.ok,
        status: response.status,
        latencyMs: Math.round(performance.now() - started),
      });
    } catch {
      setHealth({
        ok: false,
        status: 0,
        latencyMs: Math.round(performance.now() - started),
      });
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    notify('ok', 'Copiado.');
  };
  const selectedPublicUrl = selected?.slug
    ? `${window.location.origin}/barbershops/${selected.slug}`
    : null;

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-30 mb-5 rounded-2xl border border-red-400/15 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
                <ShieldCheck className="size-3.5" /> Silentra / Internal
              </div>
              <div className="mt-2 flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Production Control Center
                </h1>
                <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-1 text-[10px] font-semibold uppercase text-red-300">
                  Private
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                Operação, diagnósticos e administração do SaaS. Todas as
                mutações passam por autorização server-side.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview(query)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]"
            >
              <RefreshCw
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`min-h-10 shrink-0 rounded-xl border px-4 text-sm font-medium ${tab === item ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-zinc-500 hover:text-zinc-200'}`}
              >
                {titleForTab(item)}
              </button>
            ))}
          </div>
        </header>

        {notice ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${notice.type === 'ok' ? 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200' : 'border-red-400/20 bg-red-400/[0.05] text-red-200'}`}
          >
            {notice.text}
          </div>
        ) : null}

        {tab === 'overview' && data ? (
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Barbearias"
                value={data.stats.barbershops}
                meta="tenants"
              />
              <Metric
                label="Utilizadores"
                value={data.stats.users}
                meta={`${data.stats.owners} owners · ${data.stats.barbers} barbeiros`}
              />
              <Metric label="Clientes" value={data.stats.clients} meta="CRM" />
              <Metric
                label="Bookings"
                value={data.stats.appointments}
                meta={`${data.stats.upcomingAppointments} futuros`}
                tone={data.stats.upcomingAppointments ? 'good' : 'neutral'}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Free"
                value={data.plans.free}
                meta="plano efetivo"
              />
              <Metric
                label="Pro"
                value={data.plans.pro}
                meta="plano efetivo"
                tone="good"
              />
              <Metric
                label="Enterprise"
                value={data.plans.enterprise}
                meta="plano efetivo"
                tone="good"
              />
              <Metric
                label="Overrides"
                value={data.stats.planAssignments}
                meta={`${data.stats.activeSubscriptions} subscrições`}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Acesso rápido aos tenants</h2>
                    <p className="mt-1 text-xs text-zinc-600">
                      Seleciona uma barbearia para abrir o snapshot operacional.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('tenants')}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Todos
                  </button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {data.recentShops.slice(0, 8).map((shop) => (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => selectShop(shop)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 p-3 text-left hover:border-white/15"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {shop.name}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-zinc-600">
                          {shop.slug || shop.id}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${planClass(shop.plan)}`}
                      >
                        {shop.plan}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-emerald-300" />
                  <h2 className="font-semibold">Health check</h2>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Verificação operacional rápida do endpoint de saúde.
                </p>
                <button
                  type="button"
                  onClick={() => void runHealth()}
                  className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm hover:bg-white/[0.08]"
                >
                  Executar
                </button>
                {health ? (
                  <div
                    className={`mt-3 rounded-xl border p-3 ${health.ok ? 'border-emerald-400/15 bg-emerald-400/[0.04]' : 'border-red-400/15 bg-red-400/[0.04]'}`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{health.ok ? 'Healthy' : 'Falha'}</span>
                      <span className="font-mono text-xs text-zinc-500">
                        {health.status} · {health.latencyMs}ms
                      </span>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-700">
              <Clock3 className="size-3.5" />
              Última atualização: {formatDate(data.generatedAt)}
            </div>
          </section>
        ) : null}

        {tab === 'tenants' && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Pesquisar tenant
                  </label>
                  <div className="mt-2 relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void loadOverview(query);
                      }}
                      placeholder="Nome, slug ou UUID"
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-sm outline-none focus:border-emerald-400/30"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadOverview(query)}
                  className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950"
                >
                  Pesquisar
                </button>
              </div>
              <div className="mt-5 space-y-2">
                {data?.recentShops.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => selectShop(shop)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left ${selected?.id === shop.id ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : 'border-white/8 bg-black/15 hover:border-white/15'}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{shop.name}</p>
                      <p className="mt-1 truncate text-xs text-zinc-600">
                        {shop.slug || shop.id}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-700">
                        Criada {formatDate(shop.created_at)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${planClass(shop.plan)}`}
                    >
                      {shop.plan}
                    </span>
                  </button>
                ))}
                {!loading && (data?.recentShops.length ?? 0) === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">
                    Nenhuma barbearia encontrada.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              {snapshot ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="size-4 text-emerald-300" />
                        <h2 className="font-semibold">{snapshot.shop.name}</h2>
                      </div>
                      <p className="mt-1 break-all text-[11px] text-zinc-700">
                        {snapshot.shop.id}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${planClass(snapshot.plan.effective)}`}
                    >
                      {snapshot.plan.effective}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Metric label="Membros" value={snapshot.metrics.members} />
                    <Metric
                      label="Hoje"
                      value={snapshot.metrics.todayAppointments}
                    />
                    <Metric
                      label="Próximos"
                      value={snapshot.metrics.upcomingAppointments}
                      tone="good"
                    />
                    <Metric
                      label="Cancelados"
                      value={snapshot.metrics.cancelledAppointments}
                      tone={
                        snapshot.metrics.cancelledAppointments
                          ? 'warn'
                          : 'neutral'
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-2 rounded-xl border border-white/8 bg-black/15 p-3 text-xs">
                    <p>
                      <span className="text-zinc-600">Owner:</span>{' '}
                      {snapshot.owner?.name_complete ||
                        snapshot.owner?.email ||
                        '—'}
                    </p>
                    <p>
                      <span className="text-zinc-600">Plano:</span>{' '}
                      {snapshot.plan.effective} · origem {snapshot.plan.source}
                    </p>
                    <p>
                      <span className="text-zinc-600">Booking públicos:</span>{' '}
                      /barbershops/{snapshot.shop.slug || snapshot.shop.id}
                    </p>
                    {snapshot.plan.assignment?.expires_at ? (
                      <p>
                        <span className="text-zinc-600">Override expira:</span>{' '}
                        {formatDate(snapshot.plan.assignment.expires_at)}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        snapshot.shop.slug
                          ? window.open(
                              `/barbershops/${snapshot.shop.slug}`,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          : null
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs"
                    >
                      <ExternalLink className="size-3.5" />
                      Abrir página
                    </button>
                    <button
                      type="button"
                      onClick={() => void copy(snapshot.shop.id)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs"
                    >
                      <Copy className="size-3.5" />
                      Copiar ID
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <Building2 className="size-7 text-zinc-700" />
                  <p className="mt-3 text-sm text-zinc-600">
                    Seleciona uma barbearia para abrir o snapshot.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'plans' && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-emerald-300" />
                <h2 className="font-semibold">Entitlement administrativo</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                O override altera o plano efetivo da barbearia sem criar ou
                modificar uma cobrança Stripe.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {(['free', 'pro', 'enterprise'] as Plan[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlan(item)}
                    className={`rounded-xl border p-4 text-left ${plan === item ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-white/10 bg-black/15'}`}
                  >
                    <p className="font-semibold uppercase">{item}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {item === 'free'
                        ? 'Base'
                        : item === 'pro'
                          ? 'Pro'
                          : 'Enterprise'}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs text-zinc-500">Motivo</span>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    placeholder="Beta, compensação, suporte…"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-zinc-500">
                    Expiração opcional
                  </span>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30"
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={!selected || saving}
                  onClick={() => void assignPlan()}
                  className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 disabled:opacity-40"
                >
                  {saving ? 'A guardar…' : 'Atribuir plano'}
                </button>
                <button
                  type="button"
                  disabled={!selected || saving}
                  onClick={() => void clearPlan()}
                  className="min-h-11 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 text-sm font-semibold text-red-200 disabled:opacity-40"
                >
                  Remover override
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <h2 className="font-semibold">Contexto</h2>
              {snapshot ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-600">Barbearia</p>
                    <p className="mt-1 font-medium">{snapshot.shop.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Plano efetivo</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${planClass(snapshot.plan.effective)}`}
                    >
                      {snapshot.plan.effective}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Origem</p>
                    <p className="mt-1">{snapshot.plan.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Owner</p>
                    <p className="mt-1 break-all text-zinc-300">
                      {snapshot.owner?.email || '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-600">
                  Seleciona primeiro uma barbearia em Tenants.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === 'diagnostics' && (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-emerald-300" />
                <h2 className="font-semibold">Quick diagnostics</h2>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => void runHealth()}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-black/15 px-4 text-sm"
                >
                  <span>/api/health</span>
                  <span className="text-zinc-600">
                    {health
                      ? `${health.status} · ${health.latencyMs}ms`
                      : 'Executar'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void loadOverview(query)}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-black/15 px-4 text-sm"
                >
                  <span>Admin overview</span>
                  <span className="text-zinc-600">Executar</span>
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.02] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-amber-300" />
                <h2 className="font-semibold">Hardening</h2>
              </div>
              <div className="mt-4 space-y-2 text-xs leading-5 text-zinc-500">
                <p>
                  Autorização: sessão Supabase + allowlist de platform admin.
                </p>
                <p>Mutations: apenas endpoints internos server-side.</p>
                <p>Plano: entitlement por barbearia, separado de Stripe.</p>
                <p>Secrets: não são enviados ao browser.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
