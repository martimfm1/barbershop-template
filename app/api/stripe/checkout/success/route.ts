import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { BillingError } from "@/types/stripe";
import { BillingService } from "@/services/billing/billing.service";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requestedSessionId = new URL(request.url).searchParams.get("session_id")?.trim() || null;
    const stripe = getStripeClient();
    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;

    if (requestedSessionId) {
      if (!requestedSessionId.startsWith("cs_")) throw new BillingError("Invalid checkout session.", "INVALID_PRICE");
      session = await stripe.checkout.sessions.retrieve(requestedSessionId, { expand: ["subscription", "customer"] });
    } else {
      const customerId = await BillingService.getCustomerId(user.id);
      const sessions = await stripe.checkout.sessions.list({ customer: customerId, status: "complete", limit: 10 });
      const matchingSession = sessions.data.find((item) => (item.client_reference_id ?? item.metadata?.user_id) === user.id && item.mode === "subscription");
      if (!matchingSession) return NextResponse.json({ status: "pending", message: "No completed checkout session was found yet." }, { status: 200 });
      session = await stripe.checkout.sessions.retrieve(matchingSession.id, { expand: ["subscription", "customer"] });
    }

    const sessionUserId = session.client_reference_id ?? session.metadata?.user_id ?? null;
    if (sessionUserId !== user.id) return NextResponse.json({ error: "This checkout session does not belong to the current account." }, { status: 403 });
    if (session.status !== "complete") return NextResponse.json({ status: "pending", message: "The checkout has not completed yet." }, { status: 200 });

    const stripeSubscription = session.subscription;
    if (!stripeSubscription) throw new BillingError("Checkout completed without a Stripe subscription.", "WEBHOOK_PROCESSING_FAILED", { sessionId: session.id });
    const subscription = typeof stripeSubscription === "string" ? await stripe.subscriptions.retrieve(stripeSubscription) : stripeSubscription;

    await SubscriptionService.syncFromStripe(user.id, subscription);

    const barbershopId = await SubscriptionService.getBarbershopIdForUser(user.id);
    let barbershopName: string | null = null;
    if (barbershopId) {
      const { data } = await createAdminClient().from("barbershops").select("name").eq("id", barbershopId).maybeSingle();
      barbershopName = data?.name ?? null;
    }

    const refreshed = await SubscriptionService.getForUser(user.id);
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      subscriptionId: subscription.id,
      plan: refreshed?.plan ?? "free",
      status: refreshed?.status ?? subscription.status,
      barbershopId,
      barbershopName,
      trialEnd: refreshed?.trial_end ?? null,
      currentPeriodEnd: refreshed?.current_period_end ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_SUCCESS_ERROR]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof BillingError ? error.code : undefined,
      context: error instanceof BillingError ? error.context : undefined,
    });
    const status = error instanceof BillingError && error.code === "INVALID_PRICE" ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível confirmar a compra." }, { status });
  }
}
