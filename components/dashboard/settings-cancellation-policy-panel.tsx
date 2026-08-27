'use client';

import { useEffect, useState } from 'react';
import { CalendarX2, Check, Clock3, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useBarbershop } from '@/context/BarbershopContext';
import { barbershopService } from '@/app/dashboard/_services/barbershop.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const PRESETS = [0, 2, 6, 12, 24, 48, 72] as const;

function formatHours(hours: number) {
  if (hours === 0) return 'Sem prazo mínimo';
  if (hours === 1) return '1 hora';
  return `${hours} horas`;
}

export function SettingsCancellationPolicyPanel() {
  const { barbershopId } = useBarbershop();
  const [hours, setHours] = useState(24);
  const [initialHours, setInitialHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershopId) return;
    let active = true;
    void barbershopService.getConfig(barbershopId).then((result) => {
      if (!active) return;
      if (result.error) {
        toast.error(result.error.message || 'Não foi possível carregar a regra de cancelamento.');
      } else {
        const next = Math.max(0, Math.min(720, Number(result.data?.time_limit_cancellation_hours ?? 24)));
        setHours(next);
        setInitialHours(next);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [barbershopId]);

  const dirty = hours !== initialHours;
  const invalid = !Number.isInteger(hours) || hours < 0 || hours > 720;

  async function save() {
    if (!barbershopId || !dirty || invalid) return;
    setSaving(true);
    const result = await barbershopService.updateConfig(barbershopId, {
      time_limit_cancellation_hours: hours,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message || 'Não foi possível guardar a regra de cancelamento.');
      return;
    }
    const next = Math.max(0, Math.min(720, Number(result.data?.time_limit_cancellation_hours ?? hours)));
    setHours(next);
    setInitialHours(next);
    toast.success('Regra de cancelamento atualizada.');
  }

  if (loading) {
    return (
      <Card className="mt-6 border-white/10 bg-black/30">
        <CardContent className="flex min-h-36 items-center justify-center">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-white/10 bg-white/[0.02] backdrop-blur-md" aria-labelledby="cancellation-policy-title">
      <CardHeader>
        <CardTitle id="cancellation-policy-title" className="flex items-center gap-2">
          <CalendarX2 className="size-4 text-amber-300" aria-hidden="true" />
          Regra de cancelamento
        </CardTitle>
        <CardDescription>
          Define com quantas horas de antecedência o cliente pode cancelar ou reagendar uma marcação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <label htmlFor="settings-cancellation-hours" className="text-sm font-medium">
              Horas antes da marcação
            </label>
            <Input
              id="settings-cancellation-hours"
              type="number"
              min={0}
              max={720}
              step={1}
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="min-h-12 rounded-xl border-white/10 bg-white/[0.04] text-lg"
              aria-invalid={invalid}
            />
            {invalid ? (
              <p className="text-xs text-red-300">Usa um número inteiro entre 0 e 720 horas.</p>
            ) : (
              <p className="text-xs leading-5 text-zinc-600">0 permite cancelar até à hora marcada.</p>
            )}
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] px-5 py-4 sm:min-w-48">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              <Clock3 className="size-3.5" aria-hidden="true" /> Regra atual
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{formatHours(hours)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Atalhos</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const active = hours === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHours(preset)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${active ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'}`}
                >
                  {active && <Check className="size-3.5" aria-hidden="true" />}
                  {formatHours(preset)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Validação server-side</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">A regra também é validada no servidor quando o cliente tenta cancelar ou reagendar.</p>
          </div>
          <Button type="button" onClick={() => void save()} disabled={!dirty || saving || invalid} className="min-h-11 rounded-xl sm:min-w-44">
            {saving ? <Spinner className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}
            {saving ? 'A guardar…' : 'Guardar regra'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
