import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessPlanForRequest } from "@/services/billing/plan-access.guard";
import { assertFeature } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getAccessPlanForRequest(user.id);
  try { assertFeature(plan, "loyalty"); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Feature not included" }, { status: 403 }); }

  const supabase = await createClient();
  const { data: settings } = await supabase.from("loyalty_settings").select("*").eq("barbershop_id", user.barbershop_id).maybeSingle();
  const { data: rewards, error } = await supabase.from("loyalty_rewards").select("*").eq("barbershop_id", user.barbershop_id).order("points_cost", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load loyalty data" }, { status: 500 });
  return NextResponse.json({ settings, rewards: rewards ?? [] });
}
