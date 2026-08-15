"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PricingCard } from "@/components/billing/PricingCard";
import { PLAN_DESCRIPTIONS } from "@/lib/billing/plan-features";

const HERO_FEATURES = {
  free: ["Agendamentos ilimitados", "Clientes e serviços ilimitados", "Reservas online + código QR", "1 barbeiro e 1 localização"],
  pro: ["Até 5 barbeiros", "CRM e estatísticas avançadas", "Automação e campanhas de marketing", "Fidelização e seguimentos automáticos"],
  enterprise: ["Barbeiros e localizações ilimitados", "POS, stock e comissões", "Permissões e gestão global", "Relatórios empresariais avançados"],
} as const;

export function PricingSection() {
  return (
    <section id="precos" className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400/80">Preços simples</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">Começa grátis. Testa o Pro durante 14 dias antes de pagar.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">O Free continua sem cartão. No Pro, tens 14 dias para experimentar automação, CRM, campanhas e fidelização antes da primeira cobrança.</p>
        </div>
        <Link href="/plans" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">Comparar planos <ArrowRight className="size-4" /></Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <PricingCard tier="free" title="Barbers Free" price="0 €" description={PLAN_DESCRIPTIONS.free} features={HERO_FEATURES.free} />
        <PricingCard tier="pro" title="Barbers Pro" price="9,90 €" description={PLAN_DESCRIPTIONS.pro} features={HERO_FEATURES.pro} popular trialDays={14} />
        <PricingCard tier="enterprise" title="Barbers Enterprise" price="A partir de 29,90 €" description={PLAN_DESCRIPTIONS.enterprise} features={HERO_FEATURES.enterprise} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-white/10 bg-white/[0.025] px-5 py-4"><p className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><Check className="size-4 text-emerald-400" /> Free sem risco</p><p className="mt-1 text-xs leading-5 text-zinc-500">Começa gratuitamente e sem período experimental obrigatório.</p></div>
        <div className="border border-emerald-500/20 bg-emerald-500/[0.045] px-5 py-4"><p className="text-sm font-semibold text-emerald-300">14 dias de Pro</p><p className="mt-1 text-xs leading-5 text-zinc-500">Testa todas as ferramentas Pro antes da primeira cobrança.</p></div>
        <div className="border border-white/10 bg-white/[0.025] px-5 py-4"><p className="text-sm font-semibold text-zinc-100">Enterprise para escalar</p><p className="mt-1 text-xs leading-5 text-zinc-500">Para equipas, várias localizações e controlo operacional avançado.</p></div>
      </div>
    </section>
  );
}
