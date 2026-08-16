"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, CircleDollarSign, FileText, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS } from "@/lib/stripe/constants";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  date: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

const PLAN_PRICE: Record<string, string> = {
  free: "0 €",
  pro: "9,90 € / mês",
  enterprise: "A partir de 29,90 € / mês",
};

export function BillingOverview() {
  const { subscription, plan, isAdministrativePlan, isTrial, loading, cancel } = useSubscription();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/stripe/invoices", { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        if (!cancelled) setInvoices(Array.isArray(body.invoices) ? body.invoices : []);
      } catch {
        if (!cancelled) toast.error("Não foi possível carregar os recibos.");
      } finally {
        if (!cancelled) setLoadingInvoices(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [subscription?.stripe_subscription_id]);

  const handleCancel = async () => {
    if (isAdministrativePlan || !subscription?.stripe_subscription_id || subscription.cancel_at_period_end) return;
    const confirmed = window.confirm("Queres cancelar a subscrição no final do período atual? O acesso mantém-se até à data de renovação.");
    if (!confirmed) return;
    try {
      setCanceling(true);
      await cancel();
      toast.success("Cancelamento agendado para o final do período.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a subscrição.");
    } finally {
      setCanceling(false);
    }
  };

  const statusLabel = isAdministrativePlan
    ? "Atribuído pela Silentra"
    : subscription?.cancel_at_period_end
      ? "Cancelamento agendado"
      : isTrial
        ? "Trial ativo"
        : subscription?.status === "active"
          ? "Subscrição ativa"
          : plan === PLANS.FREE
            ? "Plano gratuito"
            : "A sincronizar";

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-zinc-900/75 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.2)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200"><ShieldCheck className="size-3.5" /> Billing</span>
              {isTrial ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200"><Sparkles className="size-3.5" /> 14 dias de trial</span> : null}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white">{PLAN_NAMES[plan]}</h2>
            <p className="mt-2 text-sm text-zinc-400">{isAdministrativePlan ? "Plano atribuído à barbearia pela administração da Silentra." : "A subscrição e os pagamentos estão ligados à conta da tua barbearia na Stripe."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Preço</p><p className="mt-2 text-sm font-semibold text-zinc-100">{PLAN_PRICE[plan]}</p></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Estado</p><p className="mt-2 text-sm font-semibold text-zinc-100">{statusLabel}</p></div>
            <div className="col-span-2 rounded-2xl border border-white/8 bg-black/20 p-4 sm:col-span-1"><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Renovação</p><p className="mt-2 text-sm font-semibold text-zinc-100">{isAdministrativePlan ? "—" : renewalDate}</p></div>
          </div>
        </div>

        {!isAdministrativePlan && subscription?.cancel_at_period_end ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-sm text-amber-100"><CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-300" /><p>A subscrição será cancelada no final do período atual. O acesso mantém-se até {renewalDate}.</p></div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"><CircleDollarSign className="size-5 text-emerald-300" /><h3 className="mt-4 text-sm font-semibold text-white">Resumo da subscrição</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Plano, estado e data de renovação da barbearia.</p></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"><FileText className="size-5 text-emerald-300" /><h3 className="mt-4 text-sm font-semibold text-white">Recibos</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Consulta e descarrega os recibos emitidos pela Stripe.</p></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"><Sparkles className="size-5 text-emerald-300" /><h3 className="mt-4 text-sm font-semibold text-white">Comparar planos</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Explora funcionalidades e muda de plano através do fluxo comercial.</p><Link href="/plans" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-xs font-semibold text-zinc-100 hover:bg-white/[0.06]">Comparar planos</Link></article>
      </section>

      {!isAdministrativePlan && subscription?.stripe_subscription_id && !subscription.cancel_at_period_end ? (
        <section className="rounded-2xl border border-red-400/15 bg-red-400/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-sm font-semibold text-white">Cancelar subscrição</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Cancela apenas no final do período atual. Não perdes acesso imediatamente.</p></div>
            <button type="button" onClick={() => void handleCancel()} disabled={loading || canceling} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-300/[0.04] px-4 text-sm font-semibold text-red-100 transition hover:bg-red-300/[0.08] disabled:cursor-wait disabled:opacity-50"><XCircle className="size-4" />{canceling ? "A cancelar…" : "Cancelar subscrição"}</button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/55 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Recibos</p><h3 className="mt-1 text-xl font-semibold tracking-tight text-white">Histórico de faturação</h3></div><p className="text-xs text-zinc-600">Dados fornecidos pela Stripe</p></div>
        <div className="mt-5 overflow-hidden rounded-xl border border-white/8">
          {loadingInvoices ? <div className="p-6 text-sm text-zinc-500">A carregar recibos…</div> : invoices.length === 0 ? <div className="p-6 text-sm leading-6 text-zinc-500">Ainda não existem recibos para esta conta.</div> : <div className="divide-y divide-white/8">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-zinc-100">{invoice.date}</p><p className="mt-1 text-xs text-zinc-500">{(invoice.amount / 100).toLocaleString("pt-PT", { style: "currency", currency: invoice.currency })} · {invoice.status ?? "—"}</p></div><div className="flex flex-wrap gap-2">{invoice.hosted_invoice_url ? <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-zinc-200 hover:bg-white/[0.06]">Abrir recibo</a> : null}{invoice.invoice_pdf ? <a href={invoice.invoice_pdf} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-zinc-950 hover:bg-zinc-200">Descarregar PDF</a> : null}</div></div>)}</div>}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-zinc-600">Os recibos são gerados e mantidos pela Stripe. A Silentra apenas apresenta os links disponíveis para esta conta.</p>
      </section>
    </div>
  );
}
