"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomBillingPortal } from "@/components/billing/CustomBillingPortal";

export default function BillingPage() {
  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="dashboard-page-header border-b border-white/10 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400"><CreditCard className="size-4" aria-hidden="true" /> Subscrição</div>
            <h1 className="mt-2 text-2xl font-heading font-bold tracking-tight sm:text-4xl">Plano e faturação</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Gere a subscrição, compara planos e consulta as faturas da tua barbearia num espaço seguro.</p>
          </div>
          <Button asChild variant="outline" className="min-h-11 w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"><Link href="/dashboard/settings"><ArrowLeft className="mr-2 size-4" />Definições</Link></Button>
        </header>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-xs text-zinc-400"><ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" /><span>Os pagamentos são processados pelo Stripe. Os dados do cartão não são armazenados pela Silentra.</span></div>
        <CustomBillingPortal />
      </div>
    </main>
  );
}
