"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gift, Loader2, Search, ShieldCheck, Star } from "lucide-react";

type Shop = { id: string; name: string; slug: string | null; plan: "free" | "pro" | "enterprise" };
type OverviewResponse = { recentShops?: Shop[] };
type GrantResult = { email: string; previous_balance: number; points_added: number; new_balance: number };

export default function SilentraAdminLoyaltyPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("100");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/silentra-admin/overview", { cache: "no-store" });
        const data = (await response.json()) as OverviewResponse & { error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar as barbearias.");
        if (!cancelled) {
          const next = Array.isArray(data.recentShops) ? data.recentShops : [];
          setShops(next);
          setShopId(next[0]?.id ?? "");
        }
      } catch (error) {
        if (!cancelled) setNotice({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar as barbearias." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedShop = useMemo(() => shops.find((shop) => shop.id === shopId) ?? null, [shops, shopId]);

  async function grantPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/silentra-admin/loyalty/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barbershopId: shopId, email, points: Number(points), reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível atribuir os pontos.");
      const member = data.member as GrantResult;
      setNotice({ type: "success", text: `${member.email} recebeu ${member.points_added} pontos. Saldo: ${member.previous_balance} → ${member.new_balance}.` });
      setEmail("");
      setReason("");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível atribuir os pontos." });
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-400/15 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300"><ShieldCheck className="size-3.5" /> Silentra / Internal</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gestão de pontos</h1>
            <p className="mt-1 text-xs text-zinc-600">Atribui pontos manualmente a membros da fidelização. Cada operação fica registada como ajuste administrativo.</p>
          </div>
          <Link href="/silentra-admin" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-300 hover:bg-white/[0.08]"><ArrowLeft className="size-4" />Voltar ao admin</Link>
        </header>

        {notice ? <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200" : "border-red-400/20 bg-red-400/[0.05] text-red-200"}`}>{notice.text}</div> : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><Gift className="size-5" /></div><div><h2 className="font-semibold">Dar pontos a um cliente</h2><p className="mt-1 text-xs text-zinc-600">O email tem de corresponder a um membro ativo da fidelização na barbearia selecionada.</p></div></div>

          <form onSubmit={grantPoints} className="mt-6 space-y-5">
            <div>
              <label className="text-xs font-medium text-zinc-400">Barbearia</label>
              <select value={shopId} onChange={(event) => setShopId(event.target.value)} disabled={loading || saving} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30">
                <option value="">Seleciona uma barbearia</option>
                {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name} · {shop.plan.toUpperCase()}</option>)}
              </select>
              {selectedShop ? <p className="mt-1 text-[11px] text-zinc-700">{selectedShop.id}</p> : null}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Email do cliente</label>
              <div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={saving} placeholder="cliente@email.com" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-sm outline-none focus:border-emerald-400/30" /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-400">Pontos</label>
                <input required type="number" min="1" max="1000000" step="1" value={points} onChange={(event) => setPoints(event.target.value)} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Motivo</label>
                <input required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} placeholder="Compensação, promoção, suporte…" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30" />
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4 text-xs leading-5 text-zinc-500"><div className="flex items-center gap-2 text-amber-200"><Star className="size-3.5" />Auditoria</div><p className="mt-2">A alteração é atómica: atualiza o saldo e cria uma transação <code className="text-zinc-300">adjustment</code>. O saldo histórico é sincronizado quando existe conta legada.</p></div>

            <button type="submit" disabled={saving || loading || !shopId} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{saving ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}{saving ? "A atribuir…" : "Atribuir pontos"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
