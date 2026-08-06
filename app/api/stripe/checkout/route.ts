import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse, readJsonObject, safeReturnUrl } from "@/services/billing/http";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readJsonObject(request);
    if (typeof body.priceId !== "string" || body.priceId.length > 255) {
      throw new BillingError("A valid price ID is required.", "INVALID_PRICE");
    }

    const url = await BillingService.createCheckoutSession({
      userId: user.id,
      email: user.email,
      priceId: body.priceId,
      successUrl: safeReturnUrl(body.successUrl, "/dashboard/billing?checkout=success"),
      cancelUrl: safeReturnUrl(body.cancelUrl, "/pricing"),
    });
    return NextResponse.json({ url });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
