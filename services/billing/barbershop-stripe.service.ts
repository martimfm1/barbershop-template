import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { planForPrice, PLANS, TRIAL_PERIOD_DAYS } from "@/lib/stripe/constants";
import { PLAN_ACCESS_STATUSES, resolvePlan } from "@/lib/billing/plan-access";
import { BillingError, type BillingPlan, type SubscriptionRecord } from "@/types/stripe";

const PENDING_INVOICE_TTL_MS = 10 * 60 * 1000;
const CHECKOUT_IDEMPOTENCY_BUCKET_MS = 10 * 60 * 1000;

type TenantContext = {
  userId: string;
  email: string;
  role: string;
  barbershopId: string;
};

type BillingAccountRow = {
  barbershop_id: string;
  billing_owner_user_id: string | null;
  stripe_customer_id: string;
  billing_email: string | null;
  trial_started_at: string | null;
};

function stripeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

function subscriptionPlan(subscription: Stripe.Subscription): BillingPlan {
  const priceId = subscription.items.data[0]?.price.id ?? "";
  return planForPrice(priceId) ?? PLANS.FREE;
}

function isMissingStripeResource(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "resource_missing";
}

export class BarbershopStripeService {
  static async getTenantContext(userId: string): Promise<TenantContext> {
    const database = createAdminClient();
    const { data: user, error: userError } = await database
      .from("users")
      .select("id, email, role, barbershop_id")
      .eq("id", userId)
      .maybeSingle();

    if (userError) throw new BillingError("Could not load SaaS account.", "DB_READ_FAILED", { userId });
    if (!user?.barbershop_id || !user.email) {
      throw new BillingError("A barbearia é necessária antes de ativar a faturação.", "SUBSCRIPTION_NOT_ACTIVE", { userId });
    }

    const { data: barbershop, error: barbershopError } = await database
      .from("barbershops")
      .select("id, created_by")
      .eq("id", user.barbershop_id)
      .maybeSingle();

    if (barbershopError) throw new BillingError("Could not load barbershop account.", "DB_READ_FAILED", { userId, barbershopId: user.barbershop_id });
    if (!barbershop || barbershop.created_by !== userId) {
      throw new BillingError("Apenas o proprietário da barbearia pode gerir a subscrição.", "SUBSCRIPTION_NOT_ACTIVE", { userId, barbershopId: user.barbershop_id });
    }

    return {
      userId,
      email: user.email,
      role: String(user.role ?? ""),
      barbershopId: user.barbershop_id,
    };
  }

  static async getBillingAccount(barbershopId: string): Promise<BillingAccountRow | null> {
    const { data, error } = await createAdminClient()
      .from("barbershop_billing_accounts")
      .select("barbershop_id, billing_owner_user_id, stripe_customer_id, billing_email, trial_started_at")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (error) throw new BillingError("Could not load Stripe billing account.", "DB_READ_FAILED", { barbershopId });
    return (data as BillingAccountRow | null) ?? null;
  }

  static async getOrCreateCustomer(userId: string): Promise<string> {
    const tenant = await this.getTenantContext(userId);
    const database = createAdminClient();
    const existingAccount = await this.getBillingAccount(tenant.barbershopId);

    if (existingAccount?.stripe_customer_id) {
      const customer = await getStripeClient().customers.retrieve(existingAccount.stripe_customer_id);
      if (customer.deleted) throw new BillingError("The Stripe customer was deleted and needs to be recreated.", "CUSTOMER_NOT_FOUND", { barbershopId: tenant.barbershopId });
      await getStripeClient().customers.update(existingAccount.stripe_customer_id, {
        email: tenant.email,
        metadata: {
          ...customer.metadata,
          app: "silentra-for-barbers",
          barbershop_id: tenant.barbershopId,
          billing_owner_user_id: tenant.userId,
        },
      });
      return existingAccount.stripe_customer_id;
    }

    const legacy = await database
      .from("customers")
      .select("stripe_customer_id, email")
      .eq("user_id", tenant.userId)
      .maybeSingle();

    if (legacy.error) throw new BillingError("Could not load legacy Stripe customer mapping.", "DB_READ_FAILED", { userId });

    if (legacy.data?.stripe_customer_id) {
      const stripeCustomer = await getStripeClient().customers.retrieve(legacy.data.stripe_customer_id);
      if (!stripeCustomer.deleted) {
        const { error: writeError } = await database.from("barbershop_billing_accounts").upsert({
          barbershop_id: tenant.barbershopId,
          billing_owner_user_id: tenant.userId,
          stripe_customer_id: stripeCustomer.id,
          billing_email: tenant.email,
        }, { onConflict: "barbershop_id" });
        if (writeError) throw new BillingError("Could not link the Stripe customer to the barbershop.", "DB_WRITE_FAILED", { barbershopId: tenant.barbershopId, customerId: stripeCustomer.id });
        return stripeCustomer.id;
      }
    }

    const customer = await getStripeClient().customers.create(
      {
        email: tenant.email,
        metadata: {
          app: "silentra-for-barbers",
          barbershop_id: tenant.barbershopId,
          billing_owner_user_id: tenant.userId,
        },
      },
      { idempotencyKey: `barbershop-customer:${tenant.barbershopId}` },
    );

    const { error: writeError } = await database.from("barbershop_billing_accounts").upsert({
      barbershop_id: tenant.barbershopId,
      billing_owner_user_id: tenant.userId,
      stripe_customer_id: customer.id,
      billing_email: tenant.email,
    }, { onConflict: "barbershop_id" });

    if (writeError) throw new BillingError("Could not persist Stripe billing account.", "DB_WRITE_FAILED", { barbershopId: tenant.barbershopId, customerId: customer.id });
    return customer.id;
  }

