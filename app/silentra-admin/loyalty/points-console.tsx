"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Gift, Loader2, Search, ShieldCheck, Star } from "lucide-react";

type Member = {
  member_id: string;
  member_email: string;
  member_name: string | null;
  points_balance: number;
  status: string;
  barbershop_id: string;
  barbershop_name: string;
  barbershop_slug: string | null;
};

type GrantResult = {
  member_email: string;
  barbershop_name: string;
  previous_balance: number;
  points_added: number;
  new_balance: number;
};

export default function LoyaltyPointsConsole() {
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("100");
  const [reason, setReason] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function lookupMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    setSearching(true);
    setNotice(null);
    setMember(null);
    try {
      const response = await fetch(`/api/silentra-admin/loyalty/member?email=${encodeURIComponent(normalized)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível pesquisar o cliente.");
      if (!data.member) {
        setNotice({ type: "error", text: "Este email não tem uma fidelização ativa." });
        return;
      }
      setMember(data.member as Member);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Erro ao pesquisar." });
    } finally {
      setSearching(false);
    }
  }

  async function grantPoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/silentra-admin/loyalty/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, points: Number(points), reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível atribuir os pontos.");
      const result = data.member as GrantResult;
      setNotice({ type: "success", text: `${result.member_email} recebeu ${result.points_added} pontos em ${result.barbershop_name}. Saldo: ${result.previous_balance} → ${result.new_balance}.` });
      setReason("");
      setMember((current) => current ? { ...current, points_balance: result.new_balance } : current);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível atribuir os pontos." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-400/15 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300"><ShieldCheck className="size-3.5" /> Silentra / Internal</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gestão de pontos</h1>
            <p className="mt-1 text-xs text-zinc-600">Pesquisa por email e o Silentra encontra automaticamente a única fidelização ativa desse cliente.</p>
          </div>
          <Link href="/silentra-admin" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-300 hover:bg-white/[0.08]"><ArrowLeft className="size-4" />Voltar ao admin</Link>
        </header>

        {notice ? <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200" : "border-red-400/20 bg-red-400/[0.05] text-red-200"}`}>{notice.text}</div> : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><Search className="size-5" /></div><div><h2 className="font-semibold">Pesquisar cliente</h2><p className="mt-1 text-xs text-zinc-600">Um cliente só pode ter uma fidelização ativa. O email é suficiente para localizar a conta.</p></div></div>

          <form onSubmit={lookupMember} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={searching || saving} placeholder="cliente@email.com" className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30" />
            <button type="submit" disabled={searching || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 disabled:opacity-50">{searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}{searching ? "A pesquisar…" : "Pesquisar"}</button>
          </form>
        </section>

        {member ? (
          <section className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Membro ativo</p>
                <h2 className="mt-2 text-xl font-semibold">{member.member_name || member.member_email}</h2>
                <p className="mt-1 text-sm text-zinc-400">{member.member_email}</p>
                <p className="mt-3 text-sm text-zinc-500">Barbearia: <span className="text-zinc-200">{member.barbershop_name}</span></p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right"><p className="text-xs text-zinc-500">Saldo</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{member.points_balance} pts</p></div>
            </div>

            <form onSubmit={grantPoints} className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
              <div><label className="text-xs font-medium text-zinc-400">Pontos</label><input required type="number" min="1" max="1000000" step="1" value={points} onChange={(event) => setPoints(event.target.value)} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30" /></div>
              <div><label className="text-xs font-medium text-zinc-400">Motivo</label><input required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} placeholder="Compensação, promoção, suporte…" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-emerald-400/30" /></div>
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-zinc-950 disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}{saving ? "A atribuir…" : "Atribuir pontos"}</button>
            </form>

            <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4 text-xs leading-5 text-zinc-500"><div className="flex items-center gap-2 text-amber-200"><Star className="size-3.5" />Auditoria</div><p className="mt-2">O ajuste atualiza o saldo e cria uma transação <code className="text-zinc-300">adjustment</code> com o motivo introduzido.</p></div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
