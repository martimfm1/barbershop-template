"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomBillingPortal } from "@/components/billing/CustomBillingPortal";
import { ProTrialNotice } from "@/components/billing/ProTrialNotice";

export default function BillingPage() {
  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="dashboard-page-header border-b border-white/10 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400"><CreditCard className="size-4" aria-hidden="true" /> Subscrição</div>
            <h1 className="mt-2 text-2xl font-heading font-bold tracking-tight sm:text-4xl">Plano e faturação</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Consulta o estado da tua subscrição na Silentra e usa a área segura da Stripe para gerir pagamentos, faturas e a subscrição.</p>
          </div>
          <Button asChild variant="outline" className="min-h-11 w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"><Link href="/dashboard/settings"><ArrowLeft className="mr-2 size-4" />Definições</Link></Button>
        </header>

        <ProTrialNotice />

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Benefícios do Silentra">
          <div className="border border-white/10 bg-white/[0.025] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-zinc-100"><ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" /> Estado em tempo real</p><p className="mt-1 text-xs leading-5 text-zinc-500">A Silentra sincroniza o estado da subscrição com a Stripe.</p></div>
          <div className="border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-emerald-200"><Sparkles className="size-4 text-emerald-400" aria-hidden="true" /> Gestão centralizada</p><p className="mt-1 text-xs leading-5 text-zinc-500">O plano pertence à barbearia e aplica-se aos utilizadores elegíveis.</p></div>
          <div className="border border-white/10 bg-white/[0.025] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-zinc-100"><CreditCard className="size-4 text-emerald-400" aria-hidden="true" /> Stripe Customer Portal</p><p className="mt-1 text-xs leading-5 text-zinc-500">Cartões, faturas e alterações de subscrição são geridos com segurança pela Stripe.</p></div>
        </section>

        <section className="rounded-3xl border border-emerald-500/15 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_35%),rgba(24,24,27,0.75)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Gestão segura</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Abrir o Customer Portal da Stripe</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">A Stripe abre uma sessão segura e temporária onde podes atualizar o método de pagamento, consultar e descarregar faturas, alterar o plano e gerir o cancelamento.</p>
            </div>
            <div className="shrink-0">
              <Button asChild className="min-h-11 bg-emerald-400 text-zinc-950 hover:bg-emerald-300">
                <Link href="#stripe-customer-portal"><ExternalLink className="mr-2 size-4" />Gerir faturação</Link>
              </Button>
            </div>
          </div>
        </section>

        <div id="stripe-customer-portal">
          <CustomBillingPortal />
        </div>
      </div>
    </main>
  );
}
