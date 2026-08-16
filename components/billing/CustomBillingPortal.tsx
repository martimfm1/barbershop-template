"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, Loader2, ShieldCheck, Sparkles, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS } from "@/lib/stripe/constants";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  plan: string;
  date: string;
  invoice_pdf: string | null;
};

export function CustomBillingPortal() {
  const { subscription, plan, planSource, isAdministrativePlan, isTrial, loading, cancel, resume } = useSubscription();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id);
  const isPaid = plan === PLANS.PRO || plan === PLANS.ENTERPRISE;
  const isCanceledAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);
  const canCancel = hasStripeSubscription && isPaid && !isAdministrativePlan && subscription?.status !== "canceled";

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      setInvoiceLoading(true);
      try {
        const response = await fetch("/api/stripe/invoices", { cache: "no-store" });
        const body = (await response.json().catch(() => ({}))) as { invoices?: Invoice[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar os recibos.");
        if (!cancelled) setInvoices(Array.isArray(body.invoices) ? body.invoices : []);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Não foi possível carregar os recibos.");
      } finally {
        if (!cancelled) setInvoiceLoading(false);
      }
    }

    void loadInvoices();
    return () => {
      cancelled = true;
    };
  }, [subscription?.stripe_subscription_id]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(amount / 100);

  const handleCancel = async () => {
    if (!canCancel || canceling) return;
    const confirmed = window.confirm("Cancelar a subscrição no final do período atual? Continuarás com acesso até à data de renovação.");
    if (!confirmed) return;
    try {
      setCanceling(true);
      await cancel();
      toast.success("Cancelamento agendado. O teu acesso mantém-se até ao fim do período atual.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a subscrição.");
    } finally {
      setCanceling(false);
    }
  };

  const handleResume = async () => {
    try {
      await resume();
      toast.success("A subscrição foi retomada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível retomar a subscrição.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.24)] sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <ShieldCheck className="size-3.5" /> Subscrição
              </span>
              {isAdministrativePlan && <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-200"><Sparkles className="size-3.5" /> Gerido pela Silentra</span>}
              {isTrial && <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200"><Zap className="size-3.5" /> Trial ativo</span>}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">{PLAN_NAMES[plan]}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {isAdministrativePlan ? "Este plano foi atribuído pela administração da Silentra e aplica-se a toda a barbearia." : hasStripeSubscription ? "A tua subscrição está sincronizada com a Stripe." : "Estás no plano gratuito."}
            </p>
          </div>
          <Link href="/plans" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-100 hover:bg-white/[0.07]">
            Comparar planos <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Estado</p><p className="mt-2 text-sm font-medium text-zinc-100">{isAdministrativePlan ? "Atribuído pela Silentra" : subscription?.cancel_at_period_end ? "Cancelamento agendado" : subscription?.status === "trialing" ? "Em trial" : hasStripeSubscription ? "Ativo" : "Gratuito"}</p></div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Próxima renovação</p><p className="mt-2 text-sm font-medium text-zinc-100">{isAdministrativePlan ? "Gerido pela Silentra" : formatDate(subscription?.current_period_end)}</p></div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Origem</p><p className="mt-2 text-sm font-medium text-zinc-100">{isAdministrativePlan ? "Administração Silentra" : planSource === "stripe" ? "Stripe" : planSource === "subscription_override" ? "Override da subscrição" : "Free"}</p></div>
        </div>
      </section>

      {canCancel && !isCanceledAtPeriodEnd && (
        <section className="rounded-2xl border border-red-500/15 bg-red-500/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Cancelar subscrição</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Manténs o acesso até ao fim do período já pago. Não há cancelamento imediato.</p>
            </div>
            <button type="button" onClick={() => void handleCancel()} disabled={loading || canceling} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 text-sm font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-60">
              {canceling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} {canceling ? "A cancelar…" : "Cancelar subscrição"}
            </button>
          </div>
        </section>
      )}

      {isCanceledAtPeriodEnd && hasStripeSubscription && !isAdministrativePlan && (
        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-zinc-100">Cancelamento agendado</p><p className="mt-1 text-sm leading-6 text-zinc-500">A subscrição termina em {formatDate(subscription?.current_period_end)}.</p></div>
            <button type="button" onClick={() => void handleResume()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] px-4 text-sm font-semibold text-amber-100 hover:bg-amber-400/10 disabled:opacity-60"><Check className="size-4" /> Retomar</button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Recibos</p><h3 className="mt-1 text-xl font-semibold text-white">Histórico de faturação</h3><p className="mt-1 text-sm text-zinc-500">Consulta e descarrega os recibos da tua subscrição.</p></div>
          <Link href="/plans" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-emerald-200">Comparar planos <ArrowRight className="size-4" /></Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
          {invoiceLoading ? <div className="flex min-h-28 items-center justify-center text-zinc-500"><Loader2 className="size-5 animate-spin" /></div> : invoices.length === 0 ? <div className="p-6 text-center text-sm text-zinc-500">Ainda não existem recibos disponíveis.</div> : <div className="divide-y divide-white/8">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-zinc-100">{invoice.plan}</p><p className="mt-1 text-xs text-zinc-500">{invoice.date} · {invoice.status ?? "Pendente"}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className="text-sm font-semibold text-zinc-200">{formatMoney(invoice.amount, invoice.currency)}</span>{invoice.invoice_pdf ? <a href={invoice.invoice_pdf} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/[0.05]"><Download className="size-3.5" /> Recibo</a> : <span className="text-xs text-zinc-600">Indisponível</span>}</div></div>)}</div>}
        </div>
      </section>
    </div>
  );
}
