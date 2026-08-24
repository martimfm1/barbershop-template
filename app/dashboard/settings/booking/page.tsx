"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck2, Check, Clock3, Save } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/context/BarbershopContext";
import { barbershopService } from "@/app/dashboard/_services/barbershop.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const PRESETS = [0, 2, 6, 12, 24, 48, 72] as const;

function formatHours(hours: number): string {
  if (hours === 0) return "Sem prazo mínimo";
  if (hours === 1) return "1 hora";
  return `${hours} horas`;
}

export default function BookingSettingsPage() {
  const { barbershopId } = useBarbershop();
  const [hours, setHours] = useState(24);
  const [initialHours, setInitialHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershopId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const result = await barbershopService.getConfig(barbershopId);
      if (cancelled) return;
      if (result.error) {
        toast.error(result.error.message || "Não foi possível carregar as regras de marcações.");
      } else {
        const next = Math.max(0, Math.min(720, Number(result.data?.time_limit_cancellation_hours ?? 24)));
        setHours(next);
        setInitialHours(next);
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [barbershopId]);

  const dirty = hours !== initialHours;
  const hoursError = !Number.isInteger(hours) || hours < 0 || hours > 720;
  const example = useMemo(() => {
    if (hours === 0) return "O cliente pode cancelar até à hora da marcação.";
    return `O cliente deixa de poder cancelar ${formatHours(hours)} antes da hora marcada.`;
  }, [hours]);

  async function save() {
    if (!barbershopId || !dirty || hoursError) return;
    setSaving(true);
    const result = await barbershopService.updateConfig(barbershopId, {
      time_limit_cancellation_hours: hours,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message || "Não foi possível guardar a regra de cancelamento.");
      return;
    }
    const next = Math.max(0, Math.min(720, Number(result.data?.time_limit_cancellation_hours ?? hours)));
    setHours(next);
    setInitialHours(next);
    toast.success("Regra de cancelamento atualizada.");
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950">
        <Spinner className="size-7 text-zinc-300" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 pb-20 pt-24 text-zinc-50 sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300">
              <ArrowLeft className="size-3.5" /> Definições
            </Link>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              <CalendarCheck2 className="size-4" /> Marcações
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Regra de cancelamento</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Define com quantas horas de antecedência o cliente pode cancelar ou reagendar uma marcação através do portal.</p>
          </div>
          <Button onClick={() => void save()} disabled={!dirty || saving || hoursError} className="min-h-11 bg-white text-zinc-950 hover:bg-zinc-100">
            {saving ? <Spinner className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}
            {saving ? "A guardar…" : "Guardar regra"}
          </Button>
        </header>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-violet-300" /> Prazo mínimo</CardTitle>
            <CardDescription>O valor aplica-se a toda a barbearia. Só owner e admin podem alterar esta definição.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-2">
                <label htmlFor="cancellation-hours" className="text-sm font-medium">Horas antes da marcação</label>
                <Input
                  id="cancellation-hours"
                  type="number"
                  min={0}
                  max={720}
                  step={1}
                  value={hours}
                  onChange={(event) => setHours(Number(event.target.value))}
                  className="min-h-12 rounded-xl border-white/10 bg-white/[0.04] text-lg text-zinc-100"
                  aria-invalid={hoursError}
                />
                {hoursError ? <p className="text-xs text-red-300">Usa um número inteiro entre 0 e 720 horas.</p> : <p className="text-xs leading-5 text-zinc-600">0 significa que não existe prazo mínimo.</p>}
              </div>
              <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.05] px-5 py-4 sm:min-w-44">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Regra atual</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatHours(hours)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Atalhos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((preset) => {
                  const active = hours === preset;
                  return (
                    <button key={preset} type="button" onClick={() => setHours(preset)} className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm transition ${active ? "border-violet-400/30 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]"}`}>
                      {active && <Check className="size-3.5" />}
                      {formatHours(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Como funciona</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{example}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-600">A validação é feita no servidor quando o cliente tenta cancelar ou reagendar, por isso a regra não pode ser contornada apenas alterando a interface.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
