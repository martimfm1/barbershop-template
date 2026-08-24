import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';

export function ProTrialBanner() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8"
      aria-label="Oferta de um mês Barbers Pro"
    >
      <div className="relative overflow-hidden border border-emerald-400/20 bg-emerald-400/[0.055] px-4 py-4 shadow-[0_18px_60px_rgba(16,185,129,0.06)] sm:px-5 sm:py-4">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-emerald-300/[0.04] blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Gift className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-100">
                1 mês de Barbers Pro grátis
              </p>
              <p className="mt-0.5 text-xs leading-5 text-zinc-400">
                Oferta exclusiva para novos utilizadores. O código TRIALPRO dá
                acesso ao primeiro mês sem cobrança.
              </p>
            </div>
          </div>
          <Link
            href="/registo"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Experimentar grátis{' '}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
