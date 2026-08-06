import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse, readJsonObject } from "@/services/billing/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { priceId } = await readJsonObject(request);
    if (typeof priceId !== "string") return NextResponse.json({ error: "priceId is required." }, { status: 400 });
    return NextResponse.json(await BillingService.createSubscription(user.id, user.email, priceId));
  } catch (error) { return billingErrorResponse(error); }
}
