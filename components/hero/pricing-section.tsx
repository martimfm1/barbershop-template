"use client";

import { PricingCard } from "@/components/billing/PricingCard";
import {
  FEATURE_LABELS,
  PLAN_DESCRIPTIONS,
  PLAN_FEATURES,
} from "@/lib/billing/plan-features";

export function PricingSection() {
  return (
    <section id="prices" className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
            Planos
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
            Escolhe o plano certo para o teu negócio.
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base lg:text-right">
          Começa gratuitamente e faz upgrade quando o teu negócio crescer.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PricingCard
          tier="free"
          title="Barbers Free"
          price="0 €"
          description={PLAN_DESCRIPTIONS.free}
          features={PLAN_FEATURES.free.map((feature) => FEATURE_LABELS[feature])}
        />
        <PricingCard
          tier="pro"
          title="Barbers Pro"
          price="9,90 €"
          description={PLAN_DESCRIPTIONS.pro}
          features={PLAN_FEATURES.pro.map((feature) => FEATURE_LABELS[feature])}
          popular
        />
        <PricingCard
          tier="enterprise"
          title="Barbers Enterprise"
          price="A partir de 29,90 €"
          description={PLAN_DESCRIPTIONS.enterprise}
          features={PLAN_FEATURES.enterprise.map((feature) => FEATURE_LABELS[feature])}
        />
      </div>
    </section>
  );
}
