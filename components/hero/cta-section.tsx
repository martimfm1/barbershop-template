"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="rounded-3xl border border-white/10 bg-linear-to-br from-white/6 to-transparent p-6 backdrop-blur-xl shadow-[0_24px_100px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-300">
            A tua próxima marcação começa aqui
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
            Encontra o teu próximo serviço ou leva a tua barbearia mais longe.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
            Marca em segundos numa barbearia parceira ou cria o espaço da tua barbearia na plataforma e gere tudo num só lugar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link href="/barbershops" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-50 px-5 text-sm font-medium text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.34),0_18px_55px_rgba(255,255,255,0.08)] transition-transform hover:-translate-y-0.5">
            Marcar um serviço <ArrowRight className="size-4" />
          </Link>
          <Link href="/registo" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-zinc-100 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/10">
            Criar a minha barbearia
          </Link>
        </div>
      </div>
    </section>
  );
}
