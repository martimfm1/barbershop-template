import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse } from "@/services/billing/http";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 });
  }

  try {
    const event = getStripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
    const database = createAdminClient();

    const { data: alreadyProcessed, error: ledgerReadError } = await database
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (ledgerReadError) {
      console.error("billing.webhook_ledger_read_failed", { eventId: event.id });
      return billingErrorResponse(
        new BillingError("Webhook ledger unavailable.", "WEBHOOK_PROCESSING_FAILED"),
      );
    }

    if (alreadyProcessed?.event_id) {
      console.info("billing.webhook_duplicate", { eventId: event.id, eventType: event.type });
      return NextResponse.json({ received: true, duplicate: true });
    }

    await BillingService.processWebhookEvent(event);

    const { error: ledgerWriteError } = await database
      .from("stripe_webhook_events")
      .upsert(
        {
          event_id: event.id,
          event_type: event.type,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "event_id" },
      );

    if (ledgerWriteError) {
      console.error("billing.webhook_ledger_write_failed", { eventId: event.id });
      return billingErrorResponse(
        new BillingError("Webhook acknowledgement could not be persisted.", "WEBHOOK_PROCESSING_FAILED"),
      );
    }

    console.info("billing.webhook_processed", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof BillingError) return billingErrorResponse(error);
    console.warn("billing.webhook_rejected", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return billingErrorResponse(
      new BillingError("Webhook signature verification failed.", "WEBHOOK_VERIFICATION_FAILED"),
    );
  }
}
