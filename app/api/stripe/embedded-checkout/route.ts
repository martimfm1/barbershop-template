import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    if (!priceId) throw new BillingError("The requested price is not available.", "INVALID_PRICE");

    const result = await BarbershopStripeService.createElementsCheckout(user.id, priceId);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[STRIPE_CUSTOM_CHECKOUT_ERROR]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof BillingError ? error.code : undefined,
      context: error instanceof BillingError ? error.context : undefined,
    });
    const status = error instanceof BillingError && error.code === "INVALID_PRICE" ? 400 : error instanceof BillingError && error.code === "SUBSCRIPTION_NOT_ACTIVE" ? 409 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível iniciar o checkout." }, { status });
  }
}
