import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_ROLES = new Set(["admin", "barber", "receptionist"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const role = typeof body?.role === "string" ? body.role : "barber";

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Função inválida" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("create_barbershop_invite_code", {
      p_role: role,
    });

    if (error) {
      console.error("[TEAM_INVITE_CREATE_FAIL]", error);
      if (error.code === "42501") {
        return NextResponse.json({ error: "Apenas o proprietário ou administrador pode gerar códigos." }, { status: 403 });
      }
      if (error.code === "22023") {
        return NextResponse.json({ error: "Função inválida" }, { status: 400 });
      }
      return NextResponse.json({ error: "Não foi possível gerar o código." }, { status: 500 });
    }

    const invite = Array.isArray(data) ? data[0] : data;
    if (!invite?.code || !invite?.expires_at) {
      console.error("[TEAM_INVITE_INVALID_RESPONSE]", data);
      return NextResponse.json({ error: "Não foi possível gerar o código." }, { status: 500 });
    }

    return NextResponse.json({
      code: invite.code,
      role: invite.role,
      expiresAt: invite.expires_at,
    });
  } catch (error) {
    console.error("[TEAM_INVITE_CRITICAL_ERROR]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
