import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase Admin (Service Role) apenas para gerar o link
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { error: "Configuração do servidor de e-mail incompleta." },
        { status: 500 }
      );
    }

    // 1. Gerar o link de recuperação no Supabase sem enviar e-mail automático
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${new URL(request.url).origin}/auth/callback?next=/reset-password`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const actionLink = data.properties.action_link;

    // 2. Disparar e-mail via API v3 do Brevo
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Suporte", email: senderEmail },
        to: [{ email }],
        subject: "Redefinir a tua palavra-passe",
        htmlContent: `
          <div style="background-color: #09090b; color: #f4f4f5; padding: 32px; font-family: sans-serif; border-radius: 12px; max-width: 480px; margin: 0 auto;">
            <h2 style="margin-top: 0;">Redefinir palavra-passe</h2>
            <p style="color: #a1a1aa; font-size: 14px;">Recebemos um pedido para alterar a tua palavra-passe. Clica no botão abaixo para prosseguir:</p>
            <a href="${actionLink}" style="background-color: #ffffff; color: #09090b; padding: 12px 24px; border-radius: 99px; font-weight: bold; text-decoration: none; display: inline-block; margin: 16px 0; font-size: 13px;">
              Redefinir Palavra-passe
            </a>
            <p style="color: #71717a; font-size: 12px; margin-bottom: 0;">Se não solicitaste esta alteração, podes ignorar esta mensagem.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Falha ao enviar e-mail pelo Brevo." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno ao processar o pedido." },
      { status: 500 }
    );
  }
}