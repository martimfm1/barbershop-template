import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function generateSlug(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "O nome é obrigatório" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalSlug = `${generateSlug(name)}-${randomSuffix}`;

    const { data: barbershop, error: dbError } = await supabase
      .from("barbershops")
      .insert({
        name: name,
        slug: finalSlug,
      })
      .select()
      .maybeSingle();

    if (dbError) {
      console.error("DEBUG - Erro na tabela barbershops:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!barbershop) {
      return NextResponse.json({ error: "Falha ao criar o registo da barbearia." }, { status: 500 });
    }

    const { error: upsertError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name_complete: user.user_metadata?.name_complete || user.user_metadata?.name || "Utilizador",
      name: user.user_metadata?.name_complete || user.user_metadata?.name || "Utilizador",
      num_phone: user.user_metadata?.phone || user.user_metadata?.num_phone || "",
      barbershop_id: barbershop.id,
      role: "admin",
    });

    if (upsertError) {
      console.error("DEBUG - Erro na tabela users:", upsertError);
      return NextResponse.json(
        { error: "Erro ao atualizar permissões do utilizador" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, barbershopId: barbershop.id }, { status: 200 });

  } catch (error: any) {
    console.error("Critical Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}