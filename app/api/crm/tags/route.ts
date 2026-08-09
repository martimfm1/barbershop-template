import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function tenant(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("barbershop_id, role").eq("id", user.id).maybeSingle();
  if (!data?.barbershop_id || !["admin", "owner", "staff"].includes(data.role ?? "staff")) return null;
  return { admin, barbershopId: data.barbershop_id };
}

export async function GET(req: Request) {
  const t = await tenant(req);
  if (!t) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await t.admin.from("client_tags").select("id, name, created_at").eq("barbershop_id", t.barbershopId).order("name");
  if (error) return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  return NextResponse.json({ tags: data ?? [] });
}

export async function POST(req: Request) {
  const t = await tenant(req);
  if (!t) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 1 || name.length > 50) return NextResponse.json({ error: "Invalid tag name" }, { status: 400 });
  const { data, error } = await t.admin.from("client_tags").insert({ barbershop_id: t.barbershopId, name }).select("id, name, created_at").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  if (error) return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  return NextResponse.json({ tag: data }, { status: 201 });
}
