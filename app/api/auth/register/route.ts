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
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 128 ||
      !name ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Usa um email válido, uma palavra-passe com pelo menos 12 caracteres e preenche os restantes campos.",
        },
        { status: 400 },
      );
    }

    // Define o URL de redirecionamento para a confirmação de e-mail
    const origin = request.headers.get("origin") || "";
    const emailRedirectTo = origin ? `${origin}/api/auth/callback` : undefined;

    const { error } = await createAdminClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name_complete: name,
          full_name: name,
          num_phone: phone,
          phone: phone, // Guarda o número no user_metadata do Supabase Auth
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      const isExistingAccount =
        message.includes("already") || message.includes("registered");
      console.warn("[REGISTER_REJECTED]", {
        code: error.code,
        status: error.status,
      });
      return NextResponse.json(
        {
          error: isExistingAccount
            ? "Já existe uma conta com este email. Inicia sessão em vez de criares uma nova conta."
            : "Não foi possível concluir o registo. Confirma os dados e tenta novamente.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Utilizador registado com sucesso." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[REGISTER_ERROR]",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}