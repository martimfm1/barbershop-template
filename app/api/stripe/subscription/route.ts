import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { BillingError } from "@/types/stripe";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function recoverLatestStripeSubscription(barbershopId: string, userId: string, email: string): Promise<void> {
  const database = createAdminClient();
  let account = await BarbershopStripeService.getBillingAccount(barbershopId);

  if (!account?.stripe_customer_id) {
    const customers = await getStripeClient().customers.list({ email, limit: 20 });
    const matchingCustomer = customers.data.find((customer) =>
      !customer.deleted && (
        customer.metadata?.barbershop_id === barbershopId ||
        customer.metadata?.billing_owner_user_id === userId ||
        customer.metadata?.user_id === userId
      ),
    );

    if (matchingCustomer) {
      const { error } = await database.from("barbershop_billing_accounts").upsert({
        barbershop_id: barbershopId,
        billing_owner_user_id: userId,
        stripe_customer_id: matchingCustomer.id,
        billing_email: email,
      }, { onConflict: "barbershop_id" });
      if (error) throw new BillingError("Could not recover the Stripe billing account.", "DB_WRITE_FAILED", { barbershopId, customerId: matchingCustomer.id });

      const { error: customerError } = await database.from("customers").upsert({
        user_id: userId,
        stripe_customer_id: matchingCustomer.id,
        email,
      }, { onConflict: "user_id" });
      if (customerError) throw new BillingError("Could not persist the Stripe customer mapping.", "DB_WRITE_FAILED", { userId, customerId: matchingCustomer.id });

      account = await BarbershopStripeService.getBillingAccount(barbershopId);
    }
  }

  if (!account?.stripe_customer_id) return;

  const subscriptions = await getStripeClient().subscriptions.list({
    customer: account.stripe_customer_id,
    status: "all",
    limit: 20,
  });
  const latest = [...subscriptions.data]
    .sort((a, b) => b.created - a.created)
    .find((subscription) => ["active", "trialing", "past_due", "unpaid", "incomplete", "canceled"].includes(subscription.status));
  if (!latest) return;

  await BarbershopStripeService.syncFromStripe(barbershopId, account.billing_owner_user_id ?? userId, latest);
}

export async function GET(request: Request) {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const database = createAdminClient();
    const { data: userRow, error: userError } = await database.from("users").select("barbershop_id, role, email").eq("id", user.id).maybeSingle();
    if (userError) throw new BillingError("Could not resolve SaaS account.", "DB_READ_FAILED", { userId: user.id });

    const barbershopId = userRow?.barbershop_id ?? null;
    const isBillingOwner = String(userRow?.role ?? "").toLowerCase() === "owner";
    const email = String(userRow?.email ?? user.email ?? "").trim().toLowerCase();
    if (!barbershopId) {
      return NextResponse.json(
        { subscription: null, plan: "free", planSource: "free", barbershopId: null, isBillingOwner, stripeSubscriptionId: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get("session_id")?.trim() || null;
    if (checkoutSessionId) {
      const stripeSession = await getStripeClient().checkout.sessions.retrieve(checkoutSessionId, { expand: ["subscription"] });
      const metadataBarbershopId = stripeSession.metadata?.barbershop_id ?? stripeSession.client_reference_id ?? null;
      if (metadataBarbershopId && metadataBarbershopId !== barbershopId) {
        throw new BillingError("Checkout session does not belong to this barbershop.", "SUBSCRIPTION_NOT_ACTIVE", { userId: user.id, barbershopId, sessionId: checkoutSessionId });
      }

      const customerId = typeof stripeSession.customer === "string" ? stripeSession.customer : stripeSession.customer?.id ?? null;
      const sessionIsComplete = stripeSession.status === "complete";
      const paymentIsResolved = stripeSession.payment_status === "paid" || stripeSession.payment_status === "no_payment_required";
      if (!sessionIsComplete || !paymentIsResolved) {
        return NextResponse.json(
          { subscription: null, plan: "free", planSource: "free", barbershopId, isBillingOwner, checkoutPending: true, stripeSubscriptionId: null },
          { headers: { "Cache-Control": "no-store" } },
        );
      }

      if (stripeSession.subscription) {
        const stripeSubscription = typeof stripeSession.subscription === "string"
          ? await getStripeClient().subscriptions.retrieve(stripeSession.subscription)
          : stripeSession.subscription;

        if (customerId) {
          const { error: billingAccountError } = await database.from("barbershop_billing_accounts").upsert({
            barbershop_id: barbershopId,
            billing_owner_user_id: user.id,
            stripe_customer_id: customerId,
            billing_email: email,
          }, { onConflict: "barbershop_id" });
          if (billingAccountError) {
            throw new BillingError("Could not persist the Stripe billing account.", "DB_WRITE_FAILED", { barbershopId, customerId });
          }

          const { error: customerError } = await database.from("customers").upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            email,
          }, { onConflict: "user_id" });
          if (customerError) {
            throw new BillingError("Could not persist the Stripe customer mapping.", "DB_WRITE_FAILED", { userId: user.id, customerId });
          }
        }

        // Fallback synchronization path for the success page when the Stripe webhook is delayed.
        await BarbershopStripeService.syncFromStripe(barbershopId, user.id, stripeSubscription);

        const { data: persistedSubscription, error: subscriptionError } = await database
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("barbershop_id", barbershopId)
          .eq("stripe_subscription_id", stripeSubscription.id)
          .maybeSingle();

        if (subscriptionError) {
          throw new BillingError("Could not verify the persisted subscription.", "DB_READ_FAILED", {
            userId: user.id,
            barbershopId,
            subscriptionId: stripeSubscription.id,
          });
        }

        if (!persistedSubscription) {
          throw new BillingError("The Stripe subscription could not be persisted to Supabase.", "DB_WRITE_FAILED", {
            userId: user.id,
            barbershopId,
            subscriptionId: stripeSubscription.id,
          });
        }
      }
    }

    let subscription = await BarbershopStripeService.reconcileSubscription(
      barbershopId,
      await BarbershopStripeService.getSubscriptionForBarbershop(barbershopId),
    );

    if (!subscription) {
      await recoverLatestStripeSubscription(barbershopId, user.id, email);
      subscription = await BarbershopStripeService.reconcileSubscription(
        barbershopId,
        await BarbershopStripeService.getSubscriptionForBarbershop(barbershopId),
      );
    }

    const plan = await BarbershopStripeService.getEffectivePlan(user.id);
    const { data: assignment, error: assignmentError } = await database
      .from("barbershop_plan_assignments")
      .select("plan, expires_at")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();
    if (assignmentError) throw new BillingError("Could not load barbershop plan assignment.", "DB_READ_FAILED", { barbershopId });

    const hasActiveAssignment = Boolean(assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now()));
    const planSource = hasActiveAssignment
      ? "admin"
      : subscription?.plan_override
        ? "subscription_override"
        : plan !== "free"
          ? "stripe"
          : "free";

    return NextResponse.json({
      subscription,
      plan,
      planSource,
      barbershopId,
      isBillingOwner,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
