'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Cake,
  CheckCircle2,
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
import type { LucideIcon } from 'lucide-react';
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

type Service = { id: string; name: string; price: number; duration: number | null };
type FormState = { name: string; channel: 'email' | 'sms'; subject: string; body: string };
type AutomationState = {
  mode: 'manual' | 'interval' | 'event' | 'birthday';
  intervalValue: string;
  intervalUnit: 'hours' | 'days';
  eventName: string;
  birthdayOffset: string;
  birthdayRewardType: 'none' | 'free_service';
  birthdayRewardServiceId: string;
};
type Metric = { label: string; value: number; Icon: LucideIcon };

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
  booking_created: 'Marcação criada',
  booking_completed: 'Marcação concluída',
  booking_cancelled: 'Marcação cancelada',
};

const EMPTY_FORM: FormState = { name: '', channel: 'email', subject: '', body: '' };
const EMPTY_AUTOMATION: AutomationState = {
  mode: 'manual',
  intervalValue: '24',
  intervalUnit: 'hours',
  eventName: 'booking_created',
  birthdayOffset: '0',
  birthdayRewardType: 'none',
  birthdayRewardServiceId: '',
};

function badgeClass(status: string) {
  if (status === 'completed' || status === 'sent') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  if (status === 'scheduled') return 'border-sky-400/20 bg-sky-400/10 text-sky-300';
  if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
  return 'border-white/10 bg-white/[0.03] text-zinc-300';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function automationLabel(campaign: Campaign) {
  if (campaign.trigger_type === 'interval') {
    return `A cada ${campaign.interval_value ?? '?'} ${campaign.interval_unit === 'days' ? 'dias' : 'horas'}`;
  }
  if (campaign.trigger_type === 'event') {
    return EVENT_LABELS[campaign.event_name ?? ''] ?? campaign.event_name ?? 'Ação automática';
  }
  if (campaign.trigger_type === 'birthday') {
    const offset = campaign.birthday_offset_days ?? 0;
    return offset === 0
      ? 'No aniversário'
      : offset < 0
        ? `${Math.abs(offset)} dia(s) antes do aniversário`
        : `${offset} dia(s) depois do aniversário`;
  }
  return 'Manual';
}

export function MarketingWorkspace() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature('marketing_campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<string[]>(Object.keys(EVENT_LABELS));
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [automationSaving, setAutomationSaving] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [details, setDetails] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [automation, setAutomation] = useState<AutomationState>(EMPTY_AUTOMATION);
  const [liveMessage, setLiveMessage] = useState('');

  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? null;

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const [campaignResponse, automationResponse] = await Promise.all([
        fetch('/api/marketing/campaigns', { cache: 'no-store' }),
        fetch('/api/marketing/campaigns/automation', { cache: 'no-store' }),
      ]);
      const campaignData = await campaignResponse.json();
      const automationData = await automationResponse.json();
      if (!campaignResponse.ok) throw new Error(campaignData.error ?? 'Não foi possível carregar as campanhas.');
      if (!automationResponse.ok) throw new Error(automationData.error ?? 'Não foi possível carregar as automações.');

      const base = (campaignData.campaigns ?? []) as Campaign[];
      const automationCampaigns = (automationData.campaigns ?? []) as Campaign[];
      const merged = base.map((campaign) => ({
        ...campaign,
        ...(automationCampaigns.find((item) => item.id === campaign.id) ?? {}),
      }));

      setCampaigns(merged);
      setServices((automationData.services ?? []) as Service[]);
      setEvents((automationData.events ?? Object.keys(EVENT_LABELS)) as string[]);
      if (selectedId && !merged.some((campaign) => campaign.id === selectedId)) setSelectedId(merged[0]?.id ?? '');
      if (!selectedId && merged[0]) setSelectedId(merged[0].id);
      setLiveMessage('Marketing atualizado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar o marketing.';
      setLiveMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [allowed, selectedId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    setAutomation({
      mode: selected.trigger_type ?? 'manual',
      intervalValue: String(selected.interval_value ?? 24),
      intervalUnit: selected.interval_unit ?? 'hours',
      eventName: selected.event_name ?? 'booking_created',
      birthdayOffset: String(selected.birthday_offset_days ?? 0),
      birthdayRewardType: selected.birthday_reward_type ?? 'none',
      birthdayRewardServiceId: selected.birthday_reward_service_id ?? '',
    });
  }, [selected]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('pt-PT');
    return campaigns.filter((campaign) => {
      const matchesQuery = !needle || `${campaign.name} ${campaign.subject ?? ''}`.toLocaleLowerCase('pt-PT').includes(needle);
      return matchesQuery && (statusFilter === 'all' || campaign.status === statusFilter) && (channelFilter === 'all' || campaign.channel === channelFilter);
    });
  }, [campaigns, channelFilter, query, statusFilter]);

  const metrics: Metric[] = useMemo(() => [
    { label: 'Campanhas ativas', value: campaigns.filter((campaign) => campaign.active !== false && !['completed', 'cancelled'].includes(campaign.status)).length, Icon: Zap },
    { label: 'Destinatários', value: campaigns.reduce((sum, campaign) => sum + Number(campaign.total_recipients ?? 0), 0), Icon: MessageSquare },
    { label: 'Enviadas', value: campaigns.reduce((sum, campaign) => sum + Number(campaign.sent_count ?? 0), 0), Icon: CheckCircle2 },
    { label: 'Falhas', value: campaigns.reduce((sum, campaign) => sum + Number(campaign.failed_count ?? 0), 0), Icon: AlertTriangle },
  ], [campaigns]);

  function openCreate() {
    setEditorMode('create');
    setForm(EMPTY_FORM);
    setEditorOpen(true);
    requestAnimationFrame(() => document.getElementById('marketing-campaign-name')?.focus());
  }

  function openEdit(campaign: Campaign) {
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      toast.error('Esta campanha já não pode ser editada.');
      return;
    }
    setSelectedId(campaign.id);
    setEditorMode('edit');
    setForm({ name: campaign.name, channel: campaign.channel, subject: campaign.subject ?? '', body: campaign.body });
    setEditorOpen(true);
    requestAnimationFrame(() => document.getElementById('marketing-campaign-name')?.focus());
  }

  async function saveCampaign(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/marketing/campaigns', {
        method: editorMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editorMode === 'edit' ? selectedId : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível guardar a campanha.');
      setCampaigns((current) => editorMode === 'edit'
        ? current.map((item) => item.id === data.campaign.id ? { ...item, ...data.campaign } : item)
        : [data.campaign, ...current]);
      setSelectedId(data.campaign.id);
      setDetails(data.campaign);
      setEditorOpen(false);
      toast.success(editorMode === 'edit' ? 'Campanha atualizada.' : 'Campanha criada como rascunho.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a campanha.');
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign(campaignId: string) {
    setSendingId(campaignId);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}/send`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível iniciar o envio.');
      toast.success(`${data.queued ?? 0} destinatários colocados na fila.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar o envio.');
    } finally {
      setSendingId('');
    }
  }

  async function saveAutomation() {
    if (!selected) return;
    setAutomationSaving(true);
    try {
      const response = await fetch('/api/marketing/campaigns/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
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
      setCampaigns((current) => current.map((item) => item.id === selected.id ? { ...item, ...data.campaign } : item));
      toast.success('Automação atualizada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar a automação.');
    } finally {
      setAutomationSaving(false);
    }
  }

  if (accessLoading) return <main className="min-h-screen bg-background" aria-busy="true" />;
  if (!allowed) {
    return <main className="min-h-screen bg-background px-4 py-20 sm:px-8"><Card className="mx-auto max-w-xl"><CardContent className="flex flex-col items-center gap-4 py-16 text-center"><Sparkles className="size-8 text-primary" aria-hidden="true" /><h1 className="text-2xl font-semibold">Marketing avançado</h1><p className="text-muted-foreground">Campanhas de email e SMS, automações e delivery num só lugar.</p><Button asChild><Link href="/dashboard/billing">Ver plano</Link></Button></CardContent></Card></main>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 sm:py-10" aria-labelledby="marketing-title">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="sr-only" aria-live="polite">{liveMessage}</div>
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" /> Marketing · Pro</div><h1 id="marketing-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Marketing</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Cria, edita, automatiza e acompanha campanhas sem sair do painel.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 size-4" aria-hidden="true" />Dashboard</Link></Button><Button onClick={openCreate}><Plus className="mr-2 size-4" aria-hidden="true" />Nova campanha</Button></div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo de marketing">
          {metrics.map(({ label, value, Icon }) => <Card key={label} className="border-white/10 bg-white/[0.02]"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div><Icon className="size-5 text-primary" aria-hidden="true" /></CardContent></Card>)}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5" aria-labelledby="campaigns-heading">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><h2 id="campaigns-heading" className="text-lg font-semibold">Campanhas</h2><p className="mt-1 text-sm text-muted-foreground">Pesquisa, detalhes, edição e envio.</p></div><div className="flex flex-col gap-2 md:flex-row"><label className="sr-only" htmlFor="campaign-search">Pesquisar</label><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" /><Input id="campaign-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar campanhas…" className="pl-9 md:w-64" /></div><label className="sr-only" htmlFor="campaign-status">Estado</label><select id="campaign-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos os estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="sr-only" htmlFor="campaign-channel">Canal</label><select id="campaign-channel" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todos os canais</option><option value="email">Email</option><option value="sms">SMS</option></select><Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Atualizar</Button></div></div>
          <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">{filtered.length} campanha(s) visível(eis)</p>
          {loading && campaigns.length === 0 ? <div className="mt-4 rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground" aria-busy="true"><Loader2 className="mx-auto mb-3 size-5 animate-spin" aria-hidden="true" />A carregar…</div> : filtered.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-white/10 p-10 text-center"><Sparkles className="mx-auto size-6 text-zinc-500" aria-hidden="true" /><h3 className="mt-3 font-medium">Sem campanhas</h3><p className="mt-1 text-sm text-muted-foreground">Cria uma campanha para começar.</p><Button className="mt-4" onClick={openCreate}><Plus className="mr-2 size-4" aria-hidden="true" />Criar campanha</Button></div> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{filtered.map((campaign) => <article key={campaign.id} className={`rounded-2xl border p-4 ${selectedId === campaign.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{campaign.name}</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass(campaign.status)}`}>{STATUS_LABELS[campaign.status] ?? campaign.status}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.subject || campaign.body}</p></div>{campaign.channel === 'email' ? <Mail className="size-4 text-sky-300" aria-label="Email" /> : <MessageSquare className="size-4 text-emerald-300" aria-label="SMS" />}</div><div className="mt-4 grid gap-3 text-xs sm:grid-cols-3"><div><p className="text-zinc-500">Automação</p><p className="mt-1 text-zinc-200">{automationLabel(campaign)}</p></div><div><p className="text-zinc-500">Enviadas</p><p className="mt-1 text-zinc-200">{campaign.sent_count ?? 0}</p></div><div><p className="text-zinc-500">Atualizada</p><p className="mt-1 text-zinc-200">{formatDate(campaign.updated_at ?? campaign.created_at)}</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4"><Button size="sm" variant="outline" onClick={() => { setSelectedId(campaign.id); setDetails(campaign); }}><Eye className="mr-2 size-4" aria-hidden="true" />Detalhes</Button><Button size="sm" variant="outline" onClick={() => openEdit(campaign)} disabled={!['draft', 'scheduled'].includes(campaign.status)}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar</Button><Button size="sm" onClick={() => void sendCampaign(campaign.id)} disabled={sendingId === campaign.id || !['draft', 'scheduled'].includes(campaign.status)}>{sendingId === campaign.id ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 size-4" aria-hidden="true" />}{sendingId === campaign.id ? 'A iniciar…' : 'Enviar'}</Button></div></article>)}</div>}
        </section>

        {selected && <section className="grid gap-6 xl:grid-cols-2" aria-label="Campanha selecionada"><Card className="border-white/10 bg-white/[0.02]"><CardHeader><CardTitle className="text-lg">Automação</CardTitle><p className="text-sm text-muted-foreground">Define quando o motor deve executar esta campanha.</p></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="automation-mode" className="text-sm font-medium">Gatilho</label><select id="automation-mode" value={automation.mode} onChange={(event) => setAutomation((current) => ({ ...current, mode: event.target.value as AutomationState['mode'] }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="manual">Manual</option><option value="interval">A cada intervalo</option><option value="event">Depois de uma ação</option><option value="birthday">Aniversário</option></select></div>{automation.mode === 'interval' && <div className="grid grid-cols-2 gap-2"><div><label htmlFor="interval-value" className="text-sm font-medium">Valor</label><Input id="interval-value" type="number" min={1} max={3650} value={automation.intervalValue} onChange={(event) => setAutomation((current) => ({ ...current, intervalValue: event.target.value }))} className="mt-1.5" /></div><div><label htmlFor="interval-unit" className="text-sm font-medium">Unidade</label><select id="interval-unit" value={automation.intervalUnit} onChange={(event) => setAutomation((current) => ({ ...current, intervalUnit: event.target.value as AutomationState['intervalUnit'] }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="hours">Horas</option><option value="days">Dias</option></select></div></div>}{automation.mode === 'event' && <div><label htmlFor="event-name" className="text-sm font-medium">Ação</label><select id="event-name" value={automation.eventName} onChange={(event) => setAutomation((current) => ({ ...current, eventName: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{events.map((event) => <option key={event} value={event}>{EVENT_LABELS[event] ?? event}</option>)}</select></div>}</div>{automation.mode === 'birthday' && <div className="grid gap-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 sm:grid-cols-3"><div><label htmlFor="birthday-offset" className="text-sm font-medium"><Cake className="mr-1 inline size-4 text-amber-300" aria-hidden="true" />Momento</label><select id="birthday-offset" value={automation.birthdayOffset} onChange={(event) => setAutomation((current) => ({ ...current, birthdayOffset: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="-1">1 dia antes</option><option value="0">No próprio dia</option><option value="1">1 dia depois</option></select></div><div><label htmlFor="birthday-reward" className="text-sm font-medium"><Gift className="mr-1 inline size-4 text-amber-300" aria-hidden="true" />Recompensa</label><select id="birthday-reward" value={automation.birthdayRewardType} onChange={(event) => setAutomation((current) => ({ ...current, birthdayRewardType: event.target.value as AutomationState['birthdayRewardType'] }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="none">Mensagem apenas</option><option value="free_service">Serviço gratuito</option></select></div>{automation.birthdayRewardType === 'free_service' && <div><label htmlFor="birthday-service" className="text-sm font-medium">Serviço</label><select id="birthday-service" value={automation.birthdayRewardServiceId} onChange={(event) => setAutomation((current) => ({ ...current, birthdayRewardServiceId: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecionar serviço</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {Number(service.price).toFixed(2)} €</option>)}</select></div>}</div>}<div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Próxima execução</p><p className="mt-1 text-xs text-muted-foreground">{selected.next_run_at ? formatDate(selected.next_run_at) : automation.mode === 'manual' ? 'Manual' : 'Calculada ao guardar'}</p></div><Button onClick={() => void saveAutomation()} disabled={automationSaving}><Timer className="mr-2 size-4" aria-hidden="true" />{automationSaving ? 'A guardar…' : 'Guardar automação'}</Button></div></CardContent></Card><Card className="border-white/10 bg-white/[0.02]"><CardHeader><CardTitle className="text-lg">Visão geral</CardTitle><p className="text-sm text-muted-foreground">Resumo da campanha selecionada.</p></CardHeader><CardContent className="space-y-5"><div><p className="text-xs text-zinc-500">Campanha</p><p className="mt-1 font-semibold">{selected.name}</p></div><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-zinc-500">Estado</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeClass(selected.status)}`}>{STATUS_LABELS[selected.status] ?? selected.status}</span></div><div><p className="text-xs text-zinc-500">Canal</p><p className="mt-1">{selected.channel === 'email' ? 'Email' : 'SMS'}</p></div></div><div className="grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-center"><div><p className="text-lg font-semibold">{selected.total_recipients ?? 0}</p><p className="text-[11px] text-zinc-500">destinatários</p></div><div><p className="text-lg font-semibold text-emerald-300">{selected.sent_count ?? 0}</p><p className="text-[11px] text-zinc-500">enviadas</p></div><div><p className="text-lg font-semibold text-red-300">{selected.failed_count ?? 0}</p><p className="text-[11px] text-zinc-500">falhas</p></div></div><div><p className="text-xs text-zinc-500">Mensagem</p><div className="mt-2 max-h-52 overflow-auto rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-6 whitespace-pre-wrap">{selected.body}</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDetails(selected)}><Eye className="mr-2 size-4" aria-hidden="true" />Ver detalhes</Button><Button variant="outline" onClick={() => openEdit(selected)} disabled={!['draft', 'scheduled'].includes(selected.status)}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar</Button><Button onClick={() => void sendCampaign(selected.id)} disabled={sendingId === selected.id || !['draft', 'scheduled'].includes(selected.status)}><Send className="mr-2 size-4" aria-hidden="true" />Enviar agora</Button></div></CardContent></Card></section>}
      </div>

      {details && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"><section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="campaign-details-title"><div className="flex items-start justify-between gap-4 border-b border-white/10 p-5"><div><h2 id="campaign-details-title" className="text-xl font-semibold">Detalhes da campanha</h2><p className="mt-1 text-sm text-muted-foreground">{details.name}</p></div><Button variant="ghost" size="icon" onClick={() => setDetails(null)} aria-label="Fechar detalhes"><X className="size-4" aria-hidden="true" /></Button></div><div className="grid gap-6 p-5 sm:grid-cols-2"><div className="space-y-4"><div><p className="text-xs text-zinc-500">Estado</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeClass(details.status)}`}>{STATUS_LABELS[details.status] ?? details.status}</span></div><div><p className="text-xs text-zinc-500">Automação</p><p className="mt-1">{automationLabel(details)}</p></div><div><p className="text-xs text-zinc-500">Criada</p><p className="mt-1">{formatDate(details.created_at)}</p></div><div><p className="text-xs text-zinc-500">Atualizada</p><p className="mt-1">{formatDate(details.updated_at)}</p></div></div><div className="space-y-4"><div className="grid grid-cols-3 gap-2"><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold">{details.total_recipients ?? 0}</p><p className="text-[10px] text-zinc-500">destinatários</p></div><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold text-emerald-300">{details.sent_count ?? 0}</p><p className="text-[10px] text-zinc-500">enviadas</p></div><div className="rounded-xl border border-white/10 p-3 text-center"><p className="text-lg font-semibold text-red-300">{details.failed_count ?? 0}</p><p className="text-[10px] text-zinc-500">falhas</p></div></div>{details.channel === 'email' && <div><p className="text-xs text-zinc-500">Assunto</p><p className="mt-1 rounded-xl border border-white/10 p-3">{details.subject || '—'}</p></div>}<div><p className="text-xs text-zinc-500">Mensagem</p><div className="mt-1 max-h-72 overflow-auto rounded-xl border border-white/10 p-4 text-sm leading-6 whitespace-pre-wrap">{details.body}</div></div></div></div><div className="flex justify-end gap-2 border-t border-white/10 p-5"><Button variant="outline" onClick={() => setDetails(null)}>Fechar</Button><Button onClick={() => { setDetails(null); openEdit(details); }} disabled={!['draft', 'scheduled'].includes(details.status)}><Pencil className="mr-2 size-4" aria-hidden="true" />Editar campanha</Button></div></section></div>}

      {editorOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"><section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="campaign-editor-title"><div className="flex items-start justify-between gap-4 border-b border-white/10 p-5"><div><h2 id="campaign-editor-title" className="text-xl font-semibold">{editorMode === 'create' ? 'Nova campanha' : 'Editar campanha'}</h2><p className="mt-1 text-sm text-muted-foreground">Campos e controlos acessíveis por teclado e leitor de ecrã.</p></div><Button variant="ghost" size="icon" onClick={() => setEditorOpen(false)} disabled={saving} aria-label="Fechar editor"><X className="size-4" aria-hidden="true" /></Button></div><form onSubmit={saveCampaign} className="grid lg:grid-cols-2"><div className="space-y-5 p-5 lg:border-r lg:border-white/10 sm:p-6"><div><label htmlFor="marketing-campaign-name" className="text-sm font-medium">Nome interno</label><Input id="marketing-campaign-name" value={form.name} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5" required /></div><div><label htmlFor="marketing-campaign-channel" className="text-sm font-medium">Canal</label><select id="marketing-campaign-channel" disabled={editorMode === 'edit'} value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as FormState['channel'], subject: event.target.value === 'sms' ? '' : current.subject }))} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"><option value="email">Email</option><option value="sms">SMS</option></select></div>{form.channel === 'email' && <div><label htmlFor="marketing-campaign-subject" className="text-sm font-medium">Assunto</label><Input id="marketing-campaign-subject" value={form.subject} maxLength={200} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="mt-1.5" required /></div>}<div><div className="flex items-center justify-between gap-3"><label htmlFor="marketing-campaign-body" className="text-sm font-medium">Mensagem</label><span className="text-xs text-muted-foreground">{form.body.length}/{MAX_BODY_LENGTH}</span></div><Textarea id="marketing-campaign-body" value={form.body} maxLength={MAX_BODY_LENGTH} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="mt-1.5 min-h-72" required /><p className="mt-1.5 text-xs text-muted-foreground">Tokens suportados: <code>{'{{nome}}'}</code>, <code>{'{{barbearia}}'}</code>, <code>{'{{booking_url}}'}</code>.</p></div></div><div className="border-t border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:border-t-0"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Pré-visualização</p><p className="mt-1 text-xs text-muted-foreground">Prévia aproximada da mensagem.</p></div>{form.channel === 'email' ? <Mail className="size-5 text-sky-300" aria-hidden="true" /> : <MessageSquare className="size-5 text-emerald-300" aria-hidden="true" />}</div><div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">{form.channel === 'email' && <h3 className="font-semibold">{form.subject || 'Assunto da campanha'}</h3>}<p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{form.body || 'A mensagem vai aparecer aqui enquanto escreves.'}</p></div></div><div className="flex justify-end gap-2 border-t border-white/10 p-5 lg:col-span-2"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />}{saving ? 'A guardar…' : editorMode === 'create' ? 'Criar campanha' : 'Guardar alterações'}</Button></div></form></section></div>}
    </main>
  );
}
