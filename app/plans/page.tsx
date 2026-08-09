import { CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";
import { PricingSection } from "@/components/hero/pricing-section";
import { PlanComparison } from "@/components/billing/plan-comparison";

const faqs = [
  [
    "Posso mudar de plano quando quiser?",
    "Sim. Podes fazer upgrade, downgrade ou cancelar a qualquer momento na área de subscrição.",
  ],
  [
    "Como são tratados os pagamentos?",
    "Os pagamentos, métodos de pagamento e faturas são geridos com segurança pelo Stripe.",
  ],
  [
    "O que acontece se cancelar?",
    "Manténs o acesso ao plano atual até ao final do período de faturação em curso.",
  ],
] as const;

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <SiteNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 px-6 py-12 sm:px-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <ShieldCheck className="size-3.5" />
              Preços claros, sem surpresas
            </span>
            <h1 className="mt-5 text-4xl font-heading font-bold tracking-tight sm:text-5xl">
              Um plano para cada fase da tua barbearia.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Começa gratuitamente. Quando precisares de mais equipa, automação
              e controlo, faz a alteração em poucos cliques.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <PricingSection />
        </section>

        <PlanComparison />

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <article
              key={question}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <CircleHelp className="size-5 text-emerald-400" />
              <h2 className="mt-4 font-semibold text-zinc-100">{question}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{answer}</p>
            </article>
          ))}
        </section>

        <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-zinc-400">
          <CheckCircle2 className="size-4 text-emerald-400" />
          Podes gerir o teu plano e faturas a qualquer momento a partir das
          definições.
        </p>
      </main>
    </div>
  );
}
