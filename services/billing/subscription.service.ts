import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForPrice, PLANS } from "@/lib/stripe/constants";
import { PLAN_ACCESS_STATUSES, resolvePlan } from "@/lib/billing/plan-access";
import { BillingError, type BillingPlan, type SubscriptionRecord } from "@/types/stripe";

type SubscriptionRow = Pick<
  SubscriptionRecord,
  "user_id" | "stripe_customer_id" | "stripe_subscription_id" | "stripe_price_id" | "plan" | "status" | "trial_end" | "current_period_end" | "cancel_at_period_end"
>;

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

export class SubscriptionService {
  static async getForUser(userId: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await createAdminClient()
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new BillingError("Could not load subscription.", "DB_READ_FAILED", { userId });
    return data as SubscriptionRecord | null;
  }

  static async getActiveForUser(userId: string): Promise<SubscriptionRecord | null> {
    const subscription = await this.getForUser(userId);
    return subscription && ["active", "trialing", "past_due"].includes(subscription.status)
      ? subscription
      : null;
  }

  /**
   * Resolves the plan that actually grants access to the user.
   * A subscription that is incomplete, past_due, canceled, or unpaid
   * does not grant Pro/Enterprise access — the user falls back to Free.
   */
  static async getAccessPlan(userId: string): Promise<BillingPlan> {
    const subscription = await this.getForUser(userId);
    return resolvePlan(subscription);
  }

  static async findUserIdByCustomerId(stripeCustomerId: string): Promise<string | null> {
    const { data, error } = await createAdminClient()
      .from("customers")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (error) throw new BillingError("Could not resolve Stripe customer.", "DB_READ_FAILED", { stripeCustomerId });
    return data?.user_id ?? null;
  }

  static async syncFromStripe(userId: string, subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscriptionPeriodEnd(subscription);

    if (!priceId || !periodEnd) {
      throw new BillingError("Stripe subscription is missing a recurring price or period end.", "WEBHOOK_PROCESSING_FAILED", {
        subscriptionId: subscription.id,
      });
    }

    // Only access-granting statuses carry a paid plan. Any other status
    // (incomplete, past_due, canceled, unpaid, paused) resolves to Free.
    const plan =
      (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status)
        ? planForPrice(priceId) ?? PLANS.FREE
        : PLANS.FREE;

    const row: SubscriptionRow = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    const { error } = await createAdminClient()
      .from("subscriptions")
      .upsert(row, { onConflict: "user_id" });

    if (error) throw new BillingError("Could not persist subscription state.", "DB_WRITE_FAILED", { userId, subscriptionId: subscription.id });
  }

  /** Marks the subscription canceled and revokes paid access (falls back to Free). */
  static async markCanceled(userId: string): Promise<void> {
    const { error } = await createAdminClient()
      .from("subscriptions")
      .update({ status: "canceled", plan: PLANS.FREE, cancel_at_period_end: false })
      .eq("user_id", userId);

    if (error) throw new BillingError("Could not mark subscription as canceled.", "DB_WRITE_FAILED", { userId });
  }

  /** Revokes paid access and returns the user to the Free plan. */
  static async revokePaidAccess(userId: string, status: SubscriptionRecord["status"]): Promise<void> {
    const { error } = await createAdminClient()
      .from("subscriptions")
      .update({ status, plan: PLANS.FREE, cancel_at_period_end: false })
      .eq("user_id", userId);

    if (error) throw new BillingError("Could not revoke paid access.", "DB_WRITE_FAILED", { userId });
  }
}
