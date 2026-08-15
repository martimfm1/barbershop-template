import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/internal/platform-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = new Set(["free", "pro", "enterprise"]);

export async function PATCH(request: Request) {
  try {
    const { admin, user } = await requirePlatformAdmin();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const barbershopId = typeof body?.barbershopId === "string" ? body.barbershopId.trim() : "";
    const plan = typeof body?.plan === "string" ? body.plan.toLowerCase() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const expiresAt = body?.expiresAt === null || body?.expiresAt === "" ? null : typeof body?.expiresAt === "string" ? body.expiresAt : null;

    if (!barbershopId || !PLANS.has(plan)) {
      return NextResponse.json({ error: "Barbearia e plano válidos são obrigatórios." }, { status: 400 });
    }

    if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
      return NextResponse.json({ error: "A data de expiração é inválida." }, { status: 400 });
    }

    const { data: shop, error: shopError } = await admin.from("barbershops").select("id,name").eq("id", barbershopId).maybeSingle();
    if (shopError) throw shopError;
    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });

    const { data, error } = await admin.rpc("set_barbershop_plan_assignment", {
      p_barbershop_id: barbershopId,
      p_plan: plan,
      p_reason: reason,
      p_assigned_by: user.id,
      p_expires_at: expiresAt,
    });
    if (error) throw error;

    await admin.from("audit_logs").insert({
      action: "platform.plan_assignment.updated",
      entity_type: "barbershop",
      entity_id: barbershopId,
      metadata: { plan, reason, expires_at: expiresAt, shop_name: shop.name },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, assignment: data });
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformAdminError") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[SILENTRA_ADMIN_PLAN_PATCH]", error);
    return NextResponse.json({ error: "Não foi possível atribuir o plano." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin, user } = await requirePlatformAdmin();
    const url = new URL(request.url);
    const barbershopId = url.searchParams.get("barbershopId")?.trim() || "";
    if (!barbershopId) return NextResponse.json({ error: "barbershopId é obrigatório." }, { status: 400 });

    const { error } = await admin.rpc("clear_barbershop_plan_assignment", { p_barbershop_id: barbershopId });
    if (error) throw error;

    await admin.from("audit_logs").insert({
      action: "platform.plan_assignment.cleared",
      entity_type: "barbershop",
      entity_id: barbershopId,
      metadata: { actor_user_id: user.id },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformAdminError") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[SILENTRA_ADMIN_PLAN_DELETE]", error);
    return NextResponse.json({ error: "Não foi possível remover a atribuição." }, { status: 500 });
  }
}
