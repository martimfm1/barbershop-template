import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(nome|barbearia|booking_url)\s*\}\}/g, (_, key: keyof typeof values) => values[key] ?? "");
}

function wrapBirthdayEmail(body: string, shopName: string, avatarUrl?: string | null) {
  const safeName = escapeHtml(shopName);
  const safeAvatar = avatarUrl && /^https:\/\//i.test(avatarUrl) ? avatarUrl : null;
  const avatar = safeAvatar
    ? `<img src="${escapeHtml(safeAvatar)}" alt="${safeName}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:14px;object-fit:cover;border:1px solid #27272a;" />`
    : `<div style="width:48px;height:48px;border-radius:14px;background:#18181b;border:1px solid #27272a;text-align:center;line-height:48px;font-size:20px;">🎂</div>`;

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;color:#d4d4d8;">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");

  return `<!doctype html><html lang="pt"><body style="margin:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#fafafa;"><div style="max-width:600px;margin:0 auto;padding:32px 18px;"><div style="border:1px solid #27272a;border-radius:20px;overflow:hidden;background:#0f0f12;"><div style="padding:24px;border-bottom:1px solid #27272a;"><div style="display:flex;align-items:center;gap:12px;">${avatar}<div><div style="font-size:15px;font-weight:700;color:#fafafa;">${safeName}</div><div style="font-size:12px;color:#71717a;margin-top:3px;">Comunicação</div></div></div></div><div style="padding:28px 24px;">${paragraphs}</div></div><p style="margin:16px 0 0;text-align:center;font-size:11px;color:#52525b;">Enviado através da Silentra</p></div></body></html>`;
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  const birthdayDate = `${today.getUTCFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const { data: automations, error: automationError } = await admin
    .from("birthday_email_automations")
    .select("barbershop_id, subject, body")
    .eq("enabled", true);

  if (automationError) {
    console.error("[Birthday Cron] automation query failed", automationError);
    return NextResponse.json({ error: "Unable to load birthday automations" }, { status: 500 });
  }

  for (const automation of automations ?? []) {
    const { data: effectivePlan, error: planError } = await admin.rpc("get_effective_billing_plan_for_barbershop", {
      p_barbershop_id: automation.barbershop_id,
    });

    if (planError) {
      console.error("[Birthday Cron] plan resolution failed", planError);
      failed++;
      continue;
    }

    if (effectivePlan !== "pro" && effectivePlan !== "enterprise") {
      skipped++;
      continue;
    }

    const [{ data: shop }, { data: clients, error: clientError }] = await Promise.all([
      admin.from("barbershops").select("name, avatar_url, slug").eq("id", automation.barbershop_id).maybeSingle(),
      admin.rpc("get_birthday_clients", {
        p_barbershop_id: automation.barbershop_id,
        p_month: month,
        p_day: day,
      }),
    ]);

    if (clientError) {
      console.error("[Birthday Cron] client query failed", clientError);
      failed++;
      continue;
    }

    if (!shop) {
      skipped++;
      continue;
    }

    for (const client of clients ?? []) {
      processed++;
      const { data: previous } = await admin
        .from("birthday_email_logs")
        .select("id, status")
        .eq("barbershop_id", automation.barbershop_id)
        .eq("client_id", client.id)
        .eq("birthday_date", birthdayDate)
        .maybeSingle();

      if (previous?.status === "sent") {
        skipped++;
        continue;
      }

      const name = client.name_complete?.trim() || "Cliente";
      const shopName = shop.name?.trim() || "A tua barbearia";
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://silentra.me"}/barbershops/${shop.slug ?? automation.barbershop_id}`;
      const subject = renderTemplate(automation.subject, { nome: name, barbearia: shopName, booking_url: bookingUrl });
      const body = renderTemplate(automation.body, { nome: name, barbearia: shopName, booking_url: bookingUrl });
      const result = await sendBrevoEmail({
        to: client.email as string,
        toName: name,
        subject,
        htmlContent: wrapBirthdayEmail(body, shopName, shop.avatar_url),
        senderName: shopName,
      });

      if (result.success) {
        sent++;
        await admin.from("birthday_email_logs").upsert({
          barbershop_id: automation.barbershop_id,
          client_id: client.id,
          birthday_date: birthdayDate,
          email: client.email,
          status: "sent",
          provider_message_id: result.messageId ?? null,
          error_message: null,
        }, { onConflict: "barbershop_id,client_id,birthday_date" });
      } else {
        failed++;
        await admin.from("birthday_email_logs").upsert({
          barbershop_id: automation.barbershop_id,
          client_id: client.id,
          birthday_date: birthdayDate,
          email: client.email,
          status: "failed",
          error_message: result.error,
        }, { onConflict: "barbershop_id,client_id,birthday_date" });
      }
    }
  }

  return NextResponse.json({ ok: true, birthdayDate, processed, sent, skipped, failed });
}
