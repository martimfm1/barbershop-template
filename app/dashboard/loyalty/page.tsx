"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Loader2, Lock, RefreshCw, Sparkles, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type LoyaltySettings = Record<string, unknown> | null;
type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string | null;
  reward_value: number | null;
  active: boolean;
};

function getSetting(settings: LoyaltySettings, keys: string[], fallback: unknown) {
  for (const key of keys) {
    if (settings && settings[key] !== undefined && settings[key] !== null) return settings[key];
  }
  return fallback;
}

export default function LoyaltyPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("loyalty");
  const [settings, setSettings] = useState<LoyaltySettings>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch("/api/loyalty", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar a fidelização.");
      setSettings(data.settings ?? null);
      setRewards(data.rewards ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar fidelização.");
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => { void load(); }, [load]);

  if (accessLoading) return <main className="min-h-screen bg-background" />;

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-24">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
              <Lock className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold">Programa de fidelização</h1>
              <p className="text-muted-foreground">Cria pontos e recompensas para incentivar os clientes a voltar.</p>
              <Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const pointsPerEuro = Number(getSetting(settings, ["points_per_euro", "pointsPerEuro", "earn_rate"], 1)) || 1;
  const minimumRedeem = Number(getSetting(settings, ["minimum_redeem_points", "minimumRedeemPoints"], 0)) || 0;
  const activeRewards = rewards.filter((reward) => reward.active);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">FIDELIZAÇÃO</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clientes que voltam</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Vê como o programa funciona e quais as recompensas disponíveis, sem misturar esta área com campanhas ou automações.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button>
            <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar fidelização"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <Star className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-medium">1. Cliente visita</p>
                  <p className="mt-1 text-sm text-muted-foreground">A compra gera pontos de acordo com a configuração atual.</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <Trophy className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-medium">2. Acumula</p>
                  <p className="mt-1 text-sm text-muted-foreground">A cada €1 gasto, o cliente recebe {pointsPerEuro} ponto{pointsPerEuro === 1 ? "" : "s"}.</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <Gift className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-medium">3. Resgata</p>
                  <p className="mt-1 text-sm text-muted-foreground">Quando tiver pontos suficientes, pode trocar por uma recompensa.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Exemplo</p>
                    <p className="mt-1 text-lg font-semibold">Cliente gasta €25</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{25 * pointsPerEuro} pts</p>
                    <p className="text-xs text-muted-foreground">pontos acumulados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Acumulação</p>
                <p className="mt-1 text-lg font-semibold">€1 = {pointsPerEuro} ponto{pointsPerEuro === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Recompensas ativas</p>
                <p className="mt-1 text-lg font-semibold">{activeRewards.length}</p>
              </div>
              {minimumRedeem > 0 && (
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mínimo para resgate</p>
                  <p className="mt-1 text-lg font-semibold">{minimumRedeem} pontos</p>
                </div>
              )}
              <p className="pt-2 text-xs leading-5 text-muted-foreground">Esta página apresenta a configuração que a API disponibiliza atualmente. A edição das regras e recompensas será adicionada quando existir suporte de escrita no backend.</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recompensas</h2>
              <p className="mt-1 text-sm text-muted-foreground">O que os clientes podem trocar pelos pontos acumulados.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium">{activeRewards.length} ativas</span>
          </div>

          {loading && rewards.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar...</div>
          ) : activeRewards.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeRewards.map((reward) => (
                <Card key={reward.id} className="h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gift className="h-5 w-5" /></div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{reward.points_cost} pts</span>
                    </div>
                    <h3 className="mt-5 font-semibold">{reward.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{reward.description || "Recompensa de fidelização"}</p>
                    {reward.reward_value !== null && <p className="mt-4 text-xs text-muted-foreground">Valor: {reward.reward_value}{reward.reward_type ? ` · ${reward.reward_type}` : ""}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Gift className="h-8 w-8 text-muted-foreground" /><p className="font-medium">Ainda não existem recompensas ativas</p><p className="max-w-md text-sm text-muted-foreground">Quando existirem recompensas configuradas, vão aparecer aqui com o custo em pontos.</p></CardContent></Card>
          )}
        </section>
      </div>
    </main>
  );
}
