import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthCallbackUrl } from '@/lib/auth/email-confirmation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function genericSuccessResponse() {
  return NextResponse.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const rawEmail =
      typeof body === 'object' && body !== null && 'email' in body
        ? (body as { email?: unknown }).email
        : undefined;
    const email =
      typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    // Do not reveal whether an account exists for a given email address.
    if (!EMAIL_PATTERN.test(email) || email.length > 254)
      return genericSuccessResponse();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    if (!supabaseUrl || !serviceRoleKey || !apiKey || !senderEmail) {
      console.error(
        '[AUTH_RECOVERY_CONFIG_ERROR] Missing required server configuration.',
      );
      return NextResponse.json(
        {
          error:
            'O serviÃ§o de recuperaÃ§Ã£o estÃ¡ temporariamente indisponÃ­vel.',
        },
        { status: 503 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${getAuthCallbackUrl(request)}?next=/reset-password`,
      },
    });

    if (error) {
      console.warn('[AUTH_RECOVERY_LINK_REJECTED]', {
        code: error.code,
        status: error.status,
      });
      return genericSuccessResponse();
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Suporte', email: senderEmail },
        to: [{ email }],
        subject: 'Redefinir a tua palavra-passe',
        htmlContent: `<div style="background:#09090b;color:#f4f4f5;padding:32px;font-family:sans-serif;border-radius:12px;max-width:480px;margin:0 auto"><h2>Redefinir palavra-passe</h2><p style="color:#a1a1aa;font-size:14px">Recebemos um pedido para alterar a tua palavra-passe. Clica no botÃ£o abaixo para prosseguir:</p><a href="${data.properties.action_link}" style="background:#fff;color:#09090b;padding:12px 24px;border-radius:99px;font-weight:bold;text-decoration:none;display:inline-block;margin:16px 0;font-size:13px">Redefinir palavra-passe</a><p style="color:#71717a;font-size:12px;margin-bottom:0">Se nÃ£o solicitaste esta alteraÃ§Ã£o, podes ignorar esta mensagem.</p></div>`,
      }),
    });

    if (!response.ok) {
      console.error('[AUTH_RECOVERY_EMAIL_REJECTED]', {
        status: response.status,
      });
      return NextResponse.json(
        {
          error:
            'NÃ£o foi possÃ­vel enviar o email de recuperaÃ§Ã£o. Tenta novamente.',
        },
        { status: 502 },
      );
    }

    return genericSuccessResponse();
  } catch (error) {
    console.error(
      '[AUTH_RECOVERY_ERROR]',
      error instanceof Error ? error.name : 'unknown',
    );
    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao processar o pedido.' },
      { status: 500 },
    );
  }
}
