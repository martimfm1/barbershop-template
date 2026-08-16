import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { getStripeClient } from "@/lib/stripe/server";
import { planForPrice, PLANS, TRIAL_PERIOD_DAYS } from "@/lib/stripe/constants";
import { PLAN_ACCESS_STATUSES } from "@/lib/billing/plan-access";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKOUT_IDEMPOTENCY_BUCKET_MS = 10 * 60 * 1000;

async function recoverBillingCustomer(userId: string, barbershopId: string, email: string): Promise<string> {
  const database = createAdminClient();
  const customer = await getStripeClient().customers.create(
    {
      email,
      metadata: {
        app: "silentra-for-barbers",
        barbershop_id: barbershopId,
        billing_owner_user_id: userId,
        recovery: "true",
      },
    },
    {
      idempotencyKey: `barbershop-customer-recovery:${barbershopId}:${Date.now()}`,
    },
  );

  const { error: billingAccountError } = await database
    .from("barbershop_billing_accounts")
    .upsert(
      {
        barbershop_id: barbershopId,
        billing_owner_user_id: userId,
        stripe_customer_id: customer.id,
        billing_email: email,
      },
      { onConflict: "barbershop_id" },
    );

  if (billingAccountError) {
    throw new BillingError(
      "Could not persist the recovered Stripe billing account.",
      "DB_WRITE_FAILED",
      { barbershopId, customerId: customer.id },
    );
  }

  return customer.id;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    if (!priceId) throw new BillingError("The requested price is not available.", "INVALID_PRICE");

    const requestedPlan = planForPrice(priceId);
    if (!requestedPlan || requestedPlan === PLANS.FREE) {
      throw new BillingError("The requested price is not available.", "INVALID_PRICE", { priceId });
    }

    const tenant = await BarbershopStripeService.getTenantContext(user.id);
    const existing = await BarbershopStripeService.reconcileSubscription(
      tenant.barbershopId,
      await BarbershopStripeService.getSubscriptionForBarbershop(tenant.barbershopId),
    );

    if (existing && existing.plan !== PLANS.FREE && (PLAN_ACCESS_STATUSES as readonly string[]).includes(existing.status)) {
      throw new BillingError(
        "A active subscription already exists for this barbershop. Choose another plan from /plans.",
        "SUBSCRIPTION_NOT_ACTIVE",
        { barbershopId: tenant.barbershopId, subscriptionId: existing.stripe_subscription_id },
      );
    }

    let customer: string;
    try {
      customer = await BarbershopStripeService.getOrCreateCustomer(user.id);
    } catch (error) {
      if (!(error instanceof BillingError) || error.code !== "CUSTOMER_NOT_FOUND") throw error;
      customer = await recoverBillingCustomer(user.id, tenant.barbershopId, tenant.email);
    }

    const canTrial = requestedPlan === PLANS.PRO && !existing;
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const returnUrl = `${new URL(origin).origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const bucket = Math.floor(Date.now() / CHECKOUT_IDEMPOTENCY_BUCKET_MS);

    const session = await getStripeClient().checkout.sessions.create(
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
        tax_id_collection: { enabled: true },
        locale: "pt",
      },
      { idempotencyKey: `checkout-elements:${tenant.barbershopId}:${priceId}:${bucket}` },
    );

    if (!session.client_secret) {
      throw new BillingError("Stripe did not return a Checkout Elements client secret.", "WEBHOOK_PROCESSING_FAILED", { sessionId: session.id });
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

    const status = error instanceof BillingError && error.code === "INVALID_PRICE"
      ? 400
      : error instanceof BillingError && error.code === "SUBSCRIPTION_NOT_ACTIVE"
        ? 409
        : 500;

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível iniciar o checkout." },
      { status },
    );
  }
}
