import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRecord, normalizeText } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const email = normalizeText(body.email, 254)?.toLowerCase();
    const name = normalizeText(body.name_complete, 120);
    const phone = normalizeText(body.num_phone, 30);
    const password = body.password;

    if (
      !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 12 || password.length > 128 ||
      !name || !phone
    ) {
      return NextResponse.json(
        { error: "Usa um email válido, uma palavra-passe com pelo menos 12 caracteres e preenche os restantes campos." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name_complete: name, num_phone: phone } },
    });

    if (error) {
      console.warn("[REGISTER_REJECTED]", error.message);
      return NextResponse.json({ error: "Não foi possível concluir o registo." }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: "Utilizador registado com sucesso." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
