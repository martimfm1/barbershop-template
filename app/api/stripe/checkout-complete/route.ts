import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { BillingError } from "@/types/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOG_PREFIX = "[billing.checkout-complete]";

function log(message: string, context: Record<string, unknown> = {}) {
  console.info(`${LOG_PREFIX} ${message}`, context);
}

function fail(message: string, status: number, context: Record<string, unknown> = {}) {
  console.error(`${LOG_PREFIX} ${message}`, context);
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return fail("Unauthorized", 401, { requestId, authError: authError?.message ?? null });
    }

    const database = createAdminClient();
    const { data: userRow, error: userError } = await database
      .from("users")
      .select("barbershop_id, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      return fail("Could not resolve SaaS account.", 500, {
        requestId,
        userId: user.id,
        supabase: userError,
      });
    }

    const barbershopId = userRow?.barbershop_id ?? null;
    if (!barbershopId) {
      return fail("A barbershop is required for billing.", 400, { requestId, userId: user.id });
    }

    if (String(userRow?.role ?? "").toLowerCase() !== "owner") {
      return fail("Only the barbershop owner can complete checkout.", 403, {
        requestId,
        userId: user.id,
        barbershopId,
      });
    }

    const account = await BarbershopStripeService.getBillingAccount(barbershopId);
    let customerId = account?.stripe_customer_id ?? null;

    if (!customerId) {
      const email = String(userRow?.email ?? user.email ?? "").trim().toLowerCase();
      const customers = await getStripeClient().customers.list({ email, limit: 20 });
      const matchingCustomer = customers.data.find((customer) =>
        !customer.deleted && (
          customer.metadata?.barbershop_id === barbershopId ||
          customer.metadata?.billing_owner_user_id === user.id ||
          customer.metadata?.user_id === user.id
        ),
      );

      if (matchingCustomer) {
        customerId = matchingCustomer.id;

        const { error: billingAccountError } = await database
          .from("barbershop_billing_accounts")
          .upsert({
            barbershop_id: barbershopId,
            billing_owner_user_id: user.id,
            stripe_customer_id: customerId,
            billing_email: email,
          }, { onConflict: "barbershop_id" });

        if (billingAccountError) {
          return fail("Could not persist the Stripe billing account.", 500, {
            requestId,
            userId: user.id,
            barbershopId,
            stripeCustomerId: customerId,
            supabase: billingAccountError,
          });
        }
      }
    }

    if (!customerId) {
      return fail("No Stripe customer was found for this barbershop.", 404, {
        requestId,
        userId: user.id,
        barbershopId,
      });
    }

    log("Loading Stripe subscriptions", {
      requestId,
      userId: user.id,
      barbershopId,
      stripeCustomerId: customerId,
    });

    const subscriptions = await getStripeClient().subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });

    const candidates = subscriptions.data
      .filter((subscription) => ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(subscription.status))
      .sort((a, b) => b.created - a.created);

    const latest = candidates[0] ?? null;

    log("Stripe subscription candidate resolved", {
      requestId,
      userId: user.id,
      barbershopId,
      stripeCustomerId: customerId,
      subscriptionCount: subscriptions.data.length,
      stripeSubscriptionId: latest?.id ?? null,
      stripeSubscriptionStatus: latest?.status ?? null,
    });

    if (!latest) {
      return fail("No Stripe subscription was found for this customer.", 404, {
        requestId,
        userId: user.id,
        barbershopId,
        stripeCustomerId: customerId,
      });
    }

    await BarbershopStripeService.syncFromStripe(barbershopId, user.id, latest);

    const { data: persisted, error: persistedError } = await database
      .from("subscriptions")
      .select("id, user_id, barbershop_id, stripe_subscription_id, stripe_customer_id, stripe_price_id, plan, status, trial_end, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("barbershop_id", barbershopId)
      .eq("stripe_subscription_id", latest.id)
      .maybeSingle();

    if (persistedError) {
      return fail("Subscription sync completed but verification failed.", 500, {
        requestId,
        userId: user.id,
        barbershopId,
        stripeSubscriptionId: latest.id,
        supabase: persistedError,
      });
    }

    if (!persisted) {
      throw new BillingError("Stripe subscription was not persisted to Supabase.", "DB_WRITE_FAILED", {
        userId: user.id,
        barbershopId,
        subscriptionId: latest.id,
      });
    }

    log("Stripe subscription persisted successfully", {
      requestId,
      userId: user.id,
      barbershopId,
      stripeSubscriptionId: latest.id,
      supabaseSubscriptionId: persisted.id,
      plan: persisted.plan,
      status: persisted.status,
    });

    return NextResponse.json(
      {
        success: true,
        stripeSubscriptionId: persisted.stripe_subscription_id,
        subscription: persisted,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} critical error`, {
      requestId,
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
    });

    if (error instanceof BillingError) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { error: "Could not synchronize the Stripe subscription." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
