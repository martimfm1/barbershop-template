"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, CreditCard, Loader2, RefreshCw, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useBillingPortal, type BillingPrice } from "@/hooks/useBillingPortal";
import { InvoiceHistoryTable } from "@/components/billing/InvoiceHistoryTable";
import { UpdatePaymentMethodModal } from "@/components/billing/UpdatePaymentMethodModal";
import { CompleteSubscriptionModal } from "@/components/billing/CompleteSubscriptionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FEATURE_LABELS, PLAN_DESCRIPTIONS, PLAN_FEATURES, PLAN_NAMES } from "@/lib/billing/plan-features";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PLANS } from "@/lib/stripe/constants";

export function CustomBillingPortal() {
  const { subscription, plan, planSource, isAdministrativePlan, loading: subscriptionLoading, cancel, resume } = useSubscription();
  const billing = useBillingPortal(subscription);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionSecret, setSubscriptionSecret] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const primaryCard = billing.paymentMethods.find((method) => method.isDefault) ?? billing.paymentMethods[0];
  const currentPlan = plan;
  const hasActiveSubscription = Boolean(
    (currentPlan === PLANS.PRO || currentPlan === PLANS.ENTERPRISE) &&
    (isAdministrativePlan || Boolean(subscription && (subscription.status === "active" || subscription.status === "trialing"))),
  );
  const formatPrice = (price: BillingPrice) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: price.currency }).format(price.unitAmount / 100);

  const createCardSetup = async () => {
    try { setClientSecret(null); setModalOpen(true); const { clientSecret } = await billing.createSetupIntent(); setClientSecret(clientSecret); }
    catch (error) { setModalOpen(false); toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a atualização do cartão."); }
  };
  const onCardComplete = async (paymentMethodId: string) => {
    try { await billing.setDefaultPaymentMethod(paymentMethodId); await billing.refreshPaymentMethods(); setModalOpen(false); toast.success("Método de pagamento atualizado."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível definir o cartão."); }
  };
  const changePlan = async (priceId?: string) => {
    if (!priceId) return toast.error("Este plano ainda não está configurado.");
    if (isAdministrativePlan) return toast.error("Este plano foi atribuído pela administração da Silentra.");
    try {
      if (!hasActiveSubscription) {
        setSubscriptionSecret(null); setSubscriptionModalOpen(true);
        const result = await billing.createSubscription(priceId);
        setSubscriptionSecret(result.clientSecret);
        return;
      }
      await billing.changePlan(priceId); toast.success("Plano atualizado. A faturação proporcional foi aplicada.");
    } catch (error) { setSubscriptionModalOpen(false); toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o plano."); }
  };
  const removeCard = async (id: string) => { try { await billing.removePaymentMethod(id); toast.success("Cartão removido."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível remover o cartão."); } };
  const cancelSubscription = async () => { if (isAdministrativePlan) return toast.error("O plano atribuído pela Silentra não é gerido por Stripe."); try { await cancel(); toast.success("A subscrição será cancelada no fim do período atual."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a subscrição."); } };
  const resumeSubscription = async () => { try { await resume(); toast.success("Cancelamento removido. A subscrição continuará ativa."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível retomar a subscrição."); } };

  if (subscriptionLoading) return <div className="space-y-5"><Skeleton className="h-44 w-full bg-white/5" /><Skeleton className="h-72 w-full bg-white/5" /></div>;
  return <div className="space-y-6">
    <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-emerald-400">Subscrição atual</p>
          <h2 className="mt-3 text-3xl font-bold text-zinc-50">{PLAN_NAMES[currentPlan]}</h2>
          <p className="mt-2 text-sm text-zinc-400">{isAdministrativePlan ? "Plano atribuído pela administração da Silentra" : subscription?.cancel_at_period_end ? "Cancelamento agendado" : hasActiveSubscription ? "Subscrição ativa" : "Plano gratuito"}</p>
          {isAdministrativePlan && <p className="mt-1 text-xs text-sky-300">Este plano aplica-se a todos os membros desta barbearia.</p>}
          <p className="mt-1 text-[11px] text-zinc-600">Origem: {planSource === "admin" ? "Administração Silentra" : planSource === "subscription_override" ? "Override da subscrição" : planSource === "stripe" ? "Stripe" : "Plano gratuito"}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"><span className="block text-xs text-zinc-500">Próxima renovação</span><span className="mt-1 block font-medium text-zinc-100">{isAdministrativePlan ? "Gerido pela Silentra" : subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</span></div>
          <Link href="/plans" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10">Ver comparação completa <ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><CreditCard className="size-5" /></div><div><h3 className="font-semibold text-zinc-100">Método de pagamento</h3><p className="text-sm text-zinc-500">{primaryCard ? `${primaryCard.brand.toUpperCase()} •••• ${primaryCard.last4} · expira ${primaryCard.expMonth}/${primaryCard.expYear}` : "Sem cartão guardado"}</p></div></div><button onClick={createCardSetup} disabled={!subscription || isAdministrativePlan || billing.loading} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">Adicionar cartão</button></div>{billing.paymentMethods.length > 0 && <div className="mt-5 space-y-2 border-t border-white/10 pt-4">{billing.paymentMethods.map((method) => <div key={method.id} className="flex items-center justify-between rounded-xl bg-white/[.03] px-3 py-2 text-xs text-zinc-300"><span>{method.brand.toUpperCase()} •••• {method.last4} {method.isDefault && <em className="ml-2 not-italic text-emerald-400">Predefinido</em>}</span><span className="flex items-center gap-3">{!method.isDefault && <button onClick={() => billing.setDefaultPaymentMethod(method.id)} className="text-emerald-400">Usar</button>}<button aria-label={`Remover cartão terminado em ${method.last4}`} onClick={() => removeCard(method.id)} className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="size-3.5" /></button></span></div>)}</div>}</section>

    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><RefreshCw className="size-5" /></div><div><h3 className="font-semibold text-zinc-100">Escolher plano</h3><p className="text-sm text-zinc-500">{isAdministrativePlan ? "O plano atual foi atribuído pela administração da Silentra." : "Começa grátis e faz upgrade quando precisares de mais ferramentas."}</p></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className={`rounded-2xl border p-5 ${currentPlan === PLANS.FREE ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-zinc-950/40"}`}><div className="flex justify-between gap-3"><div><h4 className="font-medium text-zinc-100">{PLAN_NAMES[PLANS.FREE]}</h4><p className="mt-1 text-xs text-zinc-500">{PLAN_DESCRIPTIONS.free}</p></div><span className="shrink-0 font-semibold text-zinc-100">0 €<small className="font-normal text-zinc-500">/mês</small></span></div><ul className="mt-5 space-y-2 border-t border-white/10 pt-4">{PLAN_FEATURES.free.slice(0, 6).map((feature) => <li key={feature} className="flex items-start gap-2 text-xs text-zinc-300"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />{FEATURE_LABELS[feature]}</li>)}</ul><button disabled={currentPlan === PLANS.FREE || billing.isChangingPlan || isAdministrativePlan} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 disabled:cursor-default disabled:opacity-50">{currentPlan === PLANS.FREE ? <><Check className="size-3.5 text-emerald-400" />Plano atual</> : "Plano gratuito"}</button></div>
        {([PLANS.PRO, PLANS.ENTERPRISE] as const).map((tier) => { const pricedPlan = billing.prices.find((item) => item.plan === tier && item.interval === billingCycle); if (!pricedPlan) return null; const current = currentPlan === tier; const name = tier === PLANS.ENTERPRISE ? "Barbers Enterprise" : "Barbers Pro"; return <div key={tier} className={`rounded-2xl border p-5 ${current ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-zinc-950/40"}`}><div className="flex justify-between gap-3"><div><h4 className="font-medium text-zinc-100">{name}</h4><p className="mt-1 text-xs text-zinc-500">{PLAN_DESCRIPTIONS[tier]} · Cobrança {billingCycle === "year" ? "anual" : "mensal"}</p></div><span className="shrink-0 font-semibold text-zinc-100">{formatPrice(pricedPlan)}<small className="font-normal text-zinc-500">/{billingCycle === "year" ? "ano" : "mês"}</small></span></div><ul className="mt-5 space-y-2 border-t border-white/10 pt-4">{PLAN_FEATURES[tier].slice(0, 6).map((feature) => <li key={feature} className="flex items-start gap-2 text-xs text-zinc-300"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />{FEATURE_LABELS[feature]}</li>)}</ul><button disabled={current || billing.isChangingPlan || isAdministrativePlan} onClick={() => changePlan(pricedPlan.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 disabled:cursor-default disabled:opacity-50">{billing.isChangingPlan && <Loader2 className="size-3.5 animate-spin" />}{current ? <><Check className="size-3.5 text-emerald-400" />Plano atual</> : isAdministrativePlan ? "Gerido pela Silentra" : hasActiveSubscription ? "Mudar para este plano" : "Continuar para pagamento"}</button></div>; })}
      </div>
      <div className="mt-5 flex justify-end"><div className="rounded-full border border-white/10 bg-zinc-950 p-1 text-xs"><button onClick={() => setBillingCycle("month")} className={`rounded-full px-3 py-1.5 ${billingCycle === "month" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400"}`}>Mensal</button><button onClick={() => setBillingCycle("year")} className={`rounded-full px-3 py-1.5 ${billingCycle === "year" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400"}`}>Anual</button></div></div>
    </section>

    <PlanComparison />

    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><WalletCards className="size-5" /></div><div><h3 className="font-semibold text-zinc-100">Histórico de faturas</h3><p className="text-sm text-zinc-500">As últimas 12 faturas e recibos.</p></div></div><InvoiceHistoryTable invoices={billing.invoices} loading={billing.loading} /></section>

    {subscription?.cancel_at_period_end && hasActiveSubscription && <section className="flex flex-col gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/[.04] p-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-zinc-100">Cancelamento agendado</h3><p className="mt-1 text-sm text-zinc-400">A subscrição termina no fim do período atual. Podes retomar a subscrição sem sair do Silentra.</p></div><button onClick={resumeSubscription} disabled={subscriptionLoading} className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/15 disabled:opacity-50"><RefreshCw className="size-4" />Retomar subscrição</button></section>}

    {!isAdministrativePlan && hasActiveSubscription && !subscription?.cancel_at_period_end && <section className="flex flex-col gap-4 rounded-3xl border border-red-500/20 bg-red-500/[.04] p-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-zinc-100">Cancelar subscrição</h3><p className="mt-1 text-sm text-zinc-400">Manterás o acesso até ao fim do período que já foi pago.</p></div><AlertDialog><AlertDialogTrigger asChild><button className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10">Cancelar subscrição</button></AlertDialogTrigger><AlertDialogContent className="border border-white/10 bg-zinc-900 text-zinc-100"><AlertDialogHeader><AlertDialogTitle>Cancelar subscrição?</AlertDialogTitle><AlertDialogDescription>O acesso mantém-se até ao fim do período atual. Não haverá novas cobranças.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Manter subscrição</AlertDialogCancel><AlertDialogAction onClick={cancelSubscription} className="bg-red-500 text-white hover:bg-red-400">Confirmar cancelamento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section>}
    {subscription?.cancel_at_period_end && <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200"><AlertTriangle className="mr-2 inline size-4" />A subscrição está agendada para cancelamento no final do período atual.</p>}
    <UpdatePaymentMethodModal open={modalOpen} onOpenChange={setModalOpen} clientSecret={clientSecret} onComplete={onCardComplete} />
    <CompleteSubscriptionModal open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} clientSecret={subscriptionSecret} onPaid={async () => { await new Promise((resolve) => setTimeout(resolve, 800)); setSubscriptionModalOpen(false); await window.location.reload(); }} />
  </div>;
}
