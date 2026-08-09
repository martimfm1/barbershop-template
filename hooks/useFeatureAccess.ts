"use client";

import { useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_FEATURES, type FeatureKey } from "@/lib/billing/plan-features";
import type { BillingPlan } from "@/types/stripe";

/**
 * Frontend feature access helper. Reuses useSubscription (server-resolved plan).
 * UI-only — the backend remains the source of truth for enforcement.
 */
export function useFeatureAccess() {
  const { plan, isPro, isBusiness, isTrial, loading, isAuthenticated } = useSubscription();

  const hasFeature = useMemo(() => {
    return (feature: FeatureKey): boolean => {
      return PLAN_FEATURES[plan as BillingPlan].includes(feature);
    };
  }, [plan]);

  const features = useMemo(() => PLAN_FEATURES[plan as BillingPlan], [plan]);

  return {
    plan: plan as BillingPlan,
    isPro,
    isBusiness,
    isTrial,
    loading,
    isAuthenticated,
    hasFeature,
    features,
  };
}