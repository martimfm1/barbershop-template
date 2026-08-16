import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import { hashLoyaltyToken } from "@/lib/loyalty/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { identifier?: unknown; slug?: unknown };
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    if (!identifier || identifier.length > 256 || !slug) return NextResponse.json({ error: "Código inválido." }, { status: 400 });

    const profile = await getPublicProfileBySlug(slug);
    if (!profile?.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) return NextResponse.json({ error: "Fidelização indisponível." }, { status: 404 });

    const admin = createAdminClient();
    const hash = hashLoyaltyToken(identifier);
    const { data, error } = await admin.rpc("validate_loyalty_redemption", {
      p_barbershop_id: profile.barbershop_id,
      p_identifier_hash: hash,
      p_staff_user_id: user.id,
    });

    if (error) {
      const map: Record<string, [string, number]> = {
        LOYALTY_STAFF_UNAUTHORIZED: ["Não tens permissão para validar recompensas nesta barbearia.", 403],
        LOYALTY_REDEMPTION_INVALID: ["Código inválido, já utilizado ou inexistente.", 409],
        LOYALTY_REDEMPTION_EXPIRED: ["Este resgate expirou. Os pontos foram devolvidos ao cliente.", 409],
      };
      const mapped = map[error.message];
      return NextResponse.json({ error: mapped?.[0] ?? "Não foi possível validar o resgate." }, { status: mapped?.[1] ?? 503 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.redemption_id) return NextResponse.json({ error: "Resgate inválido." }, { status: 409 });

    await admin.from("audit_logs").insert({
      action: "loyalty_redemption_validated",
      entity_type: "loyalty_redemption",
      entity_id: result.redemption_id,
      metadata: { barbershop_id: profile.barbershop_id, staff_user_id: user.id },
    });

    return NextResponse.json({
      success: true,
      redemption: {
        id: result.redemption_id,
        rewardName: result.reward_name,
        pointsCost: result.points_cost,
        memberEmail: result.member_email,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível validar o resgate." }, { status: 503 });
  }
}
