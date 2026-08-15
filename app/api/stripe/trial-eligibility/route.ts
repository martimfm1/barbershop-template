import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing/billing.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ eligible: false }, { status: 401 });

    const eligible = await BillingService.isEligibleForProTrial(user.id);
    return NextResponse.json(
      { eligible, trialDays: 14, plan: "pro" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ eligible: false }, { status: 500 });
  }
}
