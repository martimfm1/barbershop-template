"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { FeatureKey } from "@/lib/billing/plan-features";
import type { BillingPlan } from "@/types/stripe";

const PLAN_LABEL: Record<BillingPlan, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

/**
 * Only features that are genuinely unavailable on Free need a minimum-plan
 * override here. Team/professional management is available on every plan;
 * Free is limited by the professional quota (1), not by feature access.
 */
const FEATURE_MIN_PLAN: Partial<Record<FeatureKey, BillingPlan>> = {
  advanced_crm: "pro", advanced_analytics: "pro", automated_reminders: "pro", automated_followups: "pro",
  marketing_campaigns: "pro", customer_segments: "pro", loyalty: "pro", advanced_reports: "pro",
  advanced_notifications: "pro", analytics: "pro",
  multi_location: "enterprise", global_dashboard: "enterprise", advanced_permissions: "enterprise",
  commissions: "enterprise", inventory: "enterprise", pos: "enterprise", enterprise_reports: "enterprise",
};

export function useFeatureGate() {
  const router = useRouter();
  const { plan, hasFeature } = useFeatureAccess();
  const requestUpgrade = (feature: FeatureKey) => {
    if (hasFeature(feature)) return true;
    const requiredPlan = FEATURE_MIN_PLAN[feature] ?? "pro";
    toast(`Esta funcionalidade requer o plano ${PLAN_LABEL[requiredPlan]}.`, {
      description: "Faz upgrade para desbloquear esta funcionalidade.",
      action: { label: "Ver planos", onClick: () => router.push("/dashboard/billing") },
    });
    return false;
  };
  return { plan, hasFeature, requestUpgrade };
}

interface FeatureGateProps { feature: FeatureKey; children: ReactNode; fallback?: ReactNode; mode?: "hide" | "disable"; }
export function FeatureGate({ feature, children, fallback, mode = "hide" }: FeatureGateProps) {
  const { hasFeature, requestUpgrade } = useFeatureGate();
  if (hasFeature(feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  if (mode === "disable") return (
    <div role="button" tabIndex={0} aria-disabled="true" onClick={() => requestUpgrade(feature)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") requestUpgrade(feature); }} className="relative cursor-pointer opacity-55 grayscale transition-opacity hover:opacity-75">
      <div className="pointer-events-none">{children}</div>
      <div className="absolute right-3 top-3 rounded-full border bg-background/95 p-1.5 shadow-sm"><Lock className="size-3.5" /></div>
    </div>
  );
  return null;
}

export function UpgradeButton({ feature, children = "Fazer upgrade" }: { feature: FeatureKey; children?: ReactNode }) {
  const { requestUpgrade } = useFeatureGate();
  return <button type="button" onClick={() => requestUpgrade(feature)}>{children}</button>;
}
