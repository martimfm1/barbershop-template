import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Creates a professional through the service-role boundary.
 * Quota enforcement and the insert itself happen atomically in Postgres.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { barbershopId } = await params;
    if (!UUID_PATTERN.test(barbershopId)) {
      return NextResponse.json({ error: "Identificador inválido.", code: "INVALID_BARBERSHOP_ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "O nome do barbeiro é obrigatório e deve ter no máximo 120 caracteres.", code: "INVALID_NAME" }, { status: 400 });
    }

    const commission = body.commission_percentage;
    if (
      commission !== undefined &&
      commission !== null &&
      (typeof commission !== "number" || !Number.isInteger(commission) || commission < 0 || commission > 100)
    ) {
      return NextResponse.json({ error: "A comissão deve ser um número inteiro entre 0 e 100.", code: "INVALID_COMMISSION" }, { status: 400 });
    }

    if (body.active !== undefined && typeof body.active !== "boolean") {
      return NextResponse.json({ error: "O campo active é inválido.", code: "INVALID_ACTIVE" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_professional_with_plan_quota", {
      p_actor_user_id: user.id,
      p_barbershop_id: barbershopId,
      p_name: name,
      p_commission_percentage: commission ?? null,
      p_active: body.active ?? true,
    });

    if (!error) return NextResponse.json({ data }, { status: 201 });

    switch (error.message) {
      case "BARBERSHOP_ACCESS_DENIED":
        return NextResponse.json({ error: "Acesso negado a esta barbearia.", code: "BARBERSHOP_ACCESS_DENIED" }, { status: 403 });
      case "PROFESSIONAL_MANAGEMENT_DENIED":
        return NextResponse.json({ error: "Não tens permissão para gerir profissionais.", code: "PROFESSIONAL_MANAGEMENT_DENIED" }, { status: 403 });
      case "PROFESSIONAL_LIMIT_REACHED":
        return NextResponse.json({
          error: "Atingiste o limite de profissionais do teu plano.",
          code: "LIMIT_REACHED",
        }, { status: 409 });
      case "INVALID_NAME":
      case "INVALID_COMMISSION":
        return NextResponse.json({ error: "Os dados do profissional são inválidos.", code: "INVALID_INPUT" }, { status: 400 });
      default:
        console.error("[PROFESSIONAL_CREATE_ERROR]", error);
        return NextResponse.json({ error: "Não foi possível criar o barbeiro.", code: "CREATE_PROFESSIONAL_FAILED" }, { status: 500 });
    }
  } catch (error) {
    console.error("[PROFESSIONAL_CREATE_INTERNAL]", error);
    return NextResponse.json({ error: "Erro interno.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
