import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
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

  /** Returns only a paid Stripe subscription that currently grants paid access. Free is implicit. */
  static async getActiveForUser(userId: string): Promise<SubscriptionRecord | null> {
    const subscription = await this.getForUser(userId);
    if (!subscription) return null;
    if (subscription.plan === PLANS.FREE) return null;
    return (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status)
      ? subscription
      : null;
  }

  /**
   * Resolves the effective plan from Stripe when a paid subscription exists.
   * This repairs stale plan values in the local subscription row instead of
   * incorrectly denying a user whose Stripe price grants Pro or Enterprise.
   */
  static async getAccessPlan(userId: string): Promise<BillingPlan> {
    const subscription = await this.getForUser(userId);
    if (!subscription) return PLANS.FREE;

    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await getStripeClient().subscriptions.retrieve(subscription.stripe_subscription_id);
        const stripePriceId = stripeSubscription.items.data[0]?.price.id;
        const stripePlan = stripePriceId ? planForPrice(stripePriceId) : undefined;
        const stripeStatusAllowsAccess = (PLAN_ACCESS_STATUSES as readonly string[]).includes(stripeSubscription.status);

        if (stripePlan && stripePlan !== PLANS.FREE && stripeStatusAllowsAccess) {
          if (subscription.plan !== stripePlan || subscription.stripe_price_id !== stripePriceId || subscription.status !== stripeSubscription.status) {
            const { error } = await createAdminClient()
              .from("subscriptions")
              .update({
                plan: stripePlan,
                stripe_price_id: stripePriceId,
                status: stripeSubscription.status,
                current_period_end: stripeSubscription.items.data[0]?.current_period_end
                  ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
                  : subscription.current_period_end,
                cancel_at_period_end: stripeSubscription.cancel_at_period_end,
              })
              .eq("user_id", userId);
            if (error) throw new BillingError("Could not reconcile subscription plan.", "DB_WRITE_FAILED", { userId });
          }
          return stripePlan;
        }

        if (!stripeStatusAllowsAccess) return PLANS.FREE;
      } catch (error) {
        if (error instanceof BillingError) throw error;
        // Fall back to the last known valid paid state if Stripe is temporarily unavailable.
      }
    }

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

  static async markCanceled(userId: string): Promise<void> {
    const { error } = await createAdminClient()
      .from("subscriptions")
      .update({ status: "canceled", plan: PLANS.FREE, cancel_at_period_end: false })
      .eq("user_id", userId);

    if (error) throw new BillingError("Could not mark subscription as canceled.", "DB_WRITE_FAILED", { userId });
  }

  static async revokePaidAccess(userId: string, status: SubscriptionRecord["status"]): Promise<void> {
    const { error } = await createAdminClient()
      .from("subscriptions")
      .update({ status, plan: PLANS.FREE, cancel_at_period_end: false })
      .eq("user_id", userId);

    if (error) throw new BillingError("Could not revoke paid access.", "DB_WRITE_FAILED", { userId });
  }
}
