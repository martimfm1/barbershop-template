"use client";

import { FormEvent, useEffect, useState } from "react";
import { Gift, Loader2, Mail, Sparkles, Star } from "lucide-react";

type Reward = { id: string; name: string; description: string | null; points_required: number };
type Member = { email: string; name: string | null; points_balance: number };

type Props = { slug: string; shopName: string };

export default function LoyaltyStore({ slug, shopName }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/loyalty/me?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a fidelização.");
      setAuthenticated(Boolean(data.authenticated));
      setMember(data.member ?? null);
      setRewards(Array.isArray(data.rewards) ? data.rewards : []);
      if (data.email) setEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a fidelização.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [slug]);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/loyalty/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o código.");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o código.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/loyalty/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Código inválido.");
      setCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="grid min-h-64 place-items-center rounded-3xl border border-white/10 bg-white/[0.025]"><Loader2 className="size-5 animate-spin text-emerald-300" /></div>;
  if (error && !member) return <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-5 text-sm text-red-200">{error}</div>;

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-2xl sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><Star className="size-5" /></div>
        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <div><h2 className="text-xl font-semibold">Entrar na fidelização</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Usa o email que costumas dar à {shopName}.</p></div>
            <label className="block"><span className="sr-only">Email</span><div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-3"><Mail className="size-4 text-zinc-500"/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@email.com" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600"/></div></label>
            <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-zinc-950 disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : null}{busy ? "A enviar…" : "Enviar código"}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div><h2 className="text-xl font-semibold">Confirma o teu email</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Enviámos um código de 6 dígitos para {email}.</p></div>
            <input required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-14 w-full rounded-xl border border-white/10 bg-black/20 text-center text-2xl tracking-[0.35em] text-white outline-none"/>
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            <button disabled={busy || code.length !== 6} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-zinc-950 disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : null}{busy ? "A confirmar…" : "Confirmar acesso"}</button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="w-full text-xs text-zinc-500">Usar outro email</button>
          </form>
        )}
      </div>
    );
  }

  const points = member?.points_balance ?? 0;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.10] to-white/[0.02] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{shopName}</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-zinc-400">Saldo atual</p><p className="mt-1 text-4xl font-semibold tracking-tight text-white">{points} <span className="text-base font-medium text-emerald-300">pontos</span></p></div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400"><Sparkles className="size-3.5 text-emerald-300" /> Conta associada a {member?.email}</div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Recompensas</h2><p className="mt-1 text-sm text-zinc-500">Usa os teus pontos para desbloquear benefícios.</p></div></div>
        {rewards.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Ainda não existem recompensas configuradas.</div> : <div className="grid gap-3 sm:grid-cols-2">{rewards.map((reward) => <article key={reward.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex size-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-200"><Gift className="size-5" /></div><h3 className="mt-4 font-semibold text-white">{reward.name}</h3><p className="mt-1 text-sm leading-6 text-zinc-500">{reward.description || "Recompensa de fidelização."}</p><p className="mt-5 text-sm font-semibold text-emerald-300">{reward.points_required} pontos</p></article>)}</div>}
      </section>
    </div>
  );
}
