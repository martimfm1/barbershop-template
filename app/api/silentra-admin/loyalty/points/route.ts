import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/internal/platform-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin();
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const barbershopId = typeof body?.barbershopId === "string" ? body.barbershopId.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const points = Number(body?.points);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!UUID_RE.test(barbershopId)) return NextResponse.json({ error: "Barbearia inválida." }, { status: 400 });
    if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    if (!Number.isInteger(points) || points <= 0 || points > 1000000) return NextResponse.json({ error: "Os pontos devem ser um inteiro entre 1 e 1.000.000." }, { status: 400 });
    if (!reason || reason.length > 500) return NextResponse.json({ error: "Indica um motivo (máx. 500 caracteres)." }, { status: 400 });

    const { data, error } = await admin.rpc("admin_grant_loyalty_points", {
      p_barbershop_id: barbershopId,
      p_email: email,
      p_points: points,
      p_reason: reason,
    });

    if (error) {
      if (error.message === "LOYALTY_MEMBER_NOT_FOUND") return NextResponse.json({ error: "Não existe um membro ativo de fidelização com esse email nesta barbearia." }, { status: 404 });
      if (error.message === "LOYALTY_PROGRAM_UNAVAILABLE") return NextResponse.json({ error: "A fidelização não está disponível para esta barbearia." }, { status: 409 });
      console.error("[SILENTRA_ADMIN_LOYALTY_GRANT]", error);
      return NextResponse.json({ error: "Não foi possível atribuir os pontos." }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, member: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformAdminError") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("[SILENTRA_ADMIN_LOYALTY_GRANT]", error);
    return NextResponse.json({ error: "Não foi possível atribuir os pontos." }, { status: 500 });
  }
}
