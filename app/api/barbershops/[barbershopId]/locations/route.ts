import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/validation";

export const runtime = "nodejs";

async function getAdminContext(barbershopId: string) {
  if (!UUID_PATTERN.test(barbershopId)) return { response: NextResponse.json({ error: "Identificador inválido." }, { status: 400 }) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("barbershop_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.barbershop_id !== barbershopId) {
    return { response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }
  if (!profile.role || !["admin", "owner"].includes(profile.role)) {
    return { response: NextResponse.json({ error: "Apenas administradores podem gerir localizações." }, { status: 403 }) };
  }
  return { user, admin };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  const { barbershopId } = await params;
  const context = await getAdminContext(barbershopId);
  if ("response" in context) return context.response;

  const { data, error } = await context.admin
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
    const { barbershopId } = await params;
    const context = await getAdminContext(barbershopId);
    if ("response" in context) return context.response;

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 160) {
      return NextResponse.json({ error: "O nome da localização é obrigatório e deve ter no máximo 160 caracteres." }, { status: 400 });
    }

    const { data, error } = await context.admin.rpc("create_location_with_quota", {
      p_user_id: context.user.id,
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
          code: "PLAN_LIMIT_REACHED", resource, current: Number(current), limit: Number(limit), plan, requiredPlan,
          error: `Limite de ${resource} atingido (${current}/${limit}) no plano ${plan}. Faz upgrade para ${requiredPlan}.`,
        }, { status: 409 });
      }
      if (message.startsWith("forbidden:")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      console.error("[LOCATION_CREATE_ERROR]", error);
      return NextResponse.json({ error: "Não foi possível criar a localização." }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[LOCATION_CREATE_INTERNAL]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  const { barbershopId } = await params;
  const context = await getAdminContext(barbershopId);
  if ("response" in context) return context.response;

  const body = await request.json().catch(() => ({}));
  const locationId = typeof body?.id === "string" ? body.id : "";
  if (!UUID_PATTERN.test(locationId)) return NextResponse.json({ error: "Localização inválida." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of ["phone", "address", "city", "opening_time", "closing_time", "lunch_start", "lunch_end", "closed_days"]) {
    if (body?.[key] !== undefined) updates[key] = body[key];
  }
  if (body?.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160) {
      return NextResponse.json({ error: "Nome de localização inválido." }, { status: 400 });
    }
    updates.name = body.name.trim();
  }
  if (body?.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await context.admin
    .from("locations")
    .update(updates)
    .eq("id", locationId)
    .eq("barbershop_id", barbershopId)
    .select("id, barbershop_id, name, phone, address, city, opening_time, closing_time, lunch_start, lunch_end, closed_days, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[LOCATION_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Não foi possível atualizar a localização." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Localização não encontrada." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ barbershopId: string }> },
) {
  const { barbershopId } = await params;
  const context = await getAdminContext(barbershopId);
  if ("response" in context) return context.response;

  const body = await request.json().catch(() => ({}));
  const locationId = typeof body?.id === "string" ? body.id : new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID_PATTERN.test(locationId)) return NextResponse.json({ error: "Localização inválida." }, { status: 400 });

  const { count, error: countError } = await context.admin
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_id", barbershopId);
  if (countError) return NextResponse.json({ error: "Não foi possível validar a localização." }, { status: 500 });
  if ((count ?? 0) <= 1) return NextResponse.json({ error: "A barbearia precisa de pelo menos uma localização." }, { status: 409 });

  const { data, error } = await context.admin
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("barbershop_id", barbershopId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[LOCATION_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Não foi possível remover a localização." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Localização não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}
