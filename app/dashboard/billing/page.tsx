"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomBillingPortal } from "@/components/billing/CustomBillingPortal";
import { ProTrialNotice } from "@/components/billing/ProTrialNotice";

export default function BillingPage() {
  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="dashboard-page-header border-b border-white/10 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400"><CreditCard className="size-4" aria-hidden="true" /> Subscrição</div>
            <h1 className="mt-2 text-2xl font-heading font-bold tracking-tight sm:text-4xl">Plano e faturação</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Consulta o estado da subscrição, gere o cancelamento e consulta os teus recibos.</p>
          </div>
          <Button asChild variant="outline" className="min-h-11 w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"><Link href="/dashboard/settings"><ArrowLeft className="mr-2 size-4" />Definições</Link></Button>
        </header>

        <ProTrialNotice />

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Informação de faturação">
          <div className="border border-white/10 bg-white/[0.025] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-zinc-100"><ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" /> Estado sincronizado</p><p className="mt-1 text-xs leading-5 text-zinc-500">O estado da subscrição é reconciliado com a Stripe.</p></div>
          <div className="border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-emerald-200"><Sparkles className="size-4" aria-hidden="true" /> Plano da barbearia</p><p className="mt-1 text-xs leading-5 text-zinc-500">O plano pertence à barbearia e aplica-se à equipa.</p></div>
          <div className="border border-white/10 bg-white/[0.025] px-4 py-4"><p className="flex items-center gap-2 text-sm font-medium text-zinc-100"><CreditCard className="size-4 text-emerald-400" aria-hidden="true" /> Pagamentos Stripe</p><p className="mt-1 text-xs leading-5 text-zinc-500">Cartões e faturação são processados pela Stripe.</p></div>
        </section>

        <CustomBillingPortal />
      </div>
    </main>
  );
}
