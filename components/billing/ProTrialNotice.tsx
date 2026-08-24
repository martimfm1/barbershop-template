'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';

export function ProTrialNotice() {
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/stripe/trial-eligibility', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return { eligible: false };
        return response.json() as Promise<{ eligible?: boolean }>;
      })
      .then((data) => {
        if (active) setEligible(data.eligible === true);
      })
      .catch(() => {
        if (active) setEligible(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !eligible) return null;

  return (
    <section
      className="rounded-3xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.04] to-zinc-900 p-5 sm:p-6"
      aria-label="Oferta de um mês do plano Pro"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <Gift className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Oferta para novos utilizadores
            </p>
            <h2 className="mt-1 text-base font-semibold text-zinc-50 sm:text-lg">
              1 mês de Barbers Pro grátis com o código TRIALPRO.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              O código é aplicado automaticamente no checkout para novos membros
              elegíveis. Depois do primeiro mês, aplica-se o preço normal do
              plano.
            </p>
          </div>
        </div>
        <Link
          href="/plans"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Ver Pro
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
