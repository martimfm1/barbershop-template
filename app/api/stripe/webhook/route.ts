import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse } from "@/services/billing/http";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 });

  try {
    const event = getStripeClient().webhooks.constructEvent(await request.text(), signature, webhookSecret);
    await BillingService.processWebhookEvent(event);
    console.info("billing.webhook_processed", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof BillingError) return billingErrorResponse(error);
    console.warn("billing.webhook_rejected", { error: error instanceof Error ? error.name : "unknown" });
    return billingErrorResponse(new BillingError("Webhook signature verification failed.", "WEBHOOK_VERIFICATION_FAILED"));
  }
}
