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

function errorResponse(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let tenantId: string | null = null;
  let rewardIdForLog: string | null = null;
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: unknown; rewardId?: unknown };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const rewardId = typeof body.rewardId === "string" ? body.rewardId : "";
    rewardIdForLog = rewardId || null;

    console.info("[LOYALTY_REDEEM] request", { requestId, slug, rewardId });

    if (!slug || !rewardId) {
      console.warn("[LOYALTY_REDEEM] invalid_request", { requestId, hasSlug: Boolean(slug), hasRewardId: Boolean(rewardId) });
      return errorResponse("Recompensa inválida.", 400, { requestId });
    }

    const tenant = await getLoyaltyTenantBySlug(slug);
    tenantId = tenant?.barbershopId ?? null;
    if (!tenant) {
      console.warn("[LOYALTY_REDEEM] tenant_unavailable", { requestId, slug });
      return errorResponse("Fidelização indisponível.", 404, { requestId });
    }

    await requireTenantAuthorization({ barbershopId: tenant.barbershopId, allowPublicTenant: true });

    const session = await getLoyaltySession(tenant.barbershopId);
    if (!session) {
      console.warn("[LOYALTY_REDEEM] session_missing", { requestId, barbershopId: tenant.barbershopId });
      return errorResponse("Sessão expirada. Confirma novamente o teu email.", 401, { requestId });
    }

    const admin = createAdminClient();
    const { data: enabledSettings, error: settingsError } = await admin
      .from("loyalty_settings")
      .select("enabled")
      .eq("barbershop_id", tenant.barbershopId)
      .maybeSingle();
    if (settingsError) {
      console.error("[LOYALTY_REDEEM] settings_lookup_failed", { requestId, code: settingsError.code, message: settingsError.message });
      return errorResponse("Não foi possível validar a fidelização.", 503, { requestId });
    }
    if (enabledSettings?.enabled !== true) {
      console.warn("[LOYALTY_REDEEM] program_disabled", { requestId, barbershopId: tenant.barbershopId });
      return errorResponse("A fidelização está desativada nesta barbearia.", 409, { requestId });
    }

    await admin.rpc("expire_loyalty_redemptions");

    const { data: member, error: memberError } = await admin
      .from("loyalty_members")
      .select("id, email, name, points_balance, status")
      .eq("barbershop_id", tenant.barbershopId)
      .eq("email", session.email)
      .eq("status", "active")
      .maybeSingle();
    if (memberError) {
      console.error("[LOYALTY_REDEEM] member_lookup_failed", { requestId, code: memberError.code, message: memberError.message });
      return errorResponse("Não foi possível carregar a adesão.", 503, { requestId });
    }
    if (!member) {
      console.warn("[LOYALTY_REDEEM] member_missing", { requestId, barbershopId: tenant.barbershopId });
      return errorResponse("Não tens uma adesão ativa nesta barbearia.", 409, { requestId });
    }

    const { data: reward, error: rewardLookupError } = await admin
      .from("loyalty_rewards")
      .select("id, name, description, points_cost, reward_type, reward_value, active")
      .eq("id", rewardId)
      .eq("barbershop_id", tenant.barbershopId)
      .eq("active", true)
      .maybeSingle();
    if (rewardLookupError) {
      console.error("[LOYALTY_REDEEM] reward_lookup_failed", { requestId, code: rewardLookupError.code, message: rewardLookupError.message });
      return errorResponse("Não foi possível carregar a recompensa.", 503, { requestId });
    }
    if (!reward) {
      console.warn("[LOYALTY_REDEEM] reward_missing", { requestId, barbershopId: tenant.barbershopId, rewardId });
      return errorResponse("Esta recompensa já não está disponível.", 404, { requestId });
    }

    console.info("[LOYALTY_REDEEM] eligibility", {
      requestId,
      barbershopId: tenant.barbershopId,
      memberId: member.id,
      pointsBalance: member.points_balance,
      pointsCost: reward.points_cost,
    });

    if (member.points_balance < reward.points_cost) {
      return errorResponse("Ainda não tens pontos suficientes para esta recompensa.", 409, { requestId });
    }

    const { data: existingRedemption, error: existingError } = await admin
      .from("loyalty_redemptions")
      .select("id")
      .eq("member_id", member.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (existingError) {
      console.error("[LOYALTY_REDEEM] pending_lookup_failed", { requestId, code: existingError.code, message: existingError.message });
      return errorResponse("Não foi possível validar os teus resgates pendentes.", 503, { requestId });
    }
    if (existingRedemption) {
      return errorResponse("Já tens uma recompensa reservada. Utiliza-a antes de criar outro resgate.", 409, { requestId });
    }

    const token = generateLoyaltyToken();
    const code = generateHumanCode();
    const tokenHash = hashLoyaltyToken(token);
    const codeHash = hashLoyaltyToken(code);
    const expiresAt = new Date(Date.now() + REDEMPTION_TTL_MS).toISOString();

    console.info("[LOYALTY_REDEEM] creating_redemption", { requestId, barbershopId: tenant.barbershopId, memberId: member.id, rewardId: reward.id });

    const { data: redemption, error } = await admin.rpc("redeem_loyalty_reward", {
      p_member_id: member.id,
      p_reward_id: reward.id,
      p_token_hash: tokenHash,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
    });
    if (error) {
      console.error("[LOYALTY_REDEEM] rpc_failed", {
        requestId,
        code: error.code ?? "UNKNOWN",
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      const map: Record<string, [string, number]> = {
        LOYALTY_INSUFFICIENT_POINTS: ["Ainda não tens pontos suficientes para esta recompensa.", 409],
        LOYALTY_REWARD_NOT_FOUND: ["Esta recompensa já não está disponível.", 404],
        LOYALTY_MEMBER_NOT_FOUND: ["Adesão inválida ou expirada.", 401],
      };
      const mapped = map[error.message];
      return mapped ? errorResponse(mapped[0], mapped[1], { requestId }) : errorResponse("Não foi possível resgatar a recompensa.", 503, { requestId });
    }

    const result = Array.isArray(redemption) ? redemption[0] : redemption;
    if (!result?.redemption_id) {
      console.error("[LOYALTY_REDEEM] rpc_empty_result", { requestId, redemptionType: typeof redemption });
      return errorResponse("Não foi possível criar o resgate.", 503, { requestId });
    }

    let emailSent = false;
    try {
      await sendLoyaltyRedemptionEmail({
        email: member.email,
        customerName: member.name,
        barbershopName: tenant.barbershopId,
        rewardName: reward.name,
        rewardDescription: reward.description,
        pointsCost: Number(result.points_cost),
        remainingPoints: Number(result.points_balance),
        code,
        qrPayload: token,
        expiresAt,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("[LOYALTY_REDEEM] email_failed", { requestId, error: emailError instanceof Error ? emailError.name : "UnknownError" });
    }

    console.info("[LOYALTY_REDEEM] success", { requestId, barbershopId: tenant.barbershopId, memberId: member.id, rewardId: reward.id, redemptionId: result.redemption_id, emailSent });

    return NextResponse.json({
      success: true,
      emailSent,
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
  } catch (error) {
    console.error("[LOYALTY_REDEEM] unexpected_error", {
      requestId,
      tenantId,
      rewardId: rewardIdForLog,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse("Não foi possível processar o resgate.", 503, { requestId });
  }
}
