import { NextResponse } from "next/server";
// Importa a função que cria o cliente SSR que lida com cookies
import { createClient } from "@/lib/supabase/server"; 

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: "Credenciais inválidas." }, 
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name_complete, barbershop_id, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Erro ao obter perfil na DB:", profileError.message);
      return NextResponse.json(
        { error: "Erro interno ao processar o perfil." }, 
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado." }, 
        { status: 404 }
      );
    }

    // Retorna os dados do perfil para o frontend gerir o estado global (se necessário)
    return NextResponse.json({ success: true, user: profile }, { status: 200 });

  } catch (error) {
    console.error("Critical Login Error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." }, 
      { status: 500 }
    );
  }
}