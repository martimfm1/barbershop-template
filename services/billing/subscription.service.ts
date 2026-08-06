import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForPrice, PLANS } from "@/lib/stripe/constants";
import { BillingError, type SubscriptionRecord } from "@/types/stripe";

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

    const row: SubscriptionRow = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: planForPrice(priceId) ?? PLANS.FREE,
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
      .update({ status: "canceled", cancel_at_period_end: false })
      .eq("user_id", userId);

    if (error) throw new BillingError("Could not mark subscription as canceled.", "DB_WRITE_FAILED", { userId });
  }
}
