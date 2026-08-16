import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { billingErrorResponse } from "@/services/billing/http";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function markWebhookFailed(eventId: string, error: unknown) {
  const database = createAdminClient();
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const { error: markError } = await database.rpc("fail_stripe_webhook_event", {
    p_event_id: eventId,
    p_error: message,
  });
  if (markError) console.error("billing.webhook_ledger_fail_mark_failed", { eventId, error: markError });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 });

  let event: import("stripe").default.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.warn("billing.webhook_rejected", { error: error instanceof Error ? error.name : "unknown" });
    return billingErrorResponse(new BillingError("Webhook signature verification failed.", "WEBHOOK_VERIFICATION_FAILED"));
  }

  try {
    const database = createAdminClient();
    const { data: claimStatus, error: claimError } = await database.rpc("claim_stripe_webhook_event", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_lease_seconds: 300,
    });

    if (claimError) return billingErrorResponse(new BillingError("Webhook ledger unavailable.", "WEBHOOK_PROCESSING_FAILED"));
    if (claimStatus === "processed") return NextResponse.json({ received: true, duplicate: true });
    if (claimStatus === "processing") return NextResponse.json({ received: true, processing: true });
    if (claimStatus !== "claimed") return billingErrorResponse(new BillingError("Webhook claim could not be established.", "WEBHOOK_PROCESSING_FAILED"));

    try {
      await BarbershopStripeService.processWebhookEvent(event);
    } catch (error) {
      await markWebhookFailed(event.id, error);
      throw error;
    }

    const { error: completeError } = await database.rpc("complete_stripe_webhook_event", { p_event_id: event.id });
    if (completeError) return billingErrorResponse(new BillingError("Webhook acknowledgement could not be persisted.", "WEBHOOK_PROCESSING_FAILED"));

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof BillingError) return billingErrorResponse(error);
    console.error("billing.webhook_processing_failed", { error: error instanceof Error ? error.name : "unknown", eventId: event.id, eventType: event.type });
    return billingErrorResponse(new BillingError("Webhook processing failed.", "WEBHOOK_PROCESSING_FAILED"));
  }
}
