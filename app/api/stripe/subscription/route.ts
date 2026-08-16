import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { BillingError } from "@/types/stripe";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function recoverLatestStripeSubscription(barbershopId: string): Promise<void> {
  const account = await BarbershopStripeService.getBillingAccount(barbershopId);
  if (!account?.stripe_customer_id || !account.billing_owner_user_id) return;

  const subscriptions = await getStripeClient().subscriptions.list({
    customer: account.stripe_customer_id,
    status: "all",
    limit: 20,
  });
  const latest = [...subscriptions.data].sort((a, b) => b.created - a.created)[0];
  if (!latest) return;

  await BarbershopStripeService.syncFromStripe(barbershopId, account.billing_owner_user_id, latest);
}

export async function GET(request: Request) {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const database = createAdminClient();
    const { data: userRow, error: userError } = await database.from("users").select("barbershop_id").eq("id", user.id).maybeSingle();
    if (userError) throw new BillingError("Could not resolve SaaS account.", "DB_READ_FAILED", { userId: user.id });

    const barbershopId = userRow?.barbershop_id ?? null;
    if (!barbershopId) return NextResponse.json({ subscription: null, plan: "free", planSource: "free", barbershopId: null }, { headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get("session_id")?.trim() || null;
    if (checkoutSessionId) {
      const stripeSession = await getStripeClient().checkout.sessions.retrieve(checkoutSessionId, { expand: ["subscription"] });
      const metadataBarbershopId = stripeSession.metadata?.barbershop_id ?? stripeSession.client_reference_id ?? null;
      if (metadataBarbershopId !== barbershopId) throw new BillingError("Checkout session does not belong to this barbershop.", "SUBSCRIPTION_NOT_ACTIVE", { userId: user.id, barbershopId, sessionId: checkoutSessionId });
      if (stripeSession.subscription) {
        const stripeSubscription = typeof stripeSession.subscription === "string" ? await getStripeClient().subscriptions.retrieve(stripeSession.subscription) : stripeSession.subscription;
        const account = await BarbershopStripeService.getBillingAccount(barbershopId);
        await BarbershopStripeService.syncFromStripe(barbershopId, account?.billing_owner_user_id ?? user.id, stripeSubscription);
      }
    }

    let subscription = await BarbershopStripeService.reconcileSubscription(barbershopId, await BarbershopStripeService.getSubscriptionForBarbershop(barbershopId));
    if (!subscription) {
      await recoverLatestStripeSubscription(barbershopId);
      subscription = await BarbershopStripeService.reconcileSubscription(barbershopId, await BarbershopStripeService.getSubscriptionForBarbershop(barbershopId));
    }

    const plan = await BarbershopStripeService.getEffectivePlan(user.id);
    const { data: assignment, error: assignmentError } = await database.from("barbershop_plan_assignments").select("plan, expires_at").eq("barbershop_id", barbershopId).maybeSingle();
    if (assignmentError) throw new BillingError("Could not load barbershop plan assignment.", "DB_READ_FAILED", { barbershopId });
    const hasActiveAssignment = Boolean(assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now()));
    const planSource = hasActiveAssignment ? "admin" : subscription?.plan_override ? "subscription_override" : plan !== "free" ? "stripe" : "free";

    return NextResponse.json({ subscription, plan, planSource, barbershopId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
