import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireTenantAuthorization } from "@/services/modules/tenant-authorization";

const TEAM_VIEW_ROLES = ["owner", "admin"] as const;

export async function GET(request: Request) {
  const tenant = await requireTenantAuthorization(request, TEAM_VIEW_ROLES);
  if (!tenant.ok) return NextResponse.json({ error: tenant.status === 401 ? "Nao autorizado" : "Sem permissao para ver a equipa." }, { status: tenant.status });

  const [{ data: members, error: membersError }, { data: permissionRows, error: permissionsError }, { data: inviteRows, error: invitesError }] = await Promise.all([
    tenant.admin.from("users").select("id, name_complete, email, num_phone, role").eq("barbershop_id", tenant.barbershopId),
    tenant.admin.from("barbershop_member_permissions").select("user_id, permissions").eq("barbershop_id", tenant.barbershopId),
    tenant.admin.from("barbershop_invite_codes").select("used_by, used_at").eq("barbershop_id", tenant.barbershopId).not("used_by", "is", null),
  ]);
  if (membersError || permissionsError || invitesError) {
    console.error("[TEAM_MEMBERS_LIST_FAIL]", { members: membersError?.message, permissions: permissionsError?.message, invites: invitesError?.message });
    return NextResponse.json({ error: "Nao foi possivel carregar os membros." }, { status: 500 });
  }

  const permissionsByUser = new Map((permissionRows ?? []).map((row) => [row.user_id, row.permissions ?? {}]));
  const inviteByUser = new Map<string, string>();
  for (const invite of inviteRows ?? []) {
    if (invite.used_by && (!inviteByUser.has(invite.used_by) || invite.used_at < inviteByUser.get(invite.used_by)!)) inviteByUser.set(invite.used_by, invite.used_at);
  }
  const orderedMembers = [...(members ?? [])].sort((a, b) => a.role === "owner" ? -1 : b.role === "owner" ? 1 : (a.name_complete || a.email || "").localeCompare(b.name_complete || b.email || ""));
  return NextResponse.json({ members: orderedMembers.map((member) => ({ user_id: member.id, name_complete: member.name_complete, email: member.email, num_phone: member.num_phone, role: member.role, joined_via_code: inviteByUser.has(member.id), joined_at: inviteByUser.get(member.id) ?? null, permissions: permissionsByUser.get(member.id) ?? {} })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body?.userId !== "string" || typeof body?.role !== "string") return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  const allowedRoles = new Set(["admin", "manager", "barber", "receptionist", "staff"]);
  if (!allowedRoles.has(body.role)) return NextResponse.json({ error: "Funcao invalida." }, { status: 400 });
  const permissions = body.permissions && typeof body.permissions === "object" && !Array.isArray(body.permissions) ? body.permissions : {};
  const { error } = await supabase.rpc("update_barbershop_member", { p_user_id: body.userId, p_role: body.role, p_permissions: permissions });
  if (error) {
    console.error("[TEAM_MEMBER_UPDATE_FAIL]", error);
    if (error.code === "42501") return NextResponse.json({ error: "So o proprietario pode alterar funcoes e permissoes." }, { status: 403 });
    return NextResponse.json({ error: error.message === "owner_role_is_immutable" ? "A funcao do proprietario nao pode ser alterada." : "Nao foi possivel atualizar o membro." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body?.userId !== "string") return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  const { error } = await supabase.rpc("remove_barbershop_member", { p_user_id: body.userId });
  if (error) {
    console.error("[TEAM_MEMBER_REMOVE_FAIL]", error);
    if (error.code === "42501") return NextResponse.json({ error: "So o proprietario pode remover membros." }, { status: 403 });
    return NextResponse.json({ error: error.message === "owner_role_is_immutable" ? "O proprietario nao pode ser removido." : "Nao foi possivel remover o membro." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
