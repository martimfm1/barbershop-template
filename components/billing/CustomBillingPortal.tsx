"use client";

import { useState } from "react";
import { ArrowRight, Check, ExternalLink, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS } from "@/lib/stripe/constants";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

async function openCustomerPortal() {
  const response = await fetch("/api/stripe/customer-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.url !== "string") {
    throw new Error(body.error || "Não foi possível abrir a gestão de faturação.");
  }
  window.location.assign(body.url);
}

export function CustomBillingPortal() {
  const { subscription, plan, planSource, isAdministrativePlan, isTrial, loading } = useSubscription();
  const [openingPortal, setOpeningPortal] = useState(false);
  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id);
  const isPaid = plan === PLANS.PRO || plan === PLANS.ENTERPRISE;

  const handlePortal = async () => {
    try {
      setOpeningPortal(true);
      await openCustomerPortal();
    } catch (error) {
      setOpeningPortal(false);
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir a gestão de faturação.");
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-emerald-400/[0.08] blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <ShieldCheck className="size-3.5" /> Faturação
              </span>
              {isAdministrativePlan && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-200">
                  <Sparkles className="size-3.5" /> Gerido pela Silentra
                </span>
              )}
              {isTrial && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                  <Zap className="size-3.5" /> Trial ativo
                </span>
              )}
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">{PLAN_NAMES[plan]}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {isAdministrativePlan
                ? "Este plano foi atribuído pela administração da Silentra e aplica-se a toda a barbearia."
                : hasStripeSubscription
                  ? "A tua subscrição, cartão, faturas e alterações de plano são geridos com segurança pelo Customer Portal da Stripe."
                  : "Estás no plano gratuito. Escolhe um plano quando precisares de mais funcionalidades."}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            {hasStripeSubscription && !isAdministrativePlan ? (
              <button
                type="button"
                onClick={() => void handlePortal()}
                disabled={loading || openingPortal}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
              >
                {openingPortal ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                {openingPortal ? "A abrir…" : "Gerir faturação"}
              </button>
            ) : (
              <a
                href="/plans"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                <Zap className="size-4" /> Ver planos
              </a>
            )}
            <a href="/plans" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">
              Comparar planos <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Origem</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {isAdministrativePlan ? "Administração Silentra" : planSource === "stripe" ? "Stripe" : planSource === "subscription_override" ? "Override da subscrição" : "Plano gratuito"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Estado</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {isAdministrativePlan ? "Atribuído" : subscription?.cancel_at_period_end ? "Cancelamento agendado" : hasStripeSubscription ? subscription?.status === "trialing" ? "Em trial" : "Ativo" : "Gratuito"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Próxima renovação</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {isAdministrativePlan ? "Gerido pela Silentra" : formatDate(subscription?.current_period_end)}
            </p>
          </div>
        </div>
      </section>

      {hasStripeSubscription && !isAdministrativePlan && (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Customer dashboard</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">Gere a tua conta Stripe</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">Usa a conta que já tens autenticada na Silentra. Não precisas de criar outro login para abrir o Customer Portal.</p>
            </div>
            <button
              type="button"
              onClick={() => void handlePortal()}
              disabled={openingPortal || loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-60"
            >
              {openingPortal ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              {openingPortal ? "A abrir…" : "Abrir Customer Dashboard"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Método de pagamento", body: "Atualiza cartões e dados de faturação diretamente no Stripe.", action: "Atualizar cartão" },
              { title: "Faturas e recibos", body: "Consulta, descarrega e gere o histórico completo de faturação.", action: "Ver faturas" },
              { title: "Subscrição", body: "Altera o plano, cancela no fim do período ou retoma a subscrição.", action: "Gerir subscrição" },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => void handlePortal()}
                disabled={openingPortal}
                className="group rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/20 hover:bg-zinc-900 disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{item.body}</p>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-zinc-600 transition group-hover:text-emerald-300" />
                </div>
                <p className="mt-4 text-xs font-semibold text-emerald-300">{item.action} →</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {isPaid && !hasStripeSubscription && !isAdministrativePlan && (
        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5 text-sm text-amber-100">
          <div className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p>O plano atual está configurado sem uma subscrição Stripe ativa. Para pagamentos e gestão de faturação, inicia uma nova subscrição através dos planos.</p>
          </div>
        </section>
      )}
    </div>
  );
}
