import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySession, hashLoyaltyToken, generateLoyaltyToken } from "@/lib/loyalty/session";
import { sendLoyaltyRedemptionEmail } from "@/lib/brevo/loyalty";
import { requireTenantAuthorization } from "@/lib/security/tenant-guard";
import { getLoyaltyTenantBySlug } from "@/lib/loyalty/public-tenant";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
const REDEMPTION_TTL_MS = 60 * 60 * 1000;

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

    const tenant = await getLoyaltyTenantBySlug(slug);
    if (!tenant) return errorResponse("Fidelização indisponível.", 404);

    await requireTenantAuthorization({ barbershopId: tenant.barbershopId, allowPublicTenant: true });

    const session = await getLoyaltySession(tenant.barbershopId);
    if (!session) return errorResponse("Sessão expirada. Confirma novamente o teu email.", 401);

    const admin = createAdminClient();
    await admin.rpc("expire_loyalty_redemptions");

    const { data: member, error: memberError } = await admin.from("loyalty_members").select("id, email, name, points_balance, status").eq("barbershop_id", tenant.barbershopId).eq("email", session.email).eq("status", "active").maybeSingle();
    if (memberError) return errorResponse("Não foi possível carregar a adesão.", 503);
    if (!member) return errorResponse("Não tens uma adesão ativa nesta barbearia.", 409);

    const { data: existingRedemption } = await admin.from("loyalty_redemptions").select("id").eq("member_id", member.id).eq("status", "pending").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
    if (existingRedemption) return errorResponse("Já tens uma recompensa reservada. Utiliza-a antes de criar outro resgate.", 409);

    const token = generateLoyaltyToken();
    const code = generateHumanCode();
    const tokenHash = hashLoyaltyToken(token);
    const codeHash = hashLoyaltyToken(code);
    const expiresAt = new Date(Date.now() + REDEMPTION_TTL_MS).toISOString();

    const { data: redemption, error } = await admin.rpc("redeem_loyalty_reward", { p_member_id: member.id, p_reward_id: rewardId, p_token_hash: tokenHash, p_code_hash: codeHash, p_expires_at: expiresAt });
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

    const [{ data: reward }, { data: barbershop }] = await Promise.all([
      admin.from("loyalty_rewards").select("id, name, description, points_cost, reward_type, reward_value").eq("id", rewardId).eq("barbershop_id", tenant.barbershopId).maybeSingle(),
      admin.from("barbershops").select("name").eq("id", tenant.barbershopId).maybeSingle(),
    ]);
    if (!reward || !barbershop) return errorResponse("O resgate foi criado, mas não foi possível carregar os detalhes.", 503);

    let emailSent = false;
    try {
      await sendLoyaltyRedemptionEmail({ email: member.email, customerName: member.name, barbershopName: barbershop.name, rewardName: reward.name, rewardDescription: reward.description, pointsCost: Number(result.points_cost), remainingPoints: Number(result.points_balance), code, qrPayload: token, expiresAt });
      emailSent = true;
    } catch (emailError) {
      console.error("[LOYALTY_REDEMPTION_EMAIL_ERROR]", emailError instanceof Error ? emailError.name : "UnknownError");
    }

    return NextResponse.json({ success: true, emailSent, redemption: { id: result.redemption_id, pointsCost: result.points_cost, pointsBalance: result.points_balance, code, token, qrPayload: token, expiresAt } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Não foi possível processar o resgate.", 503);
  }
}
