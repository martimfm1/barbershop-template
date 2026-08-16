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
  const [{ data: member }, { data: rewards }] = await Promise.all([
    admin
      .from("loyalty_members")
      .select("id, email, name, points_balance")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", session.email)
      .maybeSingle(),
    admin
      .from("loyalty_rewards")
      .select("id, name, description, points_required")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("active", true)
      .order("points_required", { ascending: true }),
  ]);

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    member: member ?? { email: session.email, name: null, points_balance: 0 },
    rewards: rewards ?? [],
    barbershop: { name: profile.name, slug: profile.slug },
  }, { headers: { "Cache-Control": "no-store" } });
}
