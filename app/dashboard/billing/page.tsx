"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomBillingPortal } from "@/components/billing/CustomBillingPortal";

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-emerald-400"><CreditCard className="size-4" />Subscricao</div>
            <h1 className="mt-2 text-3xl font-heading font-bold tracking-tight sm:text-4xl">Plano e faturacao</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">Gere a tua subscricao e escolhe o plano que acompanha o crescimento da tua barbearia.</p>
          </div>
          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10">
            <Link href="/dashboard/settings"><ArrowLeft className="mr-2 size-4" />Definicoes</Link>
          </Button>
        </div>
        <CustomBillingPortal />
      </div>
    </main>
  );
}
