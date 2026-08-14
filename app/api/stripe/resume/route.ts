import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing/billing.service";
import { billingErrorResponse } from "@/services/billing/http";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await BillingService.assertBillingOwner(user.id);
    await BillingService.resume(user.id);
    return NextResponse.json({ cancelAtPeriodEnd: false });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
