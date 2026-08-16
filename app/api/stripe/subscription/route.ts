import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { BillingError } from "@/types/stripe";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";

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
