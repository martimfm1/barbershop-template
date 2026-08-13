import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabase.rpc("list_barbershop_members");
  if (error) {
    console.error("[TEAM_MEMBERS_LIST_FAIL]", error);
    return NextResponse.json({ error: "Não foi possível carregar os membros." }, { status: error.code === "42501" ? 403 : 500 });
  }
  return NextResponse.json({ members: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (typeof body?.userId !== "string" || typeof body?.role !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const allowedRoles = new Set(["admin", "manager", "barber", "receptionist", "staff"]);
  if (!allowedRoles.has(body.role)) return NextResponse.json({ error: "Função inválida." }, { status: 400 });

  const permissions = body.permissions && typeof body.permissions === "object" && !Array.isArray(body.permissions) ? body.permissions : {};
  const { error } = await supabase.rpc("update_barbershop_member", {
    p_user_id: body.userId,
    p_role: body.role,
    p_permissions: permissions,
  });

  if (error) {
    console.error("[TEAM_MEMBER_UPDATE_FAIL]", error);
    if (error.code === "42501") return NextResponse.json({ error: "Só o proprietário pode alterar funções e permissões." }, { status: 403 });
    return NextResponse.json({ error: error.message === "owner_role_is_immutable" ? "A função do proprietário não pode ser alterada." : "Não foi possível atualizar o membro." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body?.userId !== "string") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { error } = await supabase.rpc("remove_barbershop_member", { p_user_id: body.userId });
  if (error) {
    console.error("[TEAM_MEMBER_REMOVE_FAIL]", error);
    if (error.code === "42501") return NextResponse.json({ error: "Só o proprietário pode remover membros." }, { status: 403 });
    return NextResponse.json({ error: error.message === "owner_role_is_immutable" ? "O proprietário não pode ser removido." : "Não foi possível remover o membro." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
