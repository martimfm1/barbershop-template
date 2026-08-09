"use client";

import { PricingCard } from "@/components/billing/PricingCard";
import {
  FEATURE_LABELS,
  PLAN_DESCRIPTIONS,
} from "@/lib/billing/plan-features";

const HERO_FEATURES = {
  free: [
    "Marcações ilimitadas",
    "Clientes e serviços ilimitados",
    "Reservas online + QR code",
    "1 barbeiro e 1 localização",
  ],
  pro: [
    "Até 5 barbeiros",
    "CRM e analytics avançados",
    "Automação e marketing",
    "Loyalty + Assistente de IA",
  ],
  enterprise: [
    "Barbeiros e localizações ilimitados",
    "POS, stock e comissões",
    "Permissões e gestão global",
    "API + IA avançada",
  ],
} as const;

export function PricingSection() {
  return (
    <section id="prices" className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
            Planos
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
            Começa grátis. Cresce sem trocar de plataforma.
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base lg:text-right">
          O Free dá-te uma operação completa. Faz upgrade quando precisares de
          mais equipa, automação, inteligência e controlo.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PricingCard
          tier="free"
          title="Barbers Free"
          price="0 €"
          description={PLAN_DESCRIPTIONS.free}
          features={HERO_FEATURES.free}
        />
        <PricingCard
          tier="pro"
          title="Barbers Pro"
          price="9,90 €"
          description={PLAN_DESCRIPTIONS.pro}
          features={HERO_FEATURES.pro}
          popular
        />
        <PricingCard
          tier="enterprise"
          title="Barbers Enterprise"
          price="A partir de 29,90 €"
          description={PLAN_DESCRIPTIONS.enterprise}
          features={HERO_FEATURES.enterprise}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
          <p className="text-sm font-semibold text-zinc-100">Free para sempre</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Sem cartão e sem período experimental obrigatório.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] px-5 py-4">
          <p className="text-sm font-semibold text-emerald-300">Pro para crescer</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Automatiza tarefas e transforma clientes em clientes recorrentes.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
          <p className="text-sm font-semibold text-zinc-100">Enterprise para escalar</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Operações multi-localização com controlo, POS, API e IA avançada.
          </p>
        </div>
      </div>
    </section>
  );
}
