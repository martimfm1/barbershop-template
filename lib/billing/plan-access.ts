import { PLANS } from '@/lib/stripe/constants';
import type { BillingPlan } from '@/types/stripe';

/**
 * Shared source of truth for plan access.
 *
 * Free is implicit: any authenticated user without a valid paid subscription
 * is on the Free plan. Pro/Enterprise only count when Stripe reports the
 * subscription as active or trialing. A checkout that was started but not
 * confirmed (incomplete, past_due, canceled, unpaid) never grants access.
 */
export const PAID_PLANS: readonly BillingPlan[] = [PLANS.PRO, PLANS.ENTERPRISE];

/** Stripe statuses that grant access to a paid plan. */
export const PLAN_ACCESS_STATUSES = ['active', 'trialing'] as const;

export interface PlanRecord {
  plan: BillingPlan | null | undefined;
  status: string | null | undefined;
}

export function isPaidPlan(plan: BillingPlan | null | undefined): boolean {
  return plan === PLANS.PRO || plan === PLANS.ENTERPRISE;
}

export function hasActivePaidSubscription(
  subscription: PlanRecord | null | undefined,
): subscription is PlanRecord & { plan: BillingPlan } {
  return Boolean(
    subscription &&
    isPaidPlan(subscription.plan) &&
    (PLAN_ACCESS_STATUSES as readonly string[]).includes(
      subscription.status ?? '',
    ),
  );
}

/** Resolves the effective plan from the persisted subscription state. */
export function resolvePlan(
  subscription: PlanRecord | null | undefined,
): BillingPlan {
  return hasActivePaidSubscription(subscription)
    ? subscription.plan
    : PLANS.FREE;
}
