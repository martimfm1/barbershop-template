import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { barbershopId } = await params;
  if (!UUID_PATTERN.test(barbershopId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("barbershop_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.barbershop_id !== barbershopId) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { data, error } = await admin
    .from("locations")
    .select("id, barbershop_id, name, phone, address, city, opening_time, closing_time, lunch_start, lunch_end, closed_days, is_active, created_at, updated_at")
    .eq("barbershop_id", barbershopId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[LOCATIONS_LIST_ERROR]", error);
    return NextResponse.json({ error: "Não foi possível carregar as localizações." }, { status: 500 });
  }

  return NextResponse.json({ data });
}

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

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("barbershop_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.barbershop_id !== barbershopId) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    if (!profile.role || !["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Apenas administradores podem criar localizações." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 160) {
      return NextResponse.json({ error: "O nome da localização é obrigatório e deve ter no máximo 160 caracteres." }, { status: 400 });
    }

    const { data, error } = await admin.rpc("create_location_with_quota", {
      p_user_id: user.id,
      p_barbershop_id: barbershopId,
      p_name: name,
      p_phone: typeof body?.phone === "string" ? body.phone.trim() || null : null,
      p_address: typeof body?.address === "string" ? body.address.trim() || null : null,
      p_city: typeof body?.city === "string" ? body.city.trim() || null : null,
      p_opening_time: typeof body?.opening_time === "string" ? body.opening_time : null,
      p_closing_time: typeof body?.closing_time === "string" ? body.closing_time : null,
    });

    if (error) {
      const message = error.message ?? "";
      if (message.startsWith("quota_exceeded|")) {
        const [, resource, current, limit, plan, requiredPlan] = message.split("|");
        return NextResponse.json({
          code: "PLAN_LIMIT_REACHED",
          resource,
          current: Number(current),
          limit: Number(limit),
          plan,
          requiredPlan,
          error: `Limite de ${resource} atingido (${current}/${limit}) no plano ${plan}. Faz upgrade para ${requiredPlan}.`,
        }, { status: 409 });
      }
      if (message.startsWith("forbidden:")) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }
      console.error("[LOCATION_CREATE_ERROR]", error);
      return NextResponse.json({ error: "Não foi possível criar a localização." }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[LOCATION_CREATE_INTERNAL]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
