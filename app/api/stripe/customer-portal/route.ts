import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    await BillingService.assertBillingOwner(user.id);

    const customer = await BillingService.getCustomerId(user.id);
    const origin = new URL(request.url).origin;
    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

    const session = await getStripeClient().billingPortal.sessions.create({
      customer,
      return_url: `${origin}/dashboard/billing`,
      ...(configuration ? { configuration } : {}),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "A Stripe não devolveu um URL válido para o Customer Portal." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { url: session.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[STRIPE_CUSTOMER_PORTAL_ERROR]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && "code" in error ? String((error as { code?: unknown }).code ?? "") : undefined,
      userAction: "open_customer_portal",
    });

    return billingErrorResponse(error);
  }
}
