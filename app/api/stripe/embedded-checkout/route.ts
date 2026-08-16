import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { planForPrice, PLANS, TRIAL_PERIOD_DAYS } from "@/lib/stripe/constants";
import { BillingService } from "@/services/billing/billing.service";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";

function safeOrigin(request: Request) {
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await BillingService.assertBillingOwner(user.id);

    const body = await request.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    const requestedPlan = priceId ? planForPrice(priceId) : null;
    if (!requestedPlan || requestedPlan === PLANS.FREE) {
      throw new BillingError("The requested price is not available.", "INVALID_PRICE", { priceId });
    }

    const activeSubscription = await SubscriptionService.getActiveForUser(user.id);
    if (activeSubscription) {
      throw new BillingError(
        "An active or pending subscription already exists. Manage the existing subscription instead.",
        "SUBSCRIPTION_NOT_ACTIVE",
        { userId: user.id, stripeStatus: activeSubscription.status, subscriptionId: activeSubscription.stripe_subscription_id },
      );
    }

    const trialEligible = requestedPlan === PLANS.PRO && (await BillingService.isEligibleForProTrial(user.id));
    const customer = await BillingService.getOrCreateCustomer(user.id, user.email);
    const origin = safeOrigin(request);
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      ui_mode: "custom",
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${origin}/checkout?priceId=${encodeURIComponent(priceId)}&checkout=return&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?priceId=${encodeURIComponent(priceId)}&checkout=cancelled`,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        offer: trialEligible ? "pro_trial" : requestedPlan === PLANS.PRO ? "pro_standard" : "standard",
        trial_eligible: trialEligible ? "true" : "false",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          trial_eligible: trialEligible ? "true" : "false",
        },
        ...(trialEligible ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
      },
      billing_address_collection: "required",
      customer_update: {
        name: "auto",
        address: "auto",
      },
      phone_number_collection: { enabled: true },
      tax_id_collection: { enabled: true },
      locale: "pt",
    });

    if (!session.client_secret) {
      throw new BillingError("Stripe did not return an embedded Checkout client secret.", "WEBHOOK_PROCESSING_FAILED");
    }

    return NextResponse.json(
      { clientSecret: session.client_secret, sessionId: session.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[STRIPE_CUSTOM_CHECKOUT_ERROR]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof BillingError ? error.code : undefined,
      context: error instanceof BillingError ? error.context : undefined,
    });
    const status = error instanceof BillingError && error.code === "INVALID_PRICE" ? 400 : error instanceof BillingError && error.code === "SUBSCRIPTION_NOT_ACTIVE" ? 409 : error instanceof BillingError && error.code === "DB_READ_FAILED" ? 500 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível iniciar o checkout." }, { status });
  }
}
