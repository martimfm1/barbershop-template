import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Código de convite é obrigatório" },
        { status: 400 },
      );
    }

    // 1. Verificar a Sessão
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: barbershop, error: dbError } = await supabase
      .from("barbershops")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (dbError || !barbershop) {
      return NextResponse.json(
        { error: "Código de convite inválido" },
        { status: 404 },
      );
    }

    const { error: upsertError } = await supabase
      .from("users")
      .update({
        barbershop_id: barbershop.id,
      })
      .eq("id", user.id);

    if (upsertError) {
      console.error("❌ Erro ao vincular utilizador:", upsertError);
      return NextResponse.json(
        { error: "Erro ao processar convite" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, barbershopId: barbershop.id });
  } catch (error) {
    console.error("Erro na rota /api/onboarding/join:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