  static async getSubscriptionForBarbershop(barbershopId: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await createAdminClient()
      .from("subscriptions")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new BillingError("Could not load barbershop subscription.", "DB_READ_FAILED", { barbershopId });
    return data as SubscriptionRecord | null;
  }

  static async reconcileSubscription(barbershopId: string, subscription: SubscriptionRecord | null): Promise<SubscriptionRecord | null> {
    if (!subscription?.stripe_subscription_id || (subscription.plan_override && subscription.plan_override !== PLANS.FREE)) return subscription;

    try {
      const remote = await getStripeClient().subscriptions.retrieve(subscription.stripe_subscription_id);
      const priceId = remote.items.data[0]?.price.id ?? subscription.stripe_price_id;
      const stripePlan = subscriptionPlan(remote);
      const hasAccess = (PLAN_ACCESS_STATUSES as readonly string[]).includes(remote.status) && stripePlan !== PLANS.FREE;
      const nextPlan = hasAccess ? stripePlan : PLANS.FREE;
      const periodEnd = subscriptionPeriodEnd(remote);
      const updates = {
        barbershop_id: barbershopId,
        stripe_customer_id: stripeCustomerId(remote.customer),
        stripe_price_id: priceId,
        plan: nextPlan,
        status: remote.status,
        trial_end: remote.trial_end ? new Date(remote.trial_end * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : subscription.current_period_end,
        cancel_at_period_end: remote.cancel_at_period_end,
      };

      const changed = subscription.plan !== updates.plan || subscription.status !== updates.status || subscription.stripe_price_id !== updates.stripe_price_id || subscription.stripe_customer_id !== updates.stripe_customer_id || subscription.trial_end !== updates.trial_end || subscription.current_period_end !== updates.current_period_end || subscription.cancel_at_period_end !== updates.cancel_at_period_end;
      if (changed) {
        const { error } = await createAdminClient().from("subscriptions").update(updates).eq("id", subscription.id);
        if (error) throw new BillingError("Could not reconcile subscription with Stripe.", "DB_WRITE_FAILED", { barbershopId, subscriptionId: remote.id });
      }

      return { ...subscription, ...updates } as SubscriptionRecord;
    } catch (error) {
      if (!isMissingStripeResource(error)) throw error;
      const { error: updateError } = await createAdminClient().from("subscriptions").update({ plan: PLANS.FREE, status: "canceled", cancel_at_period_end: false }).eq("id", subscription.id);
      if (updateError) throw new BillingError("Could not reconcile missing Stripe subscription.", "DB_WRITE_FAILED", { barbershopId, subscriptionId: subscription.stripe_subscription_id });
      return { ...subscription, plan: PLANS.FREE, status: "canceled", cancel_at_period_end: false } as SubscriptionRecord;
    }
  }

  static async getEffectivePlan(userId: string): Promise<BillingPlan> {
    const database = createAdminClient();
    const tenant = await database.from("users").select("barbershop_id").eq("id", userId).maybeSingle();
    if (tenant.error) throw new BillingError("Could not resolve SaaS account.", "DB_READ_FAILED", { userId });
    const barbershopId = tenant.data?.barbershop_id;
    if (!barbershopId) return PLANS.FREE;

    const { data: assignment, error: assignmentError } = await database
      .from("barbershop_plan_assignments")
      .select("plan, expires_at")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();
    if (assignmentError) throw new BillingError("Could not load barbershop plan assignment.", "DB_READ_FAILED", { barbershopId });
    if (assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now())) return assignment.plan as BillingPlan;

    const subscription = await this.reconcileSubscription(barbershopId, await this.getSubscriptionForBarbershop(barbershopId));
    return resolvePlan(subscription);
  }

