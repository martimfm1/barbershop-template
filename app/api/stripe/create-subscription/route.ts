import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse, readJsonObject } from "@/services/billing/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await BillingService.assertBillingOwner(user.id);
    const body = await readJsonObject(request);
    if (typeof body.priceId !== "string") return NextResponse.json({ error: "priceId is required." }, { status: 400 });
    const promotionCode = typeof body.promotionCode === "string" ? body.promotionCode.trim() : undefined;
    if (promotionCode && promotionCode.length > 100) return NextResponse.json({ error: "Promotion code is too long." }, { status: 400 });
    return NextResponse.json(await BillingService.createSubscription(user.id, user.email, body.priceId, promotionCode));
  } catch (error) { return billingErrorResponse(error); }
}
