import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { BillingError } from "@/types/stripe";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOG_PREFIX = "[billing.checkout-success]";

type LogContext = Record<string, unknown>;

function logInfo(message: string, context: LogContext = {}) {
  console.info(`${LOG_PREFIX} ${message}`, context);
}

function logWarn(message: string, context: LogContext = {}) {
  console.warn(`${LOG_PREFIX} ${message}`, context);
}

function logError(message: string, error: unknown, context: LogContext = {}) {
  console.error(`${LOG_PREFIX} ${message}`, {
    ...context,
    error: error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error,
  });
}

function supabaseErrorContext(error: { code?: string; message?: string; details?: string; hint?: string } | null | undefined) {
  if (!error) return null;
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  };
}

async function recoverLatestStripeSubscription(barbershopId: string, userId: string, email: string): Promise<void> {
  const database = createAdminClient();
  logInfo("Starting Stripe subscription recovery", { barbershopId, userId });

  let account = await BarbershopStripeService.getBillingAccount(barbershopId);
  logInfo("Loaded billing account", {
    barbershopId,
    hasStripeCustomer: Boolean(account?.stripe_customer_id),
  });

  if (!account?.stripe_customer_id) {
    const customers = await getStripeClient().customers.list({ email, limit: 20 });
    const matchingCustomer = customers.data.find((customer) =>
      !customer.deleted && (
        customer.metadata?.barbershop_id === barbershopId ||
        customer.metadata?.billing_owner_user_id === userId ||
        customer.metadata?.user_id === userId
      ),
    );

    logInfo("Stripe customer recovery lookup completed", {
      barbershopId,
      customerCount: customers.data.length,
      matchedCustomerId: matchingCustomer?.id ?? null,
    });

    if (matchingCustomer) {
      const { error } = await database.from("barbershop_billing_accounts").upsert({
        barbershop_id: barbershopId,
        billing_owner_user_id: userId,
        stripe_customer_id: matchingCustomer.id,
        billing_email: email,
      }, { onConflict: "barbershop_id" });
      if (error) {
        logError("Failed to persist recovered billing account", error, {
          barbershopId,
          userId,
          stripeCustomerId: matchingCustomer.id,
          supabase: supabaseErrorContext(error),
        });
        throw new BillingError("Could not recover the Stripe billing account.", "DB_WRITE_FAILED", { barbershopId, customerId: matchingCustomer.id });
      }

      const { error: customerError } = await database.from("customers").upsert({
        user_id: userId,
        stripe_customer_id: matchingCustomer.id,
        email,
      }, { onConflict: "user_id" });
      if (customerError) {
        logError("Failed to persist recovered Stripe customer mapping", customerError, {
          barbershopId,
          userId,
          stripeCustomerId: matchingCustomer.id,
          supabase: supabaseErrorContext(customerError),
        });
        throw new BillingError("Could not persist the Stripe customer mapping.", "DB_WRITE_FAILED", { userId, customerId: matchingCustomer.id });
      }

      account = await BarbershopStripeService.getBillingAccount(barbershopId);
    }
  }

  if (!account?.stripe_customer_id) {
    logWarn("Subscription recovery stopped: no Stripe customer is linked", { barbershopId, userId });
    return;
  }

  const subscriptions = await getStripeClient().subscriptions.list({
    customer: account.stripe_customer_id,
    status: "all",
    limit: 20,
  });
  const latest = [...subscriptions.data]
    .sort((a, b) => b.created - a.created)
    .find((subscription) => ["active", "trialing", "past_due", "unpaid", "incomplete", "canceled"].includes(subscription.status));

  logInfo("Stripe subscription recovery lookup completed", {
    barbershopId,
    userId,
    stripeCustomerId: account.stripe_customer_id,
    subscriptionCount: subscriptions.data.length,
    latestSubscriptionId: latest?.id ?? null,
    latestStatus: latest?.status ?? null,
  });

  if (!latest) return;

  try {
    await BarbershopStripeService.syncFromStripe(barbershopId, account.billing_owner_user_id ?? userId, latest);
    logInfo("Recovered Stripe subscription synced successfully", {
      barbershopId,
      userId,
      stripeSubscriptionId: latest.id,
      stripeStatus: latest.status,
    });
  } catch (error) {
    logError("Failed to sync recovered Stripe subscription", error, {
      barbershopId,
      userId,
      stripeSubscriptionId: latest.id,
      stripeStatus: latest.status,
    });
    throw error;
  }
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  let context: LogContext = { requestId };

  try {
    logInfo("Checkout success subscription request started", { requestId });

    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) {
      logWarn("Checkout success request rejected: unauthorized", {
        requestId,
        authError: error?.message ?? null,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const database = createAdminClient();
    const { data: userRow, error: userError } = await database
      .from("users")
      .select("barbershop_id, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      logError("Failed to load SaaS user", userError, {
        requestId,
        userId: user.id,
        supabase: supabaseErrorContext(userError),
      });
      throw new BillingError("Could not resolve SaaS account.", "DB_READ_FAILED", { userId: user.id });
    }

    const barbershopId = userRow?.barbershop_id ?? null;
    const isBillingOwner = String(userRow?.role ?? "").toLowerCase() === "owner";
    const email = String(userRow?.email ?? user.email ?? "").trim().toLowerCase();
    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get("session_id")?.trim() || null;

    context = {
      requestId,
      userId: user.id,
      barbershopId,
      sessionId: checkoutSessionId,
      isBillingOwner,
    };

    logInfo("Checkout success request context resolved", context);

    if (!barbershopId) {
      logWarn("Checkout success request has no barbershop", context);
      return NextResponse.json(
        { subscription: null, plan: "free", planSource: "free", barbershopId: null, isBillingOwner, stripeSubscriptionId: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (checkoutSessionId) {
      logInfo("Retrieving Stripe Checkout Session", context);
      let stripeSession: Awaited<ReturnType<ReturnType<typeof getStripeClient>["checkout"]["sessions"]["retrieve"]>>;

      try {
        stripeSession = await getStripeClient().checkout.sessions.retrieve(checkoutSessionId, { expand: ["subscription"] });
      } catch (error) {
        logError("Stripe Checkout Session retrieval failed", error, context);
        throw error;
      }

      const metadataBarbershopId = stripeSession.metadata?.barbershop_id ?? stripeSession.client_reference_id ?? null;
      const customerId = typeof stripeSession.customer === "string" ? stripeSession.customer : stripeSession.customer?.id ?? null;
      const stripeSubscriptionId = typeof stripeSession.subscription === "string"
        ? stripeSession.subscription
        : stripeSession.subscription?.id ?? null;

      logInfo("Stripe Checkout Session retrieved", {
        ...context,
        stripeSessionStatus: stripeSession.status,
        paymentStatus: stripeSession.payment_status,
        metadataBarbershopId,
        stripeCustomerId: customerId,
        stripeSubscriptionId,
        hasSubscription: Boolean(stripeSession.subscription),
      });

      if (metadataBarbershopId && metadataBarbershopId !== barbershopId) {
        logWarn("Checkout session belongs to a different barbershop", {
          ...context,
          metadataBarbershopId,
        });
        throw new BillingError("Checkout session does not belong to this barbershop.", "SUBSCRIPTION_NOT_ACTIVE", { userId: user.id, barbershopId, sessionId: checkoutSessionId });
      }

      const sessionIsComplete = stripeSession.status === "complete";
      const paymentIsResolved = stripeSession.payment_status === "paid" || stripeSession.payment_status === "no_payment_required";
      if (!sessionIsComplete || !paymentIsResolved) {
        logWarn("Checkout session is not ready for subscription persistence", {
          ...context,
          stripeSessionStatus: stripeSession.status,
          paymentStatus: stripeSession.payment_status,
          stripeSubscriptionId,
        });
        return NextResponse.json(
          { subscription: null, plan: "free", planSource: "free", barbershopId, isBillingOwner, checkoutPending: true, stripeSubscriptionId: null },
          { headers: { "Cache-Control": "no-store" } },
        );
      }

      if (stripeSession.subscription) {
        const stripeSubscription = typeof stripeSession.subscription === "string"
          ? await getStripeClient().subscriptions.retrieve(stripeSession.subscription)
          : stripeSession.subscription;

        logInfo("Stripe subscription resolved from checkout session", {
          ...context,
          stripeSubscriptionId: stripeSubscription.id,
          stripeSubscriptionStatus: stripeSubscription.status,
          stripeCustomerId: typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : stripeSubscription.customer?.id ?? null,
        });

        if (customerId) {
          const { error: billingAccountError } = await database.from("barbershop_billing_accounts").upsert({
            barbershop_id: barbershopId,
            billing_owner_user_id: user.id,
            stripe_customer_id: customerId,
            billing_email: email,
          }, { onConflict: "barbershop_id" });
          if (billingAccountError) {
            logError("Failed to persist barbershop Stripe billing account", billingAccountError, {
              ...context,
              stripeCustomerId: customerId,
              supabase: supabaseErrorContext(billingAccountError),
            });
            throw new BillingError("Could not persist the Stripe billing account.", "DB_WRITE_FAILED", { barbershopId, customerId });
          }
          logInfo("Barbershop Stripe billing account persisted", {
            ...context,
            stripeCustomerId: customerId,
          });

          const { error: customerError } = await database.from("customers").upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            email,
          }, { onConflict: "user_id" });
          if (customerError) {
            logError("Failed to persist Stripe customer mapping", customerError, {
              ...context,
              stripeCustomerId: customerId,
              supabase: supabaseErrorContext(customerError),
            });
            throw new BillingError("Could not persist the Stripe customer mapping.", "DB_WRITE_FAILED", { userId: user.id, customerId });
          }
          logInfo("Stripe customer mapping persisted", {
            ...context,
            stripeCustomerId: customerId,
          });
        } else {
          logWarn("Stripe checkout session has no customer ID", {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
          });
        }

        try {
          logInfo("Starting authoritative subscription sync to Supabase", {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
          });
          await BarbershopStripeService.syncFromStripe(barbershopId, user.id, stripeSubscription);
          logInfo("Authoritative subscription sync completed", {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
          });
        } catch (error) {
          logError("Authoritative subscription sync failed", error, {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
            stripeSubscriptionStatus: stripeSubscription.status,
          });
          throw error;
        }

        logInfo("Verifying subscription row in Supabase", {
          ...context,
          stripeSubscriptionId: stripeSubscription.id,
        });
        const { data: persistedSubscription, error: subscriptionError } = await database
          .from("subscriptions")
          .select("id, user_id, barbershop_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan, status, trial_end, current_period_end, cancel_at_period_end")
          .eq("user_id", user.id)
          .eq("barbershop_id", barbershopId)
          .eq("stripe_subscription_id", stripeSubscription.id)
          .maybeSingle();

        if (subscriptionError) {
          logError("Supabase subscription verification query failed", subscriptionError, {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
            supabase: supabaseErrorContext(subscriptionError),
          });
          throw new BillingError("Could not verify the persisted subscription.", "DB_READ_FAILED", {
            userId: user.id,
            barbershopId,
            subscriptionId: stripeSubscription.id,
          });
        }

        if (!persistedSubscription) {
          logError("Subscription sync returned successfully but no subscription row was found", new Error("subscriptions row not found after sync"), {
            ...context,
            stripeSubscriptionId: stripeSubscription.id,
            expected: {
              userId: user.id,
              barbershopId,
              stripeSubscriptionId: stripeSubscription.id,
            },
          });
          throw new BillingError("The Stripe subscription could not be persisted to Supabase.", "DB_WRITE_FAILED", {
            userId: user.id,
            barbershopId,
            subscriptionId: stripeSubscription.id,
          });
        }

        logInfo("Subscription row verified in Supabase", {
          ...context,
          stripeSubscriptionId: persistedSubscription.stripe_subscription_id,
          supabaseSubscriptionId: persistedSubscription.id,
          plan: persistedSubscription.plan,
          status: persistedSubscription.status,
        });
      } else {
        logWarn("Completed Checkout Session has no subscription", context);
      }
    } else {
      logInfo("No checkout session_id provided; using existing subscription state", context);
    }

    let subscription = await BarbershopStripeService.reconcileSubscription(
      barbershopId,
      await BarbershopStripeService.getSubscriptionForBarbershop(barbershopId),
    );

    logInfo("Loaded current subscription state", {
      ...context,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
      plan: subscription?.plan ?? null,
      status: subscription?.status ?? null,
    });

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
    if (assignmentError) {
      logError("Failed to load plan assignment", assignmentError, {
        ...context,
        supabase: supabaseErrorContext(assignmentError),
      });
      throw new BillingError("Could not load barbershop plan assignment.", "DB_READ_FAILED", { barbershopId });
    }

    const hasActiveAssignment = Boolean(assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now()));
    const planSource = hasActiveAssignment
      ? "admin"
      : subscription?.plan_override
        ? "subscription_override"
        : plan !== "free"
          ? "stripe"
          : "free";

    logInfo("Checkout success subscription request completed", {
      ...context,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
      supabaseSubscriptionId: subscription?.id ?? null,
      plan,
      planSource,
      status: subscription?.status ?? null,
    });

    return NextResponse.json({
      subscription,
      plan,
      planSource,
      barbershopId,
      isBillingOwner,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("Checkout success subscription request failed", error, {
      ...context,
      billingErrorCode: error instanceof BillingError ? error.code : undefined,
      billingErrorContext: error instanceof BillingError ? error.context : undefined,
    });
    return billingErrorResponse(error);
  }
}
