'use client';

import { useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  PLAN_FEATURES,
  hasPlanFeature,
  type FeatureKey,
} from '@/lib/billing/plan-features';
import type { BillingPlan } from '@/types/stripe';

/**
 * Frontend feature access helper. Reuses useSubscription (server-resolved plan).
 * UI-only — the backend remains the source of truth for enforcement.
 */
export function useFeatureAccess() {
  const { plan, isPro, isBusiness, isTrial, loading, isAuthenticated } =
    useSubscription();
  const resolvedPlan = plan as BillingPlan;

  const hasFeature = useMemo(() => {
    return (feature: FeatureKey): boolean =>
      hasPlanFeature(resolvedPlan, feature);
  }, [resolvedPlan]);

  const features = useMemo(() => PLAN_FEATURES[resolvedPlan], [resolvedPlan]);

  return {
    plan: resolvedPlan,
    isPro,
    isBusiness,
    isTrial,
    loading,
    isAuthenticated,
    hasFeature,
    features,
  };
}