  static async createElementsCheckout(userId: string, priceId: string): Promise<{ clientSecret: string; sessionId: string }> {
    const tenant = await this.getTenantContext(userId);
    const requestedPlan = planForPrice(priceId);
    if (!requestedPlan || requestedPlan === PLANS.FREE) throw new BillingError("The requested price is not available.", "INVALID_PRICE", { priceId });

    const existing = await this.reconcileSubscription(tenant.barbershopId, await this.getSubscriptionForBarbershop(tenant.barbershopId));
    if (existing && existing.plan !== PLANS.FREE && (PLAN_ACCESS_STATUSES as readonly string[]).includes(existing.status)) {
      throw new BillingError("A active subscription already exists for this barbershop. Choose another plan from /plans.", "SUBSCRIPTION_NOT_ACTIVE", { barbershopId: tenant.barbershopId, subscriptionId: existing.stripe_subscription_id });
    }

    const customer = await this.getOrCreateCustomer(userId);
    const canTrial = requestedPlan === PLANS.PRO && !existing;
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const returnUrl = `${new URL(origin).origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const bucket = Math.floor(Date.now() / CHECKOUT_IDEMPOTENCY_BUCKET_MS);

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(
      {
        customer,
        mode: "subscription",
        ui_mode: "elements",
        line_items: [{ price: priceId, quantity: 1 }],
        return_url: returnUrl,
        client_reference_id: tenant.barbershopId,
        allow_promotion_codes: true,
        metadata: {
          app: "silentra-for-barbers",
          user_id: tenant.userId,
          barbershop_id: tenant.barbershopId,
          stripe_customer_id: customer,
          plan: requestedPlan,
          trial_eligible: canTrial ? "true" : "false",
        },
        subscription_data: {
          metadata: {
            app: "silentra-for-barbers",
            user_id: tenant.userId,
            barbershop_id: tenant.barbershopId,
            trial_eligible: canTrial ? "true" : "false",
          },
          ...(canTrial ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
        },
        billing_address_collection: "required",
        customer_update: { name: "auto", address: "auto" },
        phone_number_collection: { enabled: true },
        tax_id_collection: { enabled: true },
        locale: "pt",
      },
      { idempotencyKey: `checkout-elements:${tenant.barbershopId}:${priceId}:${bucket}` },
    );

    if (!session.client_secret) throw new BillingError("Stripe did not return a Checkout Elements client secret.", "WEBHOOK_PROCESSING_FAILED", { sessionId: session.id });
    return { clientSecret: session.client_secret, sessionId: session.id };
  }

  static async createCustomerPortal(userId: string): Promise<string> {
    const tenant = await this.getTenantContext(userId);
    const customer = await this.getOrCreateCustomer(userId);
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();
    const session = await getStripeClient().billingPortal.sessions.create({
      customer,
      return_url: `${new URL(origin).origin}/dashboard/billing`,
      ...(configuration ? { configuration } : {}),
    });
    return session.url;
  }

  static async cancelAtPeriodEnd(userId: string): Promise<void> {
    const tenant = await this.getTenantContext(userId);
    const subscription = await this.reconcileSubscription(tenant.barbershopId, await this.getSubscriptionForBarbershop(tenant.barbershopId));
    if (!subscription?.stripe_subscription_id) throw new BillingError("No active paid subscription was found.", "SUBSCRIPTION_NOT_FOUND", { barbershopId: tenant.barbershopId });
    const updated = await getStripeClient().subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: true });
    await this.syncFromStripe(tenant.barbershopId, tenant.userId, updated);
  }

  static async getInvoices(userId: string) {
    const customer = await this.getOrCreateCustomer(userId);
    const invoices = await getStripeClient().invoices.list({ customer, limit: 12 });
    const now = Date.now();
    return invoices.data
      .filter((invoice) => {
        const pending = invoice.status === null || invoice.status === "draft" || invoice.status === "open";
        return !pending || now - invoice.created * 1000 <= PENDING_INVOICE_TTL_MS;
      })
      .map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        date: new Date(invoice.created * 1000).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }),
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      }));
  }

  static async syncFromStripe(barbershopId: string, ownerUserId: string, subscription: Stripe.Subscription): Promise<void> {
    const customer = stripeCustomerId(subscription.customer);
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscriptionPeriodEnd(subscription);
    if (!priceId || !periodEnd) throw new BillingError("Stripe subscription is missing a recurring price or period end.", "WEBHOOK_PROCESSING_FAILED", { subscriptionId: subscription.id });

    const plan = (PLAN_ACCESS_STATUSES as readonly string[]).includes(subscription.status)
      ? planForPrice(priceId) ?? PLANS.FREE
      : PLANS.FREE;

    const existing = await this.getSubscriptionForBarbershop(barbershopId);
    const payload = {
      user_id: ownerUserId,
      barbershop_id: barbershopId,
      stripe_customer_id: customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    const database = createAdminClient();
    const write = existing
      ? await database.from("subscriptions").update(payload).eq("id", existing.id)
      : await database.from("subscriptions").upsert(payload, { onConflict: "barbershop_id" });

    if (write.error) throw new BillingError("Could not persist subscription state.", "DB_WRITE_FAILED", { barbershopId, subscriptionId: subscription.id });

    const { data: owner } = await database.from("users").select("email").eq("id", ownerUserId).maybeSingle();
    const billingEmail = owner?.email ?? null;

    const { error: billingAccountError } = await database.from("barbershop_billing_accounts").upsert({
      barbershop_id: barbershopId,
      billing_owner_user_id: ownerUserId,
      stripe_customer_id: customer,
      billing_email: billingEmail,
      ...(subscription.status === "trialing" ? { trial_started_at: new Date().toISOString() } : {}),
    }, { onConflict: "barbershop_id" });
    if (billingAccountError) throw new BillingError("Could not persist Stripe billing account mapping.", "DB_WRITE_FAILED", { barbershopId, customer });

    if (billingEmail) {
      const { error: customerMappingError } = await database.from("customers").upsert({
        user_id: ownerUserId,
        stripe_customer_id: customer,
        email: billingEmail,
      }, { onConflict: "user_id" });
      if (customerMappingError) throw new BillingError("Could not persist Stripe customer mapping.", "DB_WRITE_FAILED", { userId: ownerUserId, customer });
    }
  }

  static async findBarbershopByCustomerId(customer: string): Promise<{ barbershopId: string; ownerUserId: string } | null> {
    const database = createAdminClient();
    const { data, error } = await database
      .from("barbershop_billing_accounts")
      .select("barbershop_id, billing_owner_user_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (error) throw new BillingError("Could not resolve Stripe customer to a barbershop.", "DB_READ_FAILED", { customer });
    if (data?.barbershop_id && data.billing_owner_user_id) return { barbershopId: data.barbershop_id, ownerUserId: data.billing_owner_user_id };

    const legacy = await database.from("customers").select("user_id").eq("stripe_customer_id", customer).maybeSingle();
    if (legacy.error) throw new BillingError("Could not resolve legacy Stripe customer mapping.", "DB_READ_FAILED", { customer });
    if (!legacy.data?.user_id) return null;

    const { data: user, error: userError } = await database.from("users").select("id, barbershop_id, role").eq("id", legacy.data.user_id).maybeSingle();
    if (userError) throw new BillingError("Could not resolve customer owner.", "DB_READ_FAILED", { customer });
    if (!user?.barbershop_id) return null;

    await database.from("barbershop_billing_accounts").upsert({
      barbershop_id: user.barbershop_id,
      billing_owner_user_id: user.id,
      stripe_customer_id: customer,
    }, { onConflict: "barbershop_id" });

    return { barbershopId: user.barbershop_id, ownerUserId: user.id };
  }

  static async processWebhookEvent(event: Stripe.Event): Promise<void> {
    if (!["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) return;

    const subscription = event.data.object as Stripe.Subscription;
    const mapping = await this.findBarbershopByCustomerId(stripeCustomerId(subscription.customer));
    if (!mapping) throw new BillingError("Webhook customer mapping was not found.", "WEBHOOK_PROCESSING_FAILED", { eventId: event.id, customer: stripeCustomerId(subscription.customer) });

    if (event.type === "customer.subscription.deleted") {
      const database = createAdminClient();
      const { error } = await database.from("subscriptions").update({ plan: PLANS.FREE, status: "canceled", cancel_at_period_end: false }).eq("barbershop_id", mapping.barbershopId);
      if (error) throw new BillingError("Could not persist canceled subscription.", "DB_WRITE_FAILED", { barbershopId: mapping.barbershopId, eventId: event.id });
      return;
    }

    await this.syncFromStripe(mapping.barbershopId, mapping.ownerUserId, subscription);
  }
}
