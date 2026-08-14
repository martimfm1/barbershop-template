import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { billingErrorResponse } from "@/services/billing/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const barbershopId = await SubscriptionService.getBarbershopIdForUser(user.id);
    if (!barbershopId) return NextResponse.json({ subscription: null, plan: "free" });
    const [subscription, plan] = await Promise.all([
      SubscriptionService.getForBarbershop(barbershopId),
      SubscriptionService.getAccessPlanForBarbershop(barbershopId),
    ]);
    return NextResponse.json({ subscription, plan, barbershopId });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
