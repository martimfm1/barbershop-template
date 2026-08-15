"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, Sparkles, Loader2, ArrowRight, Shield, Gift, TicketPercent } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export type PlanTier = "free" | "pro" | "enterprise";

export interface PricingCardProps {
  tier: PlanTier;
  title: string;
  price: string;
  priceId?: string;
  description: string;
  features: readonly string[];
  popular?: boolean;
  trialDays?: number;
  onCheckout?: (priceId: string, promotionCode?: string) => void;
  onManagePortal?: () => void;
}

export function PricingCard({ tier, title, price, priceId, description, features, popular = false, trialDays, onCheckout, onManagePortal }: PricingCardProps) {
  const isMounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const { subscription, isAuthenticated, plan: currentPlan, loading, checkout, upgrade } = useSubscription();
  const [promotionCode, setPromotionCode] = useState("");
  const isCurrentPlan = useMemo(() => isAuthenticated && currentPlan === tier, [currentPlan, isAuthenticated, tier]);

  const handleAction = async () => {
    try {
      if (!isMounted) return;
      if (!isAuthenticated) { window.location.assign("/registo"); return; }
      if (isCurrentPlan) return;
      if (subscription?.status === "active") { if (onManagePortal) onManagePortal(); else await upgrade(); return; }
      if (tier === "free" || !priceId) { window.location.assign("/dashboard/billing"); return; }
      const code = promotionCode.trim() || undefined;
      if (onCheckout) onCheckout(priceId, code);
      else await checkout({ priceId, promotionCode: code });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o plano.");
    }
  };

  const buttonConfig = useMemo(() => {
    if (!isMounted) return { label: "A carregar…", disabled: true, variant: popular ? ("primary" as const) : ("outline" as const) };
    if (!isAuthenticated) return { label: tier === "free" ? "Começar gratuitamente" : tier === "pro" && trialDays ? `Experimentar Pro ${trialDays} dias` : "Criar conta para começar", disabled: false, variant: popular ? ("primary" as const) : ("outline" as const) };
    if (isCurrentPlan) return { label: "Plano atual", disabled: true, variant: "secondary" as const };
    if (subscription?.status === "active") return { label: tier === "free" ? "Gerir subscrição" : "Alterar plano", disabled: false, variant: "outline" as const };
    return { label: tier === "free" ? "Usar Plano Gratuito" : tier === "pro" && trialDays ? `Experimentar Pro ${trialDays} dias` : "Começar com o Pro", disabled: false, variant: popular ? ("primary" as const) : ("outline" as const) };
  }, [isMounted, isCurrentPlan, isAuthenticated, subscription, popular, tier, trialDays]);

  const isActivePaidPlan = isCurrentPlan && (tier === "pro" || tier === "enterprise");
  const showPromotionCode = tier !== "free" && isAuthenticated && !isCurrentPlan;

  return (
    <div className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-[border-color,background-color,box-shadow,transform] duration-200 sm:p-7 ${isActivePaidPlan ? "border-emerald-500/60 bg-zinc-900/95 shadow-[0_20px_70px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30" : popular ? "-translate-y-1 border-emerald-500/40 bg-zinc-900/95 shadow-[0_24px_80px_rgba(16,185,129,0.14)] ring-1 ring-emerald-500/10" : "border-white/10 bg-zinc-900/70 shadow-[0_18px_60px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:border-white/20"}`}>
      {popular && <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400" aria-hidden="true" />}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h3>
              {popular && <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300"><Sparkles className="size-3" /> Recomendado</span>}
              {tier === "pro" && trialDays ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200"><Gift className="size-3" /> {trialDays} dias grátis</span> : null}
            </div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{description}</p>
          </div>
          {isCurrentPlan && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"><Shield className="size-3" /> Ativo</span>}
        </div>

        <div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-semibold tracking-tight text-zinc-50">{price}</span>{tier !== "free" && <span className="text-xs text-zinc-500">/mês</span>}</div>
        {tier === "pro" && trialDays ? <p className="mt-2 text-xs font-semibold text-emerald-300/90">Experimenta todas as funcionalidades Pro durante {trialDays} dias.</p> : null}
        {tier === "pro" && !trialDays ? <p className="mt-2 text-xs font-medium text-emerald-300/90">Para crescer sem aumentar a complexidade.</p> : null}
        {tier === "free" && <p className="mt-2 text-xs text-zinc-500">Sem cartão. Começa hoje e atualiza quando precisares.</p>}
        {tier === "enterprise" && <p className="mt-2 text-xs text-zinc-500">Para equipas e operações com várias localizações.</p>}

        <div className="mt-7 space-y-3 border-t border-white/8 pt-6"><p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Inclui</p><ul className="space-y-3">{features.map((feature) => <li key={feature} className="flex items-start gap-3"><div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><Check className="size-3" /></div><span className="text-sm leading-5 text-zinc-300">{feature}</span></li>)}</ul></div>
      </div>

      <div className="mt-8 border-t border-white/8 pt-5">
        {showPromotionCode ? (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <label htmlFor={`promotion-code-${tier}`} className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400"><TicketPercent className="size-3.5 text-emerald-300" />Código promocional</label>
            <div className="flex gap-2">
              <input id={`promotion-code-${tier}`} value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.slice(0, 100))} maxLength={100} autoComplete="off" placeholder="Ex.: PRO10" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm uppercase tracking-[0.04em] text-zinc-100 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-600 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15" />
              <button type="button" onClick={() => setPromotionCode("")} disabled={!promotionCode} className="rounded-lg border border-white/10 px-3 text-xs font-medium text-zinc-400 hover:bg-white/5 disabled:opacity-40">Limpar</button>
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-zinc-600">O código será validado pela Stripe no checkout.</p>
          </div>
        ) : null}
        <button type="button" onClick={handleAction} disabled={buttonConfig.disabled || loading} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${buttonConfig.variant === "primary" ? "bg-emerald-400 text-zinc-950 shadow-[0_8px_24px_rgba(52,211,153,0.18)] hover:bg-emerald-300 hover:shadow-[0_10px_30px_rgba(52,211,153,0.24)]" : buttonConfig.variant === "secondary" ? "border border-white/10 bg-white/5 text-zinc-400" : "border border-white/15 bg-white/[0.04] text-zinc-100 hover:border-white/25 hover:bg-white/[0.08]"}`}>{loading ? <Loader2 className="size-4 animate-spin" /> : <><span>{buttonConfig.label}</span>{!buttonConfig.disabled && <ArrowRight className="size-4" />}</>}</button>{tier === "pro" && !isCurrentPlan ? <p className="mt-2 text-center text-[11px] text-zinc-600">14 dias grátis para novos utilizadores. A primeira cobrança ocorre depois do trial.</p> : null}</div>
    </div>
  );
}
