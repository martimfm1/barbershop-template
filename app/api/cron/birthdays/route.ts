import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBrevoEmail } from '@/lib/email/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIME_ZONE = 'Europe/Lisbon';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(
    /\{\{\s*(nome|barbearia|booking_url)\s*\}\}/g,
    (_, key: keyof typeof values) => values[key] ?? '',
  );
}

function wrapBirthdayEmail(
  body: string,
  shopName: string,
  avatarUrl?: string | null,
) {
  const safeName = escapeHtml(shopName);
  const safeAvatar =
    avatarUrl && /^https:\/\//i.test(avatarUrl) ? avatarUrl : null;
  const avatar = safeAvatar
    ? `<img src="${escapeHtml(safeAvatar)}" alt="${safeName}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:14px;object-fit:cover;border:1px solid #27272a;" />`
    : `<div style="width:48px;height:48px;border-radius:14px;background:#18181b;border:1px solid #27272a;text-align:center;line-height:48px;font-size:20px;">🎂</div>`;

  const paragraphs = body
    .split(/\n\s*\n/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.7;color:#d4d4d8;">${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`,
    )
    .join('');

  return `<!doctype html><html lang="pt"><body style="margin:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#fafafa;"><div style="max-width:600px;margin:0 auto;padding:32px 18px;"><div style="border:1px solid #27272a;border-radius:20px;overflow:hidden;background:#0f0f12;"><div style="padding:24px;border-bottom:1px solid #27272a;"><div style="display:flex;align-items:center;gap:12px;">${avatar}<div><div style="font-size:15px;font-weight:700;color:#fafafa;">${safeName}</div><div style="font-size:12px;color:#71717a;margin-top:3px;">Comunicação</div></div></div></div><div style="padding:28px 24px;">${paragraphs}</div></div><p style="margin:16px 0 0;text-align:center;font-size:11px;color:#52525b;">Enviado através da Silentra</p></div></body></html>`;
}

function getLisbonDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const year = values.year;
  const month = values.month;
  const day = values.day;

  if (!year || !month || !day) {
    throw new Error('Unable to resolve Lisbon local date');
  }

  return {
    year,
    month: Number(month),
    day: Number(day),
    iso: `${year}-${month}-${day}`,
  };
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!expectedSecret) {
    console.error('[BIRTHDAY_CRON] missing CRON_SECRET', { requestId });
    return NextResponse.json(
      { error: 'Cron is not configured', requestId },
      { status: 503 },
    );
  }

  if (authorization !== `Bearer ${expectedSecret}`) {
    console.warn('[BIRTHDAY_CRON] unauthorized request', { requestId });
    return NextResponse.json(
      { error: 'Unauthorized', requestId },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const birthday = getLisbonDate();
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let skippedPlan = 0;
  let skippedNoClients = 0;
  let failed = 0;

  console.warn('[BIRTHDAY_CRON] started', {
    requestId,
    timezone: TIME_ZONE,
    birthdayDate: birthday.iso,
  });

  const { data: automations, error: automationError } = await admin
    .from('birthday_email_automations')
    .select('barbershop_id, subject, body')
    .eq('enabled', true);

  if (automationError) {
    console.error('[BIRTHDAY_CRON] automation query failed', {
      requestId,
      message: automationError.message,
      code: automationError.code,
    });
    return NextResponse.json(
      { error: 'Unable to load birthday automations', requestId },
      { status: 500 },
    );
  }

  console.warn('[BIRTHDAY_CRON] automations loaded', {
    requestId,
    count: automations?.length ?? 0,
  });

  for (const automation of automations ?? []) {
    const { data: effectivePlan, error: planError } = await admin.rpc(
      'get_effective_billing_plan_for_barbershop',
      {
        p_barbershop_id: automation.barbershop_id,
      },
    );

    if (planError) {
      console.error('[BIRTHDAY_CRON] plan resolution failed', {
        requestId,
        barbershopId: automation.barbershop_id,
        message: planError.message,
        code: planError.code,
      });
      failed++;
      continue;
    }

    if (effectivePlan !== 'pro' && effectivePlan !== 'enterprise') {
      skippedPlan++;
      continue;
    }

    const [
      { data: shop, error: shopError },
      { data: clients, error: clientError },
    ] = await Promise.all([
      admin
        .from('barbershops')
        .select('name, avatar_url, slug')
        .eq('id', automation.barbershop_id)
        .maybeSingle(),
      admin.rpc('get_birthday_clients', {
        p_barbershop_id: automation.barbershop_id,
        p_month: birthday.month,
        p_day: birthday.day,
      }),
    ]);

    if (shopError) {
      console.error('[BIRTHDAY_CRON] shop query failed', {
        requestId,
        barbershopId: automation.barbershop_id,
        message: shopError.message,
        code: shopError.code,
      });
      failed++;
      continue;
    }

    if (clientError) {
      console.error('[BIRTHDAY_CRON] client query failed', {
        requestId,
        barbershopId: automation.barbershop_id,
        message: clientError.message,
        code: clientError.code,
      });
      failed++;
      continue;
    }

    if (!shop) {
      console.warn('[BIRTHDAY_CRON] barbershop not found', {
        requestId,
        barbershopId: automation.barbershop_id,
      });
      skipped++;
      continue;
    }

    if (!(clients?.length ?? 0)) {
      skippedNoClients++;
      continue;
    }

    for (const client of clients) {
      processed++;

      if (!client.email || typeof client.email !== 'string') {
        console.warn('[BIRTHDAY_CRON] client skipped without email', {
          requestId,
          barbershopId: automation.barbershop_id,
          clientId: client.id,
        });
        skipped++;
        continue;
      }

      const { data: previous, error: previousError } = await admin
        .from('birthday_email_logs')
        .select('id, status')
        .eq('barbershop_id', automation.barbershop_id)
        .eq('client_id', client.id)
        .eq('birthday_date', birthday.iso)
        .maybeSingle();

      if (previousError) {
        console.error('[BIRTHDAY_CRON] log lookup failed', {
          requestId,
          barbershopId: automation.barbershop_id,
          clientId: client.id,
          message: previousError.message,
          code: previousError.code,
        });
        failed++;
        continue;
      }

      if (previous?.status === 'sent') {
        skipped++;
        continue;
      }

      const name = client.name_complete?.trim() || 'Cliente';
      const shopName = shop.name?.trim() || 'A tua barbearia';
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://silentra.me'}/barbershops/${shop.slug ?? automation.barbershop_id}`;
      const subject = renderTemplate(automation.subject, {
        nome: name,
        barbearia: shopName,
        booking_url: bookingUrl,
      });
      const body = renderTemplate(automation.body, {
        nome: name,
        barbearia: shopName,
        booking_url: bookingUrl,
      });

      try {
        const result = await sendBrevoEmail({
          to: client.email,
          toName: name,
          subject,
          htmlContent: wrapBirthdayEmail(body, shopName, shop.avatar_url),
          senderName: shopName,
        });

        if (result.success) {
          sent++;
          const { error: logError } = await admin
            .from('birthday_email_logs')
            .upsert(
              {
                barbershop_id: automation.barbershop_id,
                client_id: client.id,
                birthday_date: birthday.iso,
                email: client.email,
                status: 'sent',
                provider_message_id: result.messageId ?? null,
                error_message: null,
              },
              { onConflict: 'barbershop_id,client_id,birthday_date' },
            );

          if (logError) {
            console.error('[BIRTHDAY_CRON] sent log write failed', {
              requestId,
              barbershopId: automation.barbershop_id,
              clientId: client.id,
              message: logError.message,
              code: logError.code,
            });
            failed++;
          }
        } else {
          failed++;
          console.error('[BIRTHDAY_CRON] email delivery failed', {
            requestId,
            barbershopId: automation.barbershop_id,
            clientId: client.id,
            error: result.error,
          });
          await admin.from('birthday_email_logs').upsert(
            {
              barbershop_id: automation.barbershop_id,
              client_id: client.id,
              birthday_date: birthday.iso,
              email: client.email,
              status: 'failed',
              error_message: result.error,
            },
            { onConflict: 'barbershop_id,client_id,birthday_date' },
          );
        }
      } catch (error) {
        failed++;
        console.error('[BIRTHDAY_CRON] unexpected client processing failure', {
          requestId,
          barbershopId: automation.barbershop_id,
          clientId: client.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const result = {
    ok: true,
    requestId,
    timezone: TIME_ZONE,
    birthdayDate: birthday.iso,
    automations: automations?.length ?? 0,
    processed,
    sent,
    skipped,
    skippedPlan,
    skippedNoClients,
    failed,
  };

  console.warn('[BIRTHDAY_CRON] completed', result);
  return NextResponse.json(result);
}
