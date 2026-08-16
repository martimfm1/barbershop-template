import { NextResponse } from "next/server";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySession } from "@/lib/loyalty/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() || "";
  const profile = await getPublicProfileBySlug(slug);
  if (!profile?.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) {
    return NextResponse.json({ error: "Fidelização indisponível." }, { status: 404 });
  }

  const session = await getLoyaltySession(profile.barbershop_id);
  if (!session) return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });

  const admin = createAdminClient();
  await admin.rpc("expire_loyalty_redemptions");

  const [{ data: member }, { data: rewards }, { data: redemptions }] = await Promise.all([
    admin
      .from("loyalty_members")
      .select("id, email, name, points_balance, status")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", session.email)
      .eq("status", "active")
      .maybeSingle(),
    admin
      .from("loyalty_rewards")
      .select("id, name, description, points_cost, reward_type, reward_value, active")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("active", true)
      .order("points_cost", { ascending: true }),
    admin
      .from("loyalty_redemptions")
      .select("id, reward_id, points_spent, status, expires_at, created_at, validated_at")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("member_id", member?.id ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const points = member?.points_balance ?? 0;
  const nextReward = (rewards ?? []).find((reward) => reward.points_cost > points) ?? null;

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    member: member ?? { email: session.email, name: null, points_balance: 0, status: "active" },
    rewards: rewards ?? [],
    redemptions: redemptions ?? [],
    nextReward,
    barbershop: { name: profile.name, slug: profile.slug },
  }, { headers: { "Cache-Control": "no-store" } });
}
