import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Creates a professional (barber) for the authenticated barbershop owner.
 *
 * The plan limit is enforced server-side inside the `create_professional_with_quota`
 * Postgres function (SECURITY DEFINER, table-locked), so the browser can no longer
 * bypass the quota by writing to `professionals` directly.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { barbershopId } = await params;
    if (!UUID_PATTERN.test(barbershopId)) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    // Ownership: the authenticated user must own this barbershop.
    const { data: profile, error: profileError } = await createAdminClient()
      .from("users")
      .select("barbershop_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.barbershop_id) {
      return NextResponse.json({ error: "Conta sem barbearia associada." }, { status: 403 });
    }
    if (profile.barbershop_id !== barbershopId) {
      return NextResponse.json({ error: "Acesso negado a esta barbearia." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "O nome do barbeiro é obrigatório." }, { status: 400 });
    }

    const commission =
      typeof body?.commission_percentage === "number" &&
      body.commission_percentage >= 0 &&
      body.commission_percentage <= 100
        ? body.commission_percentage
        : 50;
    const active = body?.active === undefined ? true : Boolean(body.active);

    const { data, error } = await createAdminClient().rpc("create_professional_with_quota", {
      p_barbershop_id: barbershopId,
      p_user_id: user.id,
      p_name: name,
      p_commission_percentage: commission,
      p_active: active,
    });

    if (error) {
      const message = error.message ?? "";
      if (message.startsWith("quota_exceeded|")) {
        const [, resource, current, limit, plan, requiredPlan] = message.split("|");
        return NextResponse.json(
          {
            code: "PLAN_LIMIT_REACHED",
            resource,
            current: Number(current),
            limit: Number(limit),
            plan,
            requiredPlan,
            error: `Limite de ${resource} atingido (${current}/${limit}) no plano ${plan}. Faz upgrade para ${requiredPlan}.`,
          },
          { status: 409 },
        );
      }
      if (message.startsWith("forbidden:")) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }
      console.error("[PROFESSIONAL_CREATE_ERROR]", error);
      return NextResponse.json({ error: "Não foi possível criar o barbeiro." }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[PROFESSIONAL_CREATE_INTERNAL]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
