import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from './subscription.service';
import { PLANS } from '@/lib/stripe/constants';
import type { BillingPlan } from '@/types/stripe';

/**
 * Resolves the plan that grants access for the authenticated request.
 * Only active/trialing paid subscriptions grant Pro/Enterprise.
 * Checkout-in-progress, incomplete, past_due, canceled, or unpaid do not.
 */
export async function getAccessPlanForRequest(): Promise<
  { ok: true; userId: string; plan: BillingPlan } | { ok: false; status: 401 }
> {
  const {
    data: { user },
    error,
  } = await (await createClient()).auth.getUser();
  if (error || !user) return { ok: false, status: 401 };

  // Free is implicit and never requires Stripe.
  const plan = await SubscriptionService.getAccessPlan(user.id);
  return { ok: true, userId: user.id, plan };
}

/** Returns the plan for a given user without requiring a request context. */
export async function resolveAccessPlanForUser(
  userId: string,
): Promise<BillingPlan> {
  return SubscriptionService.getAccessPlan(userId);
}

export function requirePaidPlan(
  plan: BillingPlan,
): asserts plan is 'pro' | 'enterprise' {
  if (plan === PLANS.FREE) {
    throw new Error('Este recurso requer um plano pago ativo.');
  }
}
