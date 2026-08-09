import { NextResponse } from "next/server";
import { getAccessPlanForRequest } from "@/services/billing/plan-access.guard";
import { assertFeature } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("barbershop_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.barbershop_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const access = await getAccessPlanForRequest();
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertFeature(access.plan, "loyalty"); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Feature not included" }, { status: 403 }); }

  const { data: settings } = await supabase.from("loyalty_settings").select("*").eq("barbershop_id", profile.barbershop_id).maybeSingle();
  const { data: rewards, error } = await supabase.from("loyalty_rewards").select("*").eq("barbershop_id", profile.barbershop_id).order("points_cost", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load loyalty data" }, { status: 500 });
  return NextResponse.json({ settings, rewards: rewards ?? [] });
}