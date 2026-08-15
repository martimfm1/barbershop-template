import { CheckCircle2, CircleHelp, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SiteNavbar } from "@/components/site-navbar";
import { PricingSection } from "@/components/hero/pricing-section";
import { PlanComparison } from "@/components/billing/plan-comparison";

const faqs = [
  ["Posso mudar de plano quando quiser?", "Sim. Podes fazer upgrade, downgrade ou cancelar a qualquer momento na área de subscrição."],
  ["Como são tratados os pagamentos?", "Os pagamentos, métodos de pagamento e faturas são geridos com segurança pelo Stripe."],
  ["O que acontece se cancelar?", "Manténs o acesso ao plano atual até ao final do período de faturação em curso."],
] as const;

export default function PlansPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-zinc-950 text-zinc-50 antialiased">
      <SiteNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),rgba(24,24,27,0.72)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200"><ShieldCheck className="size-3.5" aria-hidden="true" />Planos Silentra</span>
            <h1 className="mt-5 text-[2.45rem] font-semibold leading-[1] tracking-[-0.055em] sm:text-5xl">Escolhe o nível de operação que a tua barbearia precisa agora.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Começa no Free e sobe quando precisares de mais equipa, retenção, automação e controlo. O plano pertence à barbearia, não a cada utilizador.</p>
            <div className="mt-6 grid gap-2 text-xs text-zinc-500 sm:flex sm:flex-wrap sm:gap-x-5"><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-300" />Sem cartão para começar</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-300" />Membros da equipa herdam o plano</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-300" />Faturação com Stripe</span></div>
          </div>
        </section>

        <section className="mt-8 sm:mt-12"><PricingSection /></section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:mt-14 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Comparação completa</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">Vê exatamente o que muda entre planos.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Compara funcionalidades e limites antes de decidir. Não precisas de decorar o que cada plano inclui.</p></div><Link href="/registo" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950">Começar grátis <ArrowRight className="size-4" /></Link></div>
          <div className="mt-7 overflow-x-auto"><PlanComparison /></div>
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Perguntas frequentes</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Antes de escolher, tira as dúvidas principais.</h2></div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">{faqs.map(([question, answer]) => <article key={question} className="border border-white/10 bg-zinc-900/45 p-5 transition hover:border-white/20 hover:bg-white/[0.035]"><CircleHelp className="size-5 text-emerald-300" aria-hidden="true" /><h2 className="mt-4 font-semibold text-zinc-100">{question}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{answer}</p></article>)}</div>
        </section>

        <section className="mt-10 border border-white/10 bg-white/[0.03] p-5 sm:mt-14 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Decisão simples</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Começa no Free. Deixa o produto crescer contigo.</p><p className="mt-2 text-sm leading-6 text-zinc-500">Podes gerir o plano e as faturas a partir das definições da tua barbearia.</p></div><Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950">Criar barbearia <ArrowRight className="size-4" /></Link></div></section>
      </main>
    </div>
  );
}
