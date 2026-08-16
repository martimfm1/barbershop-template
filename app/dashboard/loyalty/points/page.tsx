import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EarningRulesCard } from "@/components/dashboard/loyalty/earning-rules-card";

export default function LoyaltyPointsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <Link href="/dashboard/loyalty" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Fidelização
          </Link>
          <p className="mt-6 text-sm font-medium text-primary">PONTOS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Regras de pontos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Define quantos pontos cada serviço gera quando a marcação fica concluída.</p>
        </header>
        <EarningRulesCard />
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/loyalty/validate" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Validar recompensa</Link>
          <Link href="/dashboard/loyalty" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm">Gerir recompensas</Link>
        </div>
      </div>
    </main>
  );
}
