import { NextResponse } from "next/server";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLoyaltyToken, getLoyaltySession, hashLoyaltyToken } from "@/lib/loyalty/session";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

function generateHumanCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let value = "";
  for (let i = 0; i < 8; i += 1) value += alphabet[bytes[i] % alphabet.length];
  return value;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: unknown; rewardId?: unknown };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const rewardId = typeof body.rewardId === "string" ? body.rewardId : "";
    if (!slug || !rewardId) return errorResponse("Recompensa inválida.", 400);

    const profile = await getPublicProfileBySlug(slug);
    if (!profile?.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) return errorResponse("Fidelização indisponível.", 404);

    const session = await getLoyaltySession(profile.barbershop_id);
    if (!session) return errorResponse("Sessão expirada. Confirma novamente o teu email.", 401);

    const admin = createAdminClient();
    const { data: member, error: memberError } = await admin
      .from("loyalty_members")
      .select("id, email, name, points_balance, status")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", session.email)
      .eq("status", "active")
      .maybeSingle();
    if (memberError) return errorResponse("Não foi possível carregar a adesão.", 503);
    if (!member) return errorResponse("Não tens uma adesão ativa nesta barbearia.", 409);

    const token = generateLoyaltyToken();
    const code = generateHumanCode();
    const tokenHash = hashLoyaltyToken(token);
    const codeHash = hashLoyaltyToken(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: redemption, error } = await admin.rpc("redeem_loyalty_reward", {
      p_member_id: member.id,
      p_reward_id: rewardId,
      p_token_hash: tokenHash,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
    });

    if (error) {
      const map: Record<string, [string, number]> = {
        LOYALTY_INSUFFICIENT_POINTS: ["Ainda não tens pontos suficientes para esta recompensa.", 409],
        LOYALTY_REWARD_NOT_FOUND: ["Esta recompensa já não está disponível.", 404],
        LOYALTY_MEMBER_NOT_FOUND: ["Adesão inválida ou expirada.", 401],
      };
      const mapped = map[error.message];
      return mapped ? errorResponse(mapped[0], mapped[1]) : errorResponse("Não foi possível resgatar a recompensa.", 503);
    }

    const result = Array.isArray(redemption) ? redemption[0] : redemption;
    if (!result?.redemption_id) return errorResponse("Não foi possível criar o resgate.", 503);

    return NextResponse.json({
      success: true,
      redemption: {
        id: result.redemption_id,
        pointsCost: result.points_cost,
        pointsBalance: result.points_balance,
        code,
        token,
        qrPayload: token,
        expiresAt,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Não foi possível processar o resgate.", 503);
  }
}
