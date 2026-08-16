"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Building2, Loader2, ShieldCheck } from "lucide-react";

type SuccessPayload = {
  success?: boolean;
  status?: "pending" | string;
  plan?: "free" | "pro" | "enterprise";
  statusLabel?: string;
  barbershopId?: string | null;
  barbershopName?: string | null;
  trialEnd?: string | null;
  currentPeriodEnd?: string | null;
  error?: string;
};

const PLAN_NAMES = {
  free: "Barbers Free",
  pro: "Barbers Pro",
  enterprise: "Barbers Enterprise",
} as const;

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
}

export default function CheckoutSuccessPage() {
  const [state, setState] = useState<{ loading: boolean; payload: SuccessPayload | null }>({ loading: true, payload: null });
  const sessionId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("session_id") : null;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (sessionId) {
          const response = await fetch(`/api/stripe/checkout/success?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
          const payload = (await response.json().catch(() => ({}))) as SuccessPayload;
          if (!cancelled) setState({ loading: false, payload: response.ok ? payload : { error: payload.error || "Não foi possível confirmar a compra." } });
          return;
        }

        // Fallback for successful custom-checkout confirmations that complete without a redirect.
        // The subscription endpoint is already reconciled against Stripe and is the local source of truth for the UI.
        const response = await fetch("/api/stripe/subscription", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          plan?: "free" | "pro" | "enterprise";
          subscription?: {
            status?: string;
            current_period_end?: string | null;
            trial_end?: string | null;
          } | null;
        };
        const plan = payload.plan;
        const subscription = payload.subscription;
        const isConfirmed = Boolean(plan && (plan === "pro" || plan === "enterprise") && subscription && ["active", "trialing"].includes(subscription.status ?? ""));

        if (!cancelled) {
          setState({
            loading: false,
            payload: isConfirmed
              ? {
                  success: true,
                  plan,
                  status: subscription?.status,
                  trialEnd: subscription?.trial_end ?? null,
                  currentPeriodEnd: subscription?.current_period_end ?? null,
                }
              : { error: "Não foi encontrada uma sessão de checkout válida e a subscrição ainda não está confirmada." },
          });
        }
      } catch (error) {
        if (!cancelled) setState({ loading: false, payload: { error: error instanceof Error ? error.message : "Não foi possível confirmar a subscrição." } });
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (state.loading) {
    return <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white"><div className="text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><Loader2 className="size-5 animate-spin" /></div><h1 className="mt-5 text-xl font-semibold">A confirmar a tua subscrição…</h1><p className="mt-2 text-sm text-zinc-500">Estamos a sincronizar o pagamento e o plano da tua barbearia.</p></div></main>;
  }

  if (state.payload?.status === "pending") {
    return <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white"><div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-zinc-900/80 p-7 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200"><Loader2 className="size-5" /></div><h1 className="mt-5 text-2xl font-semibold">Pagamento em processamento</h1><p className="mt-2 text-sm leading-6 text-zinc-400">A compra ainda não foi concluída na Stripe. Podes voltar ao billing e verificar o estado da subscrição.</p><Link href="/dashboard/billing" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950">Abrir billing <ArrowRight className="size-4" /></Link></div></main>;
  }

  if (!state.payload?.success || state.payload.error) {
    return <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white"><div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-zinc-900/80 p-7 text-center"><h1 className="text-2xl font-semibold">Não foi possível confirmar a subscrição</h1><p className="mt-3 text-sm leading-6 text-zinc-400">{state.payload?.error || "A compra pode ter sido concluída, mas não conseguimos sincronizar o plano."}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"><Link href="/dashboard/billing" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950">Ir para billing</Link><Link href="/plans" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-semibold text-zinc-100">Voltar aos planos</Link></div></div></main>;
  }

  const planName = state.payload.plan ? PLAN_NAMES[state.payload.plan] : "A tua subscrição";
  const trialEnd = formatDate(state.payload.trialEnd);
  const periodEnd = formatDate(state.payload.currentPeriodEnd);

  return <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6"><div className="mx-auto max-w-3xl"><div className="rounded-[2rem] border border-emerald-400/15 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_36%),rgba(24,24,27,0.84)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:p-10"><div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><CheckCircle2 className="size-7" /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Subscrição confirmada</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Tudo certo. O teu plano está ativo.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">A subscrição Stripe foi sincronizada e ficou associada à tua barbearia. Toda a equipa elegível passa a usar as funcionalidades do plano.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex items-center gap-2 text-zinc-500"><ShieldCheck className="size-4 text-emerald-300" /><span className="text-xs uppercase tracking-[0.12em]">Plano</span></div><p className="mt-2 text-lg font-semibold text-white">{planName}</p></div><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex items-center gap-2 text-zinc-500"><Building2 className="size-4 text-emerald-300" /><span className="text-xs uppercase tracking-[0.12em]">Barbearia</span></div><p className="mt-2 text-lg font-semibold text-white">{state.payload.barbershopName || "Barbearia associada"}</p></div></div>{trialEnd ? <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4 text-sm text-emerald-100">Trial Pro ativo até <strong>{trialEnd}</strong>. Depois inicia-se a cobrança normal, salvo cancelamento.</div> : null}{periodEnd && !trialEnd ? <p className="mt-4 text-xs text-zinc-500">Período atual até {periodEnd}.</p> : null}<div className="mt-8 flex flex-col gap-2 sm:flex-row"><Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-zinc-950">Ir para dashboard <ArrowRight className="size-4" /></Link><Link href="/dashboard/billing" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-zinc-100">Ver faturação</Link></div></div></div></main>;
}
