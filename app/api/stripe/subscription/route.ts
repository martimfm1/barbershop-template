import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const barbershopId = await SubscriptionService.getBarbershopIdForUser(user.id);
    if (!barbershopId) return NextResponse.json({ subscription: null, plan: "free", planSource: "free", barbershopId: null }, { headers: { "Cache-Control": "no-store" } });
    const [subscription, plan] = await Promise.all([
      SubscriptionService.getForBarbershop(barbershopId),
      SubscriptionService.getAccessPlanForBarbershop(barbershopId),
    ]);

    const hasAdminAssignment = plan !== "free" && !subscription?.stripe_subscription_id && !subscription?.plan_override;
    const planSource = hasAdminAssignment ? "admin" : subscription?.plan_override ? "subscription_override" : plan !== "free" ? "stripe" : "free";

    return NextResponse.json(
      { subscription, plan, planSource, barbershopId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
