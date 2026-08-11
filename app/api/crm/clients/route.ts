import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getTenantUser(req: Request) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, barbershop_id, role")
    .eq("id", authUser.id)
    .maybeSingle();

  // Dashboard access is based on tenant membership, not on a hard-coded list
  // of legacy role names. This keeps staff/manager/owner role variants working
  // while still preventing client accounts from reading the CRM.
  if (error || !data?.barbershop_id || data.id !== authUser.id || data.role === "client") return null;

  return { authUser, admin, barbershopId: data.barbershop_id };
}

export async function GET(req: Request) {
  const tenant = await getTenantUser(req);
  if (!tenant) return NextResponse.json({ error: "Não autenticado ou sem acesso à barbearia." }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  let query = tenant.admin
    .from("users")
    .select("id, name_complete, name, email, num_phone, style_notes, created_at", { count: "exact" })
    .eq("barbershop_id", tenant.barbershopId)
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`name_complete.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,num_phone.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível carregar os clientes." }, { status: 500 });
  return NextResponse.json({ clients: data ?? [], total: count ?? 0, limit, offset });
}
