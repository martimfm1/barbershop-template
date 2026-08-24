import { PLANS, type BillingPlan } from '@/lib/stripe/constants';
import {
  getPlanLimit,
  hasPlanFeature,
  isUnlimited,
  type FeatureKey,
  type PlanLimitKey,
} from '@/lib/billing/plan-features';

export class EntitlementError extends Error {
  readonly code: 'FEATURE_NOT_INCLUDED' | 'LIMIT_REACHED';
  readonly status = 403;

  constructor(code: 'FEATURE_NOT_INCLUDED' | 'LIMIT_REACHED', message: string) {
    super(message);
    this.name = 'EntitlementError';
    this.code = code;
  }
}

export function canUseFeature(plan: BillingPlan, feature: FeatureKey): boolean {
  return hasPlanFeature(plan, feature);
}

export function assertFeature(plan: BillingPlan, feature: FeatureKey): void {
  if (!canUseFeature(plan, feature)) {
    throw new EntitlementError(
      'FEATURE_NOT_INCLUDED',
      `The ${feature} feature is not included in the ${plan} plan.`,
    );
  }
}

export function getLimit(plan: BillingPlan, limit: PlanLimitKey): number {
  return getPlanLimit(plan, limit);
}

export function assertWithinLimit(
  plan: BillingPlan,
  limit: PlanLimitKey,
  currentCount: number,
  increment = 1,
): void {
  const maximum = getLimit(plan, limit);
  if (isUnlimited(maximum)) return;

  if (currentCount + increment > maximum) {
    throw new EntitlementError(
      'LIMIT_REACHED',
      `The ${plan} plan allows up to ${maximum} ${limit}.`,
    );
  }
}

export function isPaidPlan(plan: BillingPlan): boolean {
  return plan === PLANS.PRO || plan === PLANS.ENTERPRISE;
}
