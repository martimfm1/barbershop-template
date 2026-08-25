'use client';

import { useEffect, useState } from 'react';
import { Cake, Clock3, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const EVENT_LABELS: Record<string, string> = {
  booking_created: 'Depois de uma marcação criada',
  booking_completed: 'Depois de uma marcação concluída',
  booking_cancelled: 'Depois de uma marcação cancelada',
};

type Campaign = {
  id: string;
  name: string;
  channel: 'email' | 'sms';
  trigger_type: 'manual' | 'interval' | 'event' | 'birthday';
  interval_value: number | null;
  interval_unit: 'hours' | 'days' | null;
  event_name: string | null;
  birthday_offset_days: number | null;
  next_run_at: string | null;
  active: boolean;
  status: string;
};

const MODE_LABELS = {
  manual: 'Manual',
  interval: 'A cada intervalo',
  event: 'Depois de uma ação',
  birthday: 'No aniversário do cliente',
} as const;

export function CampaignControls() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState<Campaign['trigger_type']>('manual');
  const [intervalValue, setIntervalValue] = useState('24');
  const [intervalUnit, setIntervalUnit] = useState<'hours' | 'days'>('hours');
  const [eventName, setEventName] = useState('booking_created');
  const [birthdayOffset, setBirthdayOffset] = useState('0');
  const [events, setEvents] = useState<string[]>(Object.keys(EVENT_LABELS));
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch('/api/marketing/campaigns/automation', {
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? 'Não foi possível carregar as campanhas.');
    setCampaigns(data.campaigns ?? []);
    setEvents(data.events ?? Object.keys(EVENT_LABELS));
    const first = data.campaigns?.[0] as Campaign | undefined;
    if (first && !selected) {
      setSelected(first.id);
      setMode(first.trigger_type ?? 'manual');
      setIntervalValue(String(first.interval_value ?? 24));
      setIntervalUnit(first.interval_unit ?? 'hours');
      setEventName(first.event_name ?? 'booking_created');
      setBirthdayOffset(String(first.birthday_offset_days ?? 0));
    }
  }

  useEffect(() => {
    load().catch((error) =>
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar campanhas.',
      ),
    );
  }, []);

  useEffect(() => {
    const campaign = campaigns.find((item) => item.id === selected);
    if (!campaign) return;
    setMode(campaign.trigger_type);
    setIntervalValue(String(campaign.interval_value ?? 24));
    setIntervalUnit(campaign.interval_unit ?? 'hours');
    setEventName(campaign.event_name ?? 'booking_created');
    setBirthdayOffset(String(campaign.birthday_offset_days ?? 0));
  }, [selected, campaigns]);

  async function sendAll() {
    if (!selected) return toast.error('Seleciona uma campanha.');
    setBusy(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${selected}/send`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? 'Não foi possível iniciar o envio.');
      toast.success(`${data.queued ?? 0} destinatários colocados na fila.`);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao iniciar o envio.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveAutomation() {
    if (!selected) return toast.error('Seleciona uma campanha.');
    setBusy(true);
    try {
      const response = await fetch('/api/marketing/campaigns/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected,
          triggerType: mode,
          intervalValue: Number(intervalValue),
          intervalUnit,
          eventName,
          birthdayOffsetDays: Number(birthdayOffset),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? 'Não foi possível guardar a automação.');
      toast.success(
        mode === 'manual'
          ? 'Envio manual configurado.'
          : 'Automação da campanha guardada.',
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao guardar automação.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 shadow-xl backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="size-4 text-primary" />
            Delivery das campanhas
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            A campanha é o centro da comunicação. Escolhe quando é que ela deve disparar.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="h-10 min-w-64 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
          >
            <option value="">Selecionar campanha</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} · {campaign.channel.toUpperCase()}
              </option>
            ))}
          </select>
          <Button onClick={sendAll} disabled={busy || !selected}>
            <Send className="mr-2 size-4" />
            Enviar para todos
          </Button>
        </div>
      </div>

      {selected && (
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
          <div>
            <label className="text-xs font-medium text-zinc-300">Quando enviar</label>
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as Campaign['trigger_type'])
              }
              className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
            >
              {Object.entries(MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {mode === 'interval' ? (
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div>
                <label className="text-xs font-medium text-zinc-300">Intervalo</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={intervalValue}
                  onChange={(event) => setIntervalValue(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300">Unidade</label>
                <select
                  value={intervalUnit}
                  onChange={(event) =>
                    setIntervalUnit(event.target.value as typeof intervalUnit)
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
                >
                  <option value="hours">Horas</option>
                  <option value="days">Dias</option>
                </select>
              </div>
            </div>
          ) : mode === 'event' ? (
            <div>
              <label className="text-xs font-medium text-zinc-300">Ação</label>
              <select
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
              >
                {events.map((event) => (
                  <option key={event} value={event}>
                    {EVENT_LABELS[event] ?? event}
                  </option>
                ))}
              </select>
            </div>
          ) : mode === 'birthday' ? (
            <div className="grid grid-cols-[auto_1fr] items-end gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-2">
              <div className="flex size-10 items-center justify-center rounded-lg border border-amber-400/15 bg-amber-400/10 text-amber-300">
                <Cake className="size-4" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300">
                  Momento do envio
                </label>
                <select
                  value={birthdayOffset}
                  onChange={(event) => setBirthdayOffset(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm"
                >
                  <option value="-1">1 dia antes</option>
                  <option value="0">No próprio dia</option>
                  <option value="1">1 dia depois</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex min-h-10 items-center rounded-md border border-white/10 bg-black/10 px-3 text-xs text-zinc-500">
              Sem envio automático. Usa o botão acima quando quiseres.
            </div>
          )}

          <Button variant="outline" onClick={saveAutomation} disabled={busy}>
            <Clock3 className="mr-2 size-4" />
            Guardar automação
          </Button>
        </div>
      )}
    </section>
  );
}
