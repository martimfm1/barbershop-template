"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Download, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  plan: string;
  date: string;
  invoice_pdf: string | null;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount / 100);
}

export function BillingHub() {
  const { subscription, plan, planSource, isAdministrativePlan, isTrial, loading, cancel } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const hasSubscription = Boolean(subscription?.stripe_subscription_id);
  const active = subscription?.status === "active" || subscription?.status === "trialing";
  const nextRenewal = useMemo(() => {
    if (!subscription?.current_period_end) return "—";
    return new Date(subscription.current_period_end).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  }, [subscription?.current_period_end]);

  useEffect(() => {
    if (!hasSubscription || isAdministrativePlan) return;
    let cancelled = false;
    setLoadingInvoices(true);
    fetch("/api/stripe/invoices", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar os recibos.");
        return body.invoices;
      })
      .then((data) => {
        if (!cancelled) setInvoices(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Não foi possível carregar os recibos.");
      })
      .finally(() => {
        if (!cancelled) setLoadingInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasSubscription, isAdministrativePlan]);

  const handleCancel = async () => {
    if (!active || isAdministrativePlan) return;
    const confirmed = window.confirm("Cancelar a subscrição no final do período atual? O acesso mantém-se até à data de renovação.");
    if (!confirmed) return;
    try {
      setCancelling(true);
      await cancel();
      toast.success("Cancelamento agendado. O plano continua ativo até ao fim do período atual.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a subscrição.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                <ShieldCheck className="size-3.5" /> Subscrição
              </span>
              {isTrial && <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">Trial ativo</span>}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{PLAN_NAMES[plan]}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {isAdministrativePlan ? "Plano atribuído pela administração da Silentra e aplicado à barbearia." : hasSubscription ? "A subscrição é sincronizada com a Stripe e pertence à barbearia." : "Plano gratuito, sem subscrição paga ativa."}
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Estado</p><p className="mt-2 font-medium text-zinc-100">{isAdministrativePlan ? "Atribuído" : subscription?.cancel_at_period_end ? "Cancelamento agendado" : active ? isTrial ? "Em trial" : "Ativo" : "Gratuito"}</p></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Renovação</p><p className="mt-2 font-medium text-zinc-100">{isAdministrativePlan ? "—" : nextRenewal}</p></div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">Origem: {isAdministrativePlan ? "Administração Silentra" : planSource === "stripe" ? "Stripe" : "Plano gratuito"}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/plans" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.07]">Comparar planos <ArrowRight className="size-4" /></Link>
            {active && !isAdministrativePlan && !subscription?.cancel_at_period_end && <button type="button" onClick={() => void handleCancel()} disabled={cancelling || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 text-sm font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60">{cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}Cancelar subscrição</button>}
            {subscription?.cancel_at_period_end && <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 text-sm font-medium text-amber-200"><CalendarDays className="size-4" /> Termina em {nextRenewal}</span>}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-900/50 p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Recibos</p><h3 className="mt-1 text-xl font-semibold text-white">Histórico de faturação</h3><p className="mt-1 text-sm text-zinc-500">Consulta e descarrega os recibos emitidos pela Stripe.</p></div>
          {hasSubscription && !isAdministrativePlan && <span className="text-xs text-zinc-600">Últimos 12</span>}
        </div>
        <div className="mt-5 space-y-2">
          {loadingInvoices ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/8 bg-black/20 py-10 text-zinc-500"><Loader2 className="size-5 animate-spin" /></div>
          ) : !hasSubscription || isAdministrativePlan ? (
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5 text-sm text-zinc-500">Ainda não existem recibos de uma subscrição Stripe nesta conta.</div>
          ) : invoices.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5 text-sm text-zinc-500">Ainda não existem recibos emitidos.</div>
          ) : invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-zinc-100">{invoice.plan}</p><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-0.5 text-[10px] text-emerald-200">{invoice.status ?? "processado"}</span></div><p className="mt-1 text-xs text-zinc-500">{invoice.date} · {formatAmount(invoice.amount, invoice.currency)}</p></div>
              {invoice.invoice_pdf ? <a href={invoice.invoice_pdf} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08]"><Download className="size-3.5" /> Descarregar</a> : <span className="text-xs text-zinc-600">Recibo indisponível</span>}
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-zinc-600"><Check className="size-3.5 text-emerald-400" /> Pagamentos e recibos processados pela Stripe. A Silentra não guarda dados do cartão.</div>
    </div>
  );
}
