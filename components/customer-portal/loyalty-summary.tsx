'use client';

import Link from 'next/link';
import { Gift, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

type LoyaltyData = {
  enrolled: boolean;
  member?: { pointsBalance: number };
  barbershop?: { name: string; slug: string | null } | null;
  rewards?: Array<{ id: string; name: string; points_cost: number }>;
  nextReward?: { name: string; points_cost: number } | null;
};

export function LoyaltySummary() {
  const [data, setData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/customer-portal/loyalty', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return null;
        const payload = await response.json().catch(() => null);
        if (!response.ok) return null;
        return payload as LoyaltyData;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!data?.enrolled || !data.barbershop) return null;

  const points = data.member?.pointsBalance ?? 0;
  const target = data.nextReward?.points_cost ?? points;
  const progress =
    target > 0 ? Math.min(100, Math.round((points / target) * 100)) : 100;
  const href = data.barbershop.slug
    ? `/barbershops/${encodeURIComponent(data.barbershop.slug)}/loyalty`
    : '/barbershops';

  return (
    <section className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.08] via-white/[0.02] to-transparent p-5 shadow-xl sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Fidelização
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {data.barbershop.name}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <Star
              className="size-4 fill-emerald-300 text-emerald-300"
              aria-hidden="true"
            />
            <span>{points} pontos</span>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <Gift className="size-4" aria-hidden="true" />
          Ver recompensas
        </Link>
      </div>

      {data.nextReward ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles
                className="size-4 text-emerald-300"
                aria-hidden="true"
              />
              <span>Próxima recompensa</span>
            </div>
            <span className="font-semibold text-white">
              {data.nextReward.points_cost} pts
            </span>
          </div>
          <p className="mt-2 font-medium text-white">{data.nextReward.name}</p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label={`Progresso para ${data.nextReward.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`${progress}% concluído · ${points} de ${data.nextReward.points_cost} pontos`}
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-all motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Faltam {Math.max(0, data.nextReward.points_cost - points)} pontos.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 text-sm text-emerald-100">
          Tens pontos suficientes para desbloquear uma recompensa.
        </div>
      )}
    </section>
  );
}
