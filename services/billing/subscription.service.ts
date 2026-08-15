import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { planForPrice, PLANS } from "@/lib/stripe/constants";
import { PLAN_ACCESS_STATUSES, resolvePlan } from "@/lib/billing/plan-access";
import { BillingError, type BillingPlan, type SubscriptionRecord } from "@/types/stripe";

type SubscriptionRow = Pick<SubscriptionRecord, "user_id" | "stripe_customer_id" | "stripe_subscription_id" | "stripe_price_id" | "plan" | "status" | "trial_end" | "current_period_end" | "cancel_at_period_end"> & {
  barbershop_id?: string | null;
};

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

export class SubscriptionService {
  static async getForUser(userId: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await createAdminClient().from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new BillingError("Could not load subscription.", "DB_READ_FAILED", { userId });
    return data as SubscriptionRecord | null;
  }

  static async getForBarbershop(barbershopId: string): Promise<SubscriptionRecord | null> {
    const admin = createAdminClient();
    const { data: owner, error: ownerError } = await admin
      .from("users")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .eq("role", "owner")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownerError) throw new BillingError("Could not resolve barbershop owner.", "DB_READ_FAILED", { barbershopId });
    if (!owner?.id) return null;

    const subscription = await this.getForUser(owner.id);
    if (!subscription) return null;

    // Keep the legacy service contract compatible for callers that inspect the
    // tenant association, while never querying a non-existent subscriptions.barbershop_id column.
    return { ...subscription, barbershop_id: barbershopId } as SubscriptionRecord;
  }

  static async getBarbershopIdForUser(userId: string): Promise<string | null> {
    const { data, error } = await createAdminClient().from("users").select("barbershop_id").eq("id", userId).maybeSingle();
    if (error) throw new BillingError("Could not resolve barbershop for user.", "DB_READ_FAILED", { userId });
    return data?.barbershop_id ?? null;
  }

  static async assertBillingOwner(userId: string): Promise<void> {
    const { data, error } = await createAdminClient().from("users").select("role, barbershop_id").eq("id", userId).maybeSingle();
    if (error) throw new BillingError("Could not verify billing owner.", "DB_READ_FAILED", { userId });
    if (!data?.barbershop_id || data.role !== "owner") throw new BillingError("Apenas o proprietário da barbearia pode gerir a subscrição.", "SUBSCRIPTION_NOT_ACTIVE");
  }

  static async getActiveForUser(userId: string): Promise<SubscriptionRecord | null> {
    const subscription = await this.getForUser(userId);
    if (!subscription) return null;
    if (subscription.plan_override && subscription.plan_override !== PLANS.FREE) return subscription;
    if (subscription.plan === PLANS.FREE) return null;
    return (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status) ? subscription : null;
  }

  static async getActiveForBarbershop(barbershopId: string): Promise<SubscriptionRecord | null> {
    const subscription = await this.getForBarbershop(barbershopId);
    if (!subscription) return null;
    if (subscription.plan_override && subscription.plan_override !== PLANS.FREE) return subscription;
    if (subscription.plan === PLANS.FREE) return null;
    return (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status) ? subscription : null;
  }

  static async getAccessPlanForBarbershop(barbershopId: string): Promise<BillingPlan> {
    const admin = createAdminClient();

    const { data: assignment, error: assignmentError } = await admin
      .from("barbershop_plan_assignments")
      .select("plan, expires_at")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();
    if (assignmentError) throw new BillingError("Could not load barbershop plan assignment.", "DB_READ_FAILED", { barbershopId });
    if (assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now())) return assignment.plan as BillingPlan;

    const subscription = await this.getForBarbershop(barbershopId);
    if (!subscription) return PLANS.FREE;
    if (subscription.plan_override) return subscription.plan_override as BillingPlan;

    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await getStripeClient().subscriptions.retrieve(subscription.stripe_subscription_id);
        const stripePriceId = stripeSubscription.items.data[0]?.price.id;
        const stripePlan = stripePriceId ? planForPrice(stripePriceId) : undefined;
        const stripeStatusAllowsAccess = (PLAN_ACCESS_STATUSES as readonly string[]).includes(stripeSubscription.status);

        if (stripePlan && stripePlan !== PLANS.FREE && stripeStatusAllowsAccess) {
          if (subscription.plan !== stripePlan || subscription.stripe_price_id !== stripePriceId || subscription.status !== stripeSubscription.status) {
            const { error } = await admin.from("subscriptions").update({
              plan: stripePlan,
              stripe_price_id: stripePriceId,
              status: stripeSubscription.status,
              current_period_end: stripeSubscription.items.data[0]?.current_period_end ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString() : subscription.current_period_end,
              cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            }).eq("id", subscription.id);
            if (error) throw new BillingError("Could not reconcile subscription plan.", "DB_WRITE_FAILED", { barbershopId });
          }
          return stripePlan as BillingPlan;
        }

        if (!stripeStatusAllowsAccess) return PLANS.FREE;
      } catch (error) {
        if (error instanceof BillingError) throw error;
      }
    }

    return resolvePlan(subscription);
  }

  static async getAccessPlan(userId: string): Promise<BillingPlan> {
    const barbershopId = await this.getBarbershopIdForUser(userId);
    if (!barbershopId) return PLANS.FREE;
    return this.getAccessPlanForBarbershop(barbershopId);
  }

  static async resolveAccessPlanForUser(userId: string): Promise<BillingPlan> {
    return this.getAccessPlan(userId);
  }

  static async findUserIdByCustomerId(stripeCustomerId: string): Promise<string | null> {
    const { data, error } = await createAdminClient().from("customers").select("user_id").eq("stripe_customer_id", stripeCustomerId).maybeSingle();
    if (error) throw new BillingError("Could not resolve Stripe customer.", "DB_READ_FAILED", { stripeCustomerId });
    return data?.user_id ?? null;
  }

  static async syncFromStripe(userId: string, subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscriptionPeriodEnd(subscription);
    if (!priceId || !periodEnd) throw new BillingError("Stripe subscription is missing a recurring price or period end.", "WEBHOOK_PROCESSING_FAILED", { subscriptionId: subscription.id });

    const plan = (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status) ? planForPrice(priceId) ?? PLANS.FREE : PLANS.FREE;
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

    const { error } = await createAdminClient().from("subscriptions").upsert(row, { onConflict: "user_id" });
    if (error) throw new BillingError("Could not persist subscription state.", "DB_WRITE_FAILED", { userId, subscriptionId: subscription.id });
  }

  static async markCanceled(userId: string): Promise<void> {
    const subscription = await this.getForUser(userId);
    if (subscription?.plan_override && subscription.plan_override !== PLANS.FREE) return;
    const { error } = await createAdminClient().from("subscriptions").update({ status: "canceled", plan: PLANS.FREE, cancel_at_period_end: false }).eq("user_id", userId);
    if (error) throw new BillingError("Could not mark subscription as canceled.", "DB_WRITE_FAILED", { userId });
  }

  static async revokePaidAccess(userId: string, status: SubscriptionRecord["status"]): Promise<void> {
    const subscription = await this.getForUser(userId);
    if (subscription?.plan_override && subscription.plan_override !== PLANS.FREE) return;
    const { error } = await createAdminClient().from("subscriptions").update({ status, plan: PLANS.FREE, cancel_at_period_end: false }).eq("user_id", userId);
    if (error) throw new BillingError("Could not revoke paid access.", "DB_WRITE_FAILED", { userId });
  }
}
