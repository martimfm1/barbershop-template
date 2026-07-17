import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const supabaseUser = createAdminClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name_complete, num_phone } = body;

    if (!email || !password || !name_complete || !num_phone) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseUser.auth.signUp({
      email,
      password,
      options: {
        data: {
          name_complete,
          num_phone,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: "Utilizador registado com sucesso." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Internal Server Error [Register Route]:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro interno no servidor." },
      { status: 500 }
    );
  }
}