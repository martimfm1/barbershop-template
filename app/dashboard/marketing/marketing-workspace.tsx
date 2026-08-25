'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Cake,
  CheckCircle2,
  Clock3,
  Eye,
  Gift,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const MAX_BODY_LENGTH = 10000;

type Campaign = {
  id: string;
  name: string;
  channel: 'email' | 'sms';
  subject: string | null;
  body: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at?: string | null;
  trigger_type?: 'manual' | 'interval' | 'event' | 'birthday' | null;
  interval_value?: number | null;
  interval_unit?: 'hours' | 'days' | null;
  next_run_at?: string | null;
  event_name?: string | null;
  birthday_offset_days?: number | null;
  birthday_reward_type?: 'none' | 'free_service' | null;
  birthday_reward_service_id?: string | null;
  active?: boolean | null;
  total_recipients?: number | null;
  sent_count?: number | null;
  failed_count?: number | null;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number | null;
};

type FormState = {
  name: string;
  channel: 'email' | 'sms';
  subject: string;
  body: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'A enviar',
  completed: 'Concluída',
  sent: 'Enviada',
  failed: 'Falhou',
  cancelled: 'Cancelada',
};

const EVENT_LABELS: Record<string, string> = {
  booking_created: 'Depois de uma marcação criada',
  booking_completed: 'Depois de uma marcação concluída',
  booking_cancelled: 'Depois de uma marcação cancelada',
};

const emptyForm: FormState = {
  name: '',
  channel: 'email',
  subject: '',
  body: '',
};

function statusClass(status: string) {
  if (status === 'completed' || status === 'sent') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  if (status === 'scheduled') return 'border-sky-400/20 bg-sky-400/10 text-sky-300';
  if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
  return 'border-white/10 bg-white/[0.03] text-zinc-300';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function automationLabel(campaign: Campaign) {
  switch (campaign.trigger_type) {
    case 'interval':
      return `A cada ${campaign.interval_value ?? '?'} ${campaign.interval_unit === 'days' ? 'dias' : 'horas'}`;
    case 'event':
      return EVENT_LABELS[campaign.event_name ?? ''] ?? campaign.event_name ?? 'Ação automática';
    case 'birthday':
      if ((campaign.birthday_offset_days ?? 0) === 0) return 'No aniversário';
      return campaign.birthday_offset_days! < 0
        ? `${Math.abs(campaign.birthday_offset_days!)} dia(s) antes do aniversário`
        : `${campaign.birthday_offset_days} dia(s) depois do aniversário`;
    default:
      return 'Manual';
  }
}

export function MarketingWorkspace() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature('marketing_campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<string[]>(Object.keys(EVENT_LABELS));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [automationSaving, setAutomationSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [details, setDetails] = useState<Campaign | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [liveMessage, setLiveMessage] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [automation, setAutomation] = useState({
    mode: 'manual' as 'manual' | 'interval' | 'event' | 'birthday',
    intervalValue: '24',
    intervalUnit: 'hours' as 'hours' | 'days',
    eventName: 'booking_created',
    birthdayOffset: '0',
    birthdayRewardType: 'none' as 'none' | 'free_service',
    birthdayRewardServiceId: '',
  });

  const selectedCampaign = campaigns.find((item) => item.id === selectedId) ?? null;

  const loadCampaigns = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch('/api/marketing/campaigns', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar as campanhas.');
      const next = (data.campaigns ?? []) as Campaign[];
      setCampaigns(next);
      if (!selectedId && next[0]) setSelectedId(next[0].id);
      if (selectedId && !next.some((campaign) => campaign.id === selectedId)) setSelectedId(next[0]?.id ?? '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar campanhas.';
      setLiveMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [allowed, selectedId]);

  const loadAutomation = useCallback(async () => {
    if (!allowed) return;
    try {
      const response = await fetch('/api/marketing/campaigns/automation', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar as automações.');
      setCampaigns((current) => {
        const updates = new Map<string, Campaign>((data.campaigns ?? []).map((item: Campaign) => [item.id, item]));
        return current.map((campaign) => ({ ...campaign, ...(updates.get(campaign.id) ?? {}) }));
      });
      setServices((data.services ?? []) as Service[]);
      setEvents((data.events ?? Object.keys(EVENT_LABELS)) as string[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar as automações.';
      setLiveMessage(message);
      toast.error(message);
    }
  }, [allowed]);

  useEffect(() => {
    void loadCampaigns();
    void loadAutomation();
  }, [loadCampaigns, loadAutomation]);

  useEffect(() => {
    if (!selectedCampaign) return;
    setAutomation({
      mode: selectedCampaign.trigger_type ?? 'manual',
      intervalValue: String(selectedCampaign.interval_value ?? 24),
      intervalUnit: selectedCampaign.interval_unit ?? 'hours',
      eventName: selectedCampaign.event_name ?? 'booking_created',
      birthdayOffset: String(selectedCampaign.birthday_offset_days ?? 0),
      birthdayRewardType: selectedCampaign.birthday_reward_type ?? 'none',
      birthdayRewardServiceId: selectedCampaign.birthday_reward_service_id ?? '',
    });
  }, [selectedCampaign]);

  const filteredCampaigns = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('pt-PT');
    return campaigns.filter((campaign) => {
      const matchesQuery = !needle || `${campaign.name} ${campaign.subject ?? ''}`.toLocaleLowerCase('pt-PT').includes(needle);
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesChannel = channelFilter === 'all' || campaign.channel === channelFilter;
      return matchesQuery && matchesStatus && matchesChannel;
    });
  }, [campaigns, channelFilter, query, statusFilter]);

  const stats = useMemo(() => {
    const active = campaigns.filter((item) => item.active !== false && !['cancelled', 'completed'].includes(item.status)).length;
    const recipients = campaigns.reduce((sum, item) => sum + Number(item.total_recipients ?? 0), 0);
    const sent = campaigns.reduce((sum, item) => sum + Number(item.sent_count ?? 0), 0);
    const failed = campaigns.reduce((sum, item) => sum + Number(item.failed_count ?? 0), 0);
    return { active, recipients, sent, failed };
  }, [campaigns]);

  function openCreate() {
    setEditorMode('create');
    setForm(emptyForm);
    setEditorOpen(true);
    requestAnimationFrame(() => document.getElementById('marketing-campaign-name')?.focus());
  }

  function openEdit(campaign: Campaign) {
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      toast.error('Campanhas em execução ou concluídas já não podem ser editadas.');
      return;
    }
    setEditorMode('edit');
    setSelectedId(campaign.id);
    setForm({
      name: campaign.name,
      channel: campaign.channel,
      subject: campaign.subject ?? '',
      body: campaign.body,
    });
    setEditorOpen(true);
    requestAnimationFrame(() => document.getElementById('marketing-campaign-name')?.focus());
  }

  function closeEditor() {
    if (saving) return;
    setEditorOpen(false);
  }

  async function submitCampaign(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, id: editorMode === 'edit' ? selectedId : undefined };
      const response = await fetch('/api/marketing/campaigns', {
        method: editorMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível guardar a campanha.');
      if (editorMode === 'edit') {
        setCampaigns((current) => current.map((item) => item.id === data.campaign.id ? data.campaign : item));
        setDetails(data.campaign);
        setLiveMessage('Campanha atualizada com sucesso.');
        toast.success('Campanha atualizada.');
      } else {
        setCampaigns((current) => [data.campaign, ...current]);
        setSelectedId(data.campaign.id);
        setDetails(data.campaign);
        setLiveMessage('Campanha criada com sucesso.');
        toast.success('Campanha criada como rascunho.');
      }
      setEditorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a campanha.');
    } finally {
      setSaving(false);
    }
  }

  async function sendSelected() {
    if (!selectedCampaign) return;
    setSending(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${selectedCampaign.id}/send`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível iniciar o envio.');
      toast.success(`${data.queued ?? 0} destinatários colocados na fila.`);
      setLiveMessage('Envio iniciado.');
      await loadCampaigns();
      await loadAutomation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar o envio.');
    } finally {
      setSending(false);
    }
  }

  async function saveAutomation() {
    if (!selectedCampaign) return;
    setAutomationSaving(true);
    try {
      const response = await fetch('/api/marketing/campaigns/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCampaign.id,
          triggerType: automation.mode,
          intervalValue: Number(automation.intervalValue),
          intervalUnit: automation.intervalUnit,
          eventName: automation.eventName,
          birthdayOffsetDays: Number(automation.birthdayOffset),
          birthdayRewardType: automation.birthdayRewardType,
          birthdayRewardServiceId: automation.birthdayRewardServiceId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível guardar a automação.');
      setCampaigns((current) => current.map((item) => item.id === selectedCampaign.id ? { ...item, ...data.campaign } : item));
      setDetails((current) => current?.id === selectedCampaign.id ? { ...current, ...data.campaign } : current);
      toast.success('Automação atualizada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a automação.');
    } finally {
      setAutomationSaving(false);
    }
  }

  if (accessLoading) {
    return <main className="min-h-screen bg-background" aria-busy="true"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-8"><div className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]" /></div></main>;
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 sm:px-8" aria-labelledby="marketing-locked-title">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
              <Sparkles className="size-8 text-primary" aria-hidden="true" />
              <h1 id="marketing-locked-title" className="text-2xl font-semibold">Marketing avançado</h1>
              <p className="text-muted-foreground">Cria campanhas segmentadas de email e SMS, automatiza aniversários e acompanha o delivery.</p>
              <Button asChild><Link href="/dashboard/billing">Ver plano</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 sm:py-10" aria-labelledby="marketing-title">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="sr-only" aria-live="polite">{liveMessage}</div>

        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" /> Marketing · Pro</div>
            <h1 id="marketing-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Marketing</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Cria, edita, automatiza e acompanha campanhas sem sair do painel.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 size-4" aria-hidden="true" />Dashboard</Link></Button>
            <Button onClick={openCreate}><Plus className="mr-2 size-4" aria-hidden="true" />Nova campanha</Button>
          </div>
        </header>

        <section aria-label="Resumo de marketing" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Campanhas ativas', stats.active, Zap],
            ['Destinatários', stats.recipients, MessageSquare],
            ['Enviadas', stats.sent, CheckCircle2],
            ['Falhas', stats.failed, AlertTriangle],
          ].map(([label, value, Icon]) => (
            <Card key={String(label)} className="border-white/10 bg-white/[0.025]">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5" aria-labelledby="campaigns-heading">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 id="campaigns-heading" className="text-lg font-semibold">Campanhas</h2><p className="mt-1 text-sm text-muted-foreground">Pesquisa e filtra campanhas sem perder o contexto de cada envio.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="campaign-search">Pesquisar campanhas</label>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" /><Input id="campaign-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar campanhas…" className="pl-9 sm:w-64" /></div>
              <label className="sr-only" htmlFor="campaign-status-filter">Filtrar por estado</label>
              <select id="campaign-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos os estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <label className="sr-only" htmlFor="campaign-channel-filter">Filtrar por canal</label>
              <select id="campaign-channel-filter" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos os canais</option><option value="email">Email</option><option value="sms">SMS</option></select>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground" aria-live="polite">
            <span>{filteredCampaigns.length} campanha(s) visível(eis)</span>
            <Button variant="ghost" size="sm" onClick={() => { void loadCampaigns(); void loadAutomation(); }} disabled={loading}><RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Atualizar</Button>
          </div>

          {loading && campaigns.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground" aria-busy="true"><Loader2 className="mx-auto mb-3 size-5 animate-spin" aria-hidden="true" />A carregar campanhas…</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 p-10 text-center"><Sparkles className="mx-auto size-6 text-zinc-500" aria-hidden="true" /><h3 className="mt-3 font-medium">Ainda não há campanhas que correspondam ao filtro.</h3><p className="mt-1 text-sm text-muted-foreground">Cria uma nova campanha para começar.</p><Button className="mt-4" onClick={openCreate}><Plus className="mr-2 size-4" aria-hidden="true" />Criar campanha</Button></div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {filteredCampaigns.map((campaign) => (
                <article key={campaign.id} className={`rounded-2xl border p-4 transition ${selectedId === campaign.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-white/10 bg-white/[0.02]'}`} aria-label={`Campanha ${campaign.name}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{campaign.name}</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(campaign.status)}`}>{STATUS_LABELS[campaign.status] ?? campaign.status}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.subject || campaign.body}</p></div>
                    <div className="shrink-0" aria-label={campaign.channel === 'email' ? 'Email' : 'SMS'}>{campaign.channel === 'email' ? <Mail className="size-4 text-sky-300" aria-hidden="true" /> : <MessageSquare className="size-4 text-emerald-300" aria-hidden="true" />}</div>
                  </div>
                  <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <div><dt className="text-zinc-500">Automação</dt><dd className="mt-1 text-zinc-200">{automationLabel(campaign)}</dd></div>
                    <div><dt className="text-zinc-500">Enviadas</dt><dd className="mt-1 tabular-nums text-zinc-200">{campaign.sent_count ?? 0}</dd></div>
                    <div><dt className="text-zinc-500">Atualizada</dt><dd className="mt-1 text-zinc-200">{formatDate(campaign.updated_at ?? campaign.created_at)}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedId(campaign.id); setDetails(campaign); }} aria-label={`Ver detalhes de ${campaign.name}`}><Eye className="mr-2 size-4" aria-hidden="true" />Detalhes</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(campaign)} disabled={!['draft', 'scheduled'].includes(campaign.status)} aria-label={`Editar ${campaign.name}`}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar</Button>
                    <Button size="sm" onClick={() => { setSelectedId(campaign.id); void sendSelected(); }} disabled={sending || !['draft', 'scheduled'].includes(campaign.status)}><Send className="mr-2 size-4" aria-hidden="true" />Enviar</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedCampaign && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]" aria-label="Gestão da campanha selecionada">
            <Card className="border-white/10 bg-white/[0.02]">
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-lg">Automação</CardTitle><p className="mt-1 text-sm text-muted-foreground">Define quando esta campanha deve ser executada.</p></div><Zap className="size-5 text-primary" aria-hidden="true" /></div></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="automation-mode" className="text-sm font-medium">Gatilho</label><select id="automation-mode" value={automation.mode} onChange={(event) => setAutomation((current) => ({ ...current, mode: event.target.value as typeof current.mode }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="manual">Manual</option><option value="interval">A cada intervalo</option><option value="event">Depois de uma ação</option><option value="birthday">Aniversário do cliente</option></select></div>
                  {automation.mode === 'interval' && <div className="grid grid-cols-[1fr_1fr] gap-2"><div><label htmlFor="interval-value" className="text-sm font-medium">Intervalo</label><Input id="interval-value" type="number" min={1} max={3650} value={automation.intervalValue} onChange={(event) => setAutomation((current) => ({ ...current, intervalValue: event.target.value }))} className="mt-1.5" /></div><div><label htmlFor="interval-unit" className="text-sm font-medium">Unidade</label><select id="interval-unit" value={automation.intervalUnit} onChange={(event) => setAutomation((current) => ({ ...current, intervalUnit: event.target.value as typeof current.intervalUnit }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="hours">Horas</option><option value="days">Dias</option></select></div></div>}
                  {automation.mode === 'event' && <div><label htmlFor="event-name" className="text-sm font-medium">Ação</label><select id="event-name" value={automation.eventName} onChange={(event) => setAutomation((current) => ({ ...current, eventName: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{events.map((event) => <option key={event} value={event}>{EVENT_LABELS[event] ?? event}</option>)}</select></div>}
                  {automation.mode === 'birthday' && <div className="sm:col-span-2 grid gap-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 sm:grid-cols-3"><div><label htmlFor="birthday-offset" className="text-sm font-medium"><Cake className="mr-1 inline size-4 text-amber-300" aria-hidden="true" />Momento</label><select id="birthday-offset" value={automation.birthdayOffset} onChange={(event) => setAutomation((current) => ({ ...current, birthdayOffset: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="-1">1 dia antes</option><option value="0">No próprio dia</option><option value="1">1 dia depois</option></select></div><div><label htmlFor="birthday-reward" className="text-sm font-medium"><Gift className="mr-1 inline size-4 text-amber-300" aria-hidden="true" />Recompensa</label><select id="birthday-reward" value={automation.birthdayRewardType} onChange={(event) => setAutomation((current) => ({ ...current, birthdayRewardType: event.target.value as typeof current.birthdayRewardType }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="none">Mensagem apenas</option><option value="free_service">Serviço gratuito</option></select></div>{automation.birthdayRewardType === 'free_service' && <div><label htmlFor="birthday-service" className="text-sm font-medium">Serviço</label><select id="birthday-service" value={automation.birthdayRewardServiceId} onChange={(event) => setAutomation((current) => ({ ...current, birthdayRewardServiceId: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecionar serviço</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {Number(service.price).toFixed(2)} €</option>)}</select></div>}</div>}
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Próxima execução</p><p className="mt-1 text-xs text-muted-foreground">{selectedCampaign.next_run_at ? formatDate(selectedCampaign.next_run_at) : automation.mode === 'manual' ? 'Apenas quando iniciares manualmente.' : 'A calcular quando guardares a configuração.'}</p></div><Button onClick={() => void saveAutomation()} disabled={automationSaving}><Timer className="mr-2 size-4" aria-hidden="true" />{automationSaving ? 'A guardar…' : 'Guardar automação'}</Button></div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.02]">
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-lg">Campanha selecionada</CardTitle><p className="mt-1 text-sm text-muted-foreground">Contexto, delivery e conteúdo.</p></div><Button variant="ghost" size="icon" onClick={() => setSelectedId(selectedCampaign.id)} aria-label="Manter campanha selecionada"><Sparkles className="size-4" aria-hidden="true" /></Button></div></CardHeader>
              <CardContent className="space-y-5">
                <div><p className="text-xs text-zinc-500">Nome</p><p className="mt-1 font-semibold">{selectedCampaign.name}</p></div>
                <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-zinc-500">Canal</p><p className="mt-1">{selectedCampaign.channel === 'email' ? 'Email' : 'SMS'}</p></div><div><p className="text-xs text-zinc-500">Estado</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClass(selectedCampaign.status)}`}>{STATUS_LABELS[selectedCampaign.status] ?? selectedCampaign.status}</span></div></div>
                <div className="grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-center"><div><p className="text-xl font-semibold tabular-nums">{selectedCampaign.total_recipients ?? 0}</p><p className="text-[11px] text-zinc-500">destinatários</p></div><div><p className="text-xl font-semibold tabular-nums">{selectedCampaign.sent_count ?? 0}</p><p className="text-[11px] text-zinc-500">enviadas</p></div><div><p className="text-xl font-semibold tabular-nums">{selectedCampaign.failed_count ?? 0}</p><p className="text-[11px] text-zinc-500">falhas</p></div></div>
                <div><p className="text-xs text-zinc-500">Mensagem</p><div className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-6 whitespace-pre-wrap">{selectedCampaign.body}</div></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDetails(selectedCampaign)}><Eye className="mr-2 size-4" aria-hidden="true" />Ver detalhes</Button><Button variant="outline" onClick={() => openEdit(selectedCampaign)} disabled={!['draft', 'scheduled'].includes(selectedCampaign.status)}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar</Button><Button onClick={() => void sendSelected()} disabled={sending || !['draft', 'scheduled'].includes(selectedCampaign.status)}><Send className="mr-2 size-4" aria-hidden="true" />{sending ? 'A iniciar…' : 'Enviar agora'}</Button></div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {details && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetails(null); }}>
          <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="campaign-detail-title" aria-describedby="campaign-detail-description">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><h2 id="campaign-detail-title" className="text-xl font-semibold">Detalhes da campanha</h2><p id="campaign-detail-description" className="mt-1 text-sm text-muted-foreground">{details.name}</p></div><Button variant="ghost" size="icon" onClick={() => setDetails(null)} aria-label="Fechar detalhes"><X className="size-4" aria-hidden="true" /></Button></div>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-5"><div><p className="text-xs text-zinc-500">Estado</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClass(details.status)}`}>{STATUS_LABELS[details.status] ?? details.status}</span></div><div><p className="text-xs text-zinc-500">Canal</p><p className="mt-1">{details.channel === 'email' ? 'Email' : 'SMS'}</p></div><div><p className="text-xs text-zinc-500">Automação</p><p className="mt-1">{automationLabel(details)}</p></div><div><p className="text-xs text-zinc-500">Criada em</p><p className="mt-1">{formatDate(details.created_at)}</p></div><div><p className="text-xs text-zinc-500">Atualizada em</p><p className="mt-1">{formatDate(details.updated_at)}</p></div></div>
              <div className="space-y-5"><div><p className="text-xs text-zinc-500">Resumo de delivery</p><div className="mt-2 grid grid-cols-3 gap-2"><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold">{details.total_recipients ?? 0}</p><p className="text-[10px] text-zinc-500">destinatários</p></div><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold text-emerald-300">{details.sent_count ?? 0}</p><p className="text-[10px] text-zinc-500">enviadas</p></div><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold text-red-300">{details.failed_count ?? 0}</p><p className="text-[10px] text-zinc-500">falhas</p></div></div></div>{details.channel === 'email' && <div><p className="text-xs text-zinc-500">Assunto</p><p className="mt-1 rounded-xl border border-white/10 p-3">{details.subject || '—'}</p></div>}<div><p className="text-xs text-zinc-500">Mensagem completa</p><div className="mt-1 max-h-72 overflow-auto rounded-xl border border-white/10 p-4 text-sm leading-6 whitespace-pre-wrap">{details.body}</div></div></div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 p-5 sm:p-6"><Button variant="outline" onClick={() => setDetails(null)}>Fechar</Button><Button onClick={() => { setDetails(null); openEdit(details); }} disabled={!['draft', 'scheduled'].includes(details.status)}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar campanha</Button></div>
          </section>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" role="presentation">
          <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="campaign-editor-title">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><h2 id="campaign-editor-title" className="text-xl font-semibold">{editorMode === 'create' ? 'Nova campanha' : 'Editar campanha'}</h2><p className="mt-1 text-sm text-muted-foreground">Os campos abaixo são preparados para teclado, leitores de ecrã e navegação por foco.</p></div><Button variant="ghost" size="icon" onClick={closeEditor} disabled={saving} aria-label="Fechar editor"><X className="size-4" aria-hidden="true" /></Button></div>
            <form onSubmit={submitCampaign} className="grid lg:grid-cols-2">
              <div className="space-y-5 p-5 sm:p-6 lg:border-r lg:border-white/10">
                <div><label htmlFor="marketing-campaign-name" className="text-sm font-medium">Nome interno</label><Input id="marketing-campaign-name" value={form.name} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5" required /></div>
                <div><label htmlFor="marketing-campaign-channel" className="text-sm font-medium">Canal</label><select id="marketing-campaign-channel" value={form.channel} disabled={editorMode === 'edit'} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as FormState['channel'], subject: event.target.value === 'sms' ? '' : current.subject }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"><option value="email">Email</option><option value="sms">SMS</option></select>{editorMode === 'edit' && <p className="mt-1.5 text-xs text-muted-foreground">O canal não muda depois de criada a campanha.</p>}</div>
                {form.channel === 'email' && <div><div className="flex items-center justify-between gap-3"><label htmlFor="marketing-campaign-subject" className="text-sm font-medium">Assunto</label><span className="text-xs text-muted-foreground">{form.subject.length}/200</span></div><Input id="marketing-campaign-subject" value={form.subject} maxLength={200} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="mt-1.5" required /></div>}
                <div><div className="flex items-center justify-between gap-3"><label htmlFor="marketing-campaign-body" className="text-sm font-medium">Mensagem</label><span className={`text-xs ${form.body.length > 9000 ? 'text-amber-300' : 'text-muted-foreground'}`}>{form.body.length}/{MAX_BODY_LENGTH}</span></div><Textarea id="marketing-campaign-body" value={form.body} maxLength={MAX_BODY_LENGTH} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="mt-1.5 min-h-72" required /><p className="mt-1.5 text-xs text-muted-foreground">Podes usar tokens como <code>{'{{nome}}'}</code>, <code>{'{{barbearia}}'}</code> e <code>{'{{booking_url}}'}</code>.</p></div>
              </div>
              <div className="border-t border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:border-t-0">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Pré-visualização</p><p className="mt-1 text-xs text-muted-foreground">A apresentação aproximada da mensagem.</p></div>{form.channel === 'email' ? <Mail className="size-5 text-sky-300" aria-hidden="true" /> : <MessageSquare className="size-5 text-emerald-300" aria-hidden="true" />}</div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5"><p className="text-xs text-zinc-500">{form.channel === 'email' ? 'Email' : 'SMS'}</p>{form.channel === 'email' && <><h3 className="mt-3 font-semibold">{form.subject || 'Assunto da campanha'}</h3></>}<p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{form.body || 'A mensagem vai aparecer aqui enquanto escreves.'}</p></div>
                <div className="mt-5 rounded-2xl border border-white/10 p-4"><div className="flex items-start gap-3"><Eye className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-sm font-medium">Antes de enviar</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Confirma o assunto, a mensagem e os tokens. O conteúdo é editável enquanto a campanha estiver em rascunho ou agendada.</p></div></div></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 p-5 sm:p-6 lg:col-span-2"><Button type="button" variant="outline" onClick={closeEditor} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />}{saving ? 'A guardar…' : editorMode === 'create' ? 'Criar campanha' : 'Guardar alterações'}</Button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
