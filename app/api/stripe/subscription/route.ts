import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { BillingError } from "@/types/stripe";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";

async function recoverLatestStripeSubscription(barbershopId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: owner, error: ownerError } = await admin
    .from("users")
    .select("id")
    .eq("barbershop_id", barbershopId)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownerError || !owner?.id) return;

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", owner.id)
    .maybeSingle();

  if (customerError || !customer?.stripe_customer_id) return;

  const stripeSubscriptions = await getStripeClient().subscriptions.list({
    customer: customer.stripe_customer_id,
    status: "all",
    limit: 10,
  });

  const latest = [...stripeSubscriptions.data].sort((a, b) => b.created - a.created)[0];
  if (!latest) return;

  await SubscriptionService.syncFromStripe(owner.id, latest);
}

export async function GET(request: Request) {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get("session_id")?.trim() || null;

    // The checkout return URL carries the Checkout Session ID. Reconcile that
    // session immediately so a delayed/missed webhook cannot leave the local
    // billing state stale after a successful purchase.
    if (checkoutSessionId) {
      const stripeSession = await getStripeClient().checkout.sessions.retrieve(checkoutSessionId, {
        expand: ["subscription"],
      });

      const sessionUserId = stripeSession.client_reference_id || stripeSession.metadata?.user_id || null;
      if (sessionUserId !== user.id) {
        throw new BillingError("Checkout session does not belong to the authenticated user.", "SUBSCRIPTION_NOT_ACTIVE", { userId: user.id, sessionId: checkoutSessionId });
      }

      if (stripeSession.mode === "subscription" && stripeSession.subscription) {
        const stripeSubscription = typeof stripeSession.subscription === "string"
          ? await getStripeClient().subscriptions.retrieve(stripeSession.subscription)
          : stripeSession.subscription;
        await SubscriptionService.syncFromStripe(user.id, stripeSubscription);
      }
    }

    const barbershopId = await SubscriptionService.getBarbershopIdForUser(user.id);
    if (!barbershopId) return NextResponse.json({ subscription: null, plan: "free", planSource: "free", barbershopId: null }, { headers: { "Cache-Control": "no-store" } });

    // Recover purchases even when the webhook was delayed/missed and the local
    // subscriptions row was never created. Stripe remains the source of truth.
    const localSubscription = await SubscriptionService.getForBarbershop(barbershopId);
    if (!localSubscription) {
      await recoverLatestStripeSubscription(barbershopId);
    }

    const plan = await SubscriptionService.getAccessPlanForBarbershop(barbershopId);
    const subscription = await SubscriptionService.getForBarbershop(barbershopId);

    const hasAdminAssignment = plan !== "free" && !subscription?.stripe_subscription_id && !subscription?.plan_override;
    const planSource = hasAdminAssignment ? "admin" : subscription?.plan_override ? "subscription_override" : plan !== "free" ? "stripe" : "free";

    return NextResponse.json(
      { subscription, plan, planSource, barbershopId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
