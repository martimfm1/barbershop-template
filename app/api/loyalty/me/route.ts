import { NextResponse } from "next/server";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySession } from "@/lib/loyalty/session";
import { requireTenantAuthorization } from "@/lib/security/tenant-guard";

export const runtime = "nodejs";

type LoyaltyMember = {
  id: string;
  email: string;
  name: string | null;
  points_balance: number;
  status: string;
};

type LoyaltyReward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: number | null;
  active: boolean;
};

type LoyaltyRedemption = {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  validated_at: string | null;
};

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() || "";
  const profile = await getPublicProfileBySlug(slug);
  if (!profile?.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) {
    return NextResponse.json({ error: "Fidelização indisponível." }, { status: 404 });
  }

  try {
    // Public tenant validation; loyalty session below provides endpoint-specific authentication.
    await requireTenantAuthorization({ barbershopId: profile.barbershop_id, allowPublicTenant: true });
  } catch {
    return NextResponse.json({ error: "Fidelização indisponível." }, { status: 404 });
  }

  const session = await getLoyaltySession(profile.barbershop_id);
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const admin = createAdminClient();
  await admin.rpc("expire_loyalty_redemptions");

  const { data: memberData, error: memberError } = await admin
    .from("loyalty_members")
    .select("id, email, name, points_balance, status")
    .eq("barbershop_id", profile.barbershop_id)
    .eq("email", session.email)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) {
    return NextResponse.json(
      { error: "Não foi possível carregar a fidelização." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const member = memberData as LoyaltyMember | null;

  const [{ data: rewardsData, error: rewardsError }, { data: redemptionsData, error: redemptionsError }] = await Promise.all([
    admin
      .from("loyalty_rewards")
      .select("id, name, description, points_cost, reward_type, reward_value, active")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("active", true)
      .order("points_cost", { ascending: true }),
    member
      ? admin
          .from("loyalty_redemptions")
          .select("id, reward_id, points_spent, status, expires_at, created_at, validated_at")
          .eq("barbershop_id", profile.barbershop_id)
          .eq("member_id", member.id)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] as LoyaltyRedemption[], error: null }),
  ]);

  if (rewardsError || redemptionsError) {
    return NextResponse.json(
      { error: "Não foi possível carregar a fidelização." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rewards = (rewardsData ?? []) as LoyaltyReward[];
  const redemptions = (redemptionsData ?? []) as LoyaltyRedemption[];
  const points = member?.points_balance ?? 0;
  const nextReward = rewards.find((reward) => reward.points_cost > points) ?? null;

  return NextResponse.json(
    {
      authenticated: true,
      email: session.email,
      member: member ?? {
        email: session.email,
        name: null,
        points_balance: 0,
        status: "active",
      },
      rewards,
      redemptions,
      nextReward,
      barbershop: { name: profile.name, slug: profile.slug },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
