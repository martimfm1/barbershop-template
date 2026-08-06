"use client";

import { PricingCard } from "@/components/billing/PricingCard";
import { PLAN_DESCRIPTIONS, PLAN_FEATURES } from "@/lib/billing/plan-features";

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
          Escolhe entre faturação mensal ou anual no portal de subscrição.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PricingCard
          tier="pro"
          title="Barbers Pro"
          price="9,90 €"
          description={PLAN_DESCRIPTIONS.pro}
          features={PLAN_FEATURES.pro}
          popular
        />
        <PricingCard
          tier="business"
          title="Barbers Enterprise"
          price="24,90 €"
          description={PLAN_DESCRIPTIONS.enterprise}
          features={PLAN_FEATURES.enterprise}
        />
      </div>
    </section>
  );
}
