"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Check, Sparkles, Loader2, ArrowRight, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export type PlanTier = "free" | "pro" | "business";

export interface PricingCardProps {
  tier: PlanTier;
  title: string;
  price: string;
  priceId?: string;
  description: string;
  features: readonly string[];
  popular?: boolean;
  trialDays?: number;
  onCheckout?: (priceId: string) => void;
  onManagePortal?: () => void;
}

export function PricingCard({
  tier,
  title,
  price,
  priceId,
  description,
  features,
  popular = false,
  trialDays,
  onCheckout,
  onManagePortal,
}: PricingCardProps) {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const {
    subscription,
    isAuthenticated,
    plan: currentPriceId,
    loading,
    checkout,
    upgrade,
  } = useSubscription();

  // Determine current active plan state
  const isCurrentPlan = useMemo(() => {
    if (tier === "free" && (!subscription || subscription.status === "canceled")) {
      return true;
    }
    if (tier === "pro" && priceId && currentPriceId === priceId) {
      return true;
    }
    if (tier === "business" && priceId && currentPriceId === priceId) {
      return true;
    }
    return false;
  }, [tier, subscription, currentPriceId, priceId]);

  // Handle CTA button click
  const handleAction = async () => {
    try {
      if (!isMounted) return;

      if (tier === "free" && !isAuthenticated) {
        window.location.assign("/registo");
        return;
      }

      if (isCurrentPlan) return;

      if (!isAuthenticated) {
        window.location.assign("/registo");
        return;
      }

      if (subscription?.status === "active") {
        if (onManagePortal) {
          onManagePortal();
        } else {
          await upgrade();
        }
        return;
      }

      if (!priceId) {
        window.location.assign("/dashboard/billing");
        return;
      }

      if (priceId) {
        if (onCheckout) {
          onCheckout(priceId);
        } else {
          await checkout({ priceId });
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o plano.",
      );
    }
  };

  // Determine CTA label & disabled state
  const buttonConfig = useMemo(() => {
    // Keep SSR and the browser's first render identical. Auth/query state is only
    // allowed to change the CTA after hydration has completed.
    if (!isMounted) {
      return {
        label: "A carregar…",
        disabled: true,
        variant: popular ? ("primary" as const) : ("outline" as const),
      };
    }

    if (tier === "free" && !isAuthenticated) {
      return {
        label: "Começar gratuitamente",
        disabled: false,
        variant: "outline" as const,
      };
    }

    if (isCurrentPlan) {
      return {
        label: "Plano Atual",
        disabled: true,
        variant: "secondary" as const,
      };
    }

    if (!isAuthenticated) {
      return {
        label: "Criar conta para começar",
        disabled: false,
        variant: popular ? ("primary" as const) : ("outline" as const),
      };
    }

    if (subscription?.status === "active") {
      return {
        label: tier === "free" ? "Gerir Subscrição" : "Alterar Plano",
        disabled: false,
        variant: "outline" as const,
      };
    }

    if (!priceId) {
      return {
        label: "Ver modalidades",
        disabled: false,
        variant: popular ? ("primary" as const) : ("outline" as const),
      };
    }

    if (trialDays && trialDays > 0) {
      return {
        label: priceId ? `Iniciar Teste Grátis (${trialDays} dias)` : "Plano indisponível",
        disabled: !priceId,
        variant: "primary" as const,
      };
    }

    return {
      label: tier === "free" ? "Plano Base" : priceId ? "Subscrever Plano" : "Plano indisponível",
      disabled: tier === "free" || !priceId,
      variant: popular ? ("primary" as const) : ("outline" as const),
    };
  }, [isMounted, isCurrentPlan, isAuthenticated, priceId, subscription, trialDays, popular, tier]);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 backdrop-blur-xl sm:p-8 ${
        popular
          ? "border-emerald-500/30 bg-zinc-900/90 shadow-[0_20px_80px_rgba(16,185,129,0.12)]"
          : "border-white/10 bg-zinc-900/60 shadow-[0_20px_80px_rgba(0,0,0,0.35)] hover:border-white/20"
      }`}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300 backdrop-blur-xl">
            <Sparkles className="size-3.5" />
            Mais Popular
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-50">{title}</h3>
          {isCurrentPlan && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">
              <Shield className="size-3" /> Ativo
            </span>
          )}
        </div>

        <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight text-zinc-50">
            {price}
          </span>
          {tier !== "free" && (
            <span className="text-xs text-zinc-400">/mês</span>
          )}
        </div>

        <div className="mt-8 space-y-3.5 border-t border-white/8 pt-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
            O que está incluído
          </p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Check className="size-3" />
                </div>
                <span className="text-xs text-zinc-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-4">
        <button
          type="button"
          onClick={handleAction}
          disabled={buttonConfig.disabled || loading}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            buttonConfig.variant === "primary"
              ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              : buttonConfig.variant === "secondary"
              ? "border border-white/10 bg-white/5 text-zinc-400"
              : "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 hover:border-white/25"
          }`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span>{buttonConfig.label}</span>
              {!buttonConfig.disabled && <ArrowRight className="size-3.5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
