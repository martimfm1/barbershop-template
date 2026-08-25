import { createAdminClient } from '@/lib/supabase/admin';
import { sendMarketingEmail } from '@/lib/marketing/brevo';
import { sendBrevoSms } from '@/lib/marketing/brevo';

const MAX_PER_RUN = 100;
const MAX_ATTEMPTS = 3;

type Campaign = {
  id: string;
  barbershop_id: string;
  name: string;
  channel: 'email' | 'sms';
  subject: string | null;
  body: string;
  trigger_type: 'manual' | 'interval' | 'event';
  interval_value: number | null;
  interval_unit: 'hours' | 'days' | null;
  event_name: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function token(value: string, vars: { nome: string; barbearia: string; bookingUrl: string }) {
  return value
    .replaceAll('{{nome}}', vars.nome)
    .replaceAll('{{barbearia}}', vars.barbearia)
    .replaceAll('{{booking_url}}', vars.bookingUrl);
}

function emailHtml(body: string, shopName: string) {
  const safeName = escapeHtml(shopName);
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;color:#d4d4d8;">${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`)
    .join('');
  return `<!doctype html><html lang="pt"><body style="margin:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#fafafa;"><div style="max-width:600px;margin:0 auto;padding:32px 18px;"><div style="border:1px solid #27272a;border-radius:20px;overflow:hidden;background:#0f0f12;"><div style="padding:24px;border-bottom:1px solid #27272a;font-size:15px;font-weight:700;color:#fafafa;">${safeName}</div><div style="padding:28px 24px;">${paragraphs}</div></div><p style="margin:16px 0 0;text-align:center;font-size:11px;color:#52525b;">Enviado através da Silentra</p></div></body></html>`;
}

function nextInterval(value: number, unit: 'hours' | 'days') {
  const ms = unit === 'days' ? value * 86400000 : value * 3600000;
  return new Date(Date.now() + ms).toISOString();
}

async function loadCampaign(campaignId: string): Promise<Campaign> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('marketing_campaigns')
    .select('id,barbershop_id,name,channel,subject,body,trigger_type,interval_value,interval_unit,event_name,next_run_at,last_run_at')
    .eq('id', campaignId)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? 'Campaign not found.');
  return data as Campaign;
}

export async function dispatchCampaign(campaignId: string, runKey = crypto.randomUUID()) {
  const admin = createAdminClient();
  const campaign = await loadCampaign(campaignId);

  const { data: shop } = await admin
    .from('barbershops')
    .select('name,slug')
    .eq('id', campaign.barbershop_id)
    .maybeSingle();

  const recipientField = campaign.channel === 'email' ? 'email' : 'num_phone';
  const { data: clients, error: clientsError } = await admin
    .from('users')
    .select('id,name_complete,email,num_phone')
    .eq('barbershop_id', campaign.barbershop_id)
    .eq('role', 'client')
    .not(recipientField, 'is', null)
    .limit(MAX_PER_RUN);
  if (clientsError) throw clientsError;

  if (!clients?.length) {
    await admin.from('marketing_campaigns').update({ status: 'completed', completed_at: new Date().toISOString(), total_recipients: 0 }).eq('id', campaign.id);
    return { campaignId, runKey, processed: 0, sent: 0, failed: 0 };
  }

  const { data: insertedRecipients, error: recipientError } = await admin
    .from('marketing_campaign_recipients')
    .upsert(
      clients.map((client) => ({
        campaign_id: campaign.id,
        client_id: client.id,
        destination: campaign.channel === 'email' ? client.email! : client.num_phone!,
        run_key: runKey,
        status: 'queued',
        attempts: 0,
      })),
      { onConflict: 'campaign_id,client_id,run_key', ignoreDuplicates: true },
    )
    .select('id,client_id,destination,status,attempts');
  if (recipientError) throw recipientError;

  let sent = 0;
  let failed = 0;
  const shopName = shop?.name?.trim() || 'A tua barbearia';
  const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barbers.silentra.me'}/barbershops/${shop?.slug ?? campaign.barbershop_id}`;

  for (const recipient of insertedRecipients ?? []) {
    if (recipient.status === 'sent') continue;
    const client = clients.find((item) => item.id === recipient.client_id);
    if (!client) continue;

    const name = client.name_complete?.trim() || 'Cliente';
    const body = token(campaign.body, { nome: name, barbearia: shopName, bookingUrl });
    const subject = token(campaign.subject?.trim() || `${campaign.name} — ${shopName}`, { nome: name, barbearia: shopName, bookingUrl });

    await admin.from('marketing_campaign_recipients').update({ status: 'sending', attempts: (recipient.attempts ?? 0) + 1, error_message: null }).eq('id', recipient.id);

    const result = campaign.channel === 'email'
      ? await sendMarketingEmail({ to: recipient.destination, toName: name, subject, html: emailHtml(body, shopName), senderName: shopName })
      : await sendBrevoSms({ to: recipient.destination, content: body, sender: process.env.BREVO_SMS_SENDER ?? shopName });

    if (result.success) {
      sent++;
      await admin.from('marketing_campaign_recipients').update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: result.messageId ?? null, error_message: null }).eq('id', recipient.id);
    } else {
      failed++;
      const attempts = (recipient.attempts ?? 0) + 1;
      await admin.from('marketing_campaign_recipients').update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'queued', failed_at: attempts >= MAX_ATTEMPTS ? new Date().toISOString() : null, next_attempt_at: attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + attempts * 60000).toISOString(), error_message: result.error }).eq('id', recipient.id);
    }
  }

  const pending = (clients?.length ?? 0) >= MAX_PER_RUN;
  const update: Record<string, unknown> = {
    last_run_at: new Date().toISOString(),
    total_recipients: clients.length,
    sent_count: sent,
    failed_count: failed,
    status: pending ? 'sending' : failed && !sent ? 'completed' : 'completed',
    completed_at: pending ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (campaign.trigger_type === 'interval' && campaign.interval_value && campaign.interval_unit) {
    update.next_run_at = nextInterval(campaign.interval_value, campaign.interval_unit);
    update.active = true;
    update.status = 'scheduled';
  }
  await admin.from('marketing_campaigns').update(update).eq('id', campaign.id);

  return { campaignId, runKey, processed: clients.length, sent, failed, pending };
}

export async function dispatchMarketingEvent(input: { barbershopId: string; eventName: string; clientId?: string | null }) {
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('marketing_campaigns')
    .select('id')
    .eq('barbershop_id', input.barbershopId)
    .eq('active', true)
    .eq('trigger_type', 'event')
    .eq('event_name', input.eventName)
    .limit(50);
  if (error) throw error;
  if (!campaigns?.length) return { triggered: 0 };

  let triggered = 0;
  for (const campaign of campaigns) {
    await dispatchCampaign(campaign.id, `event:${input.eventName}:${input.clientId ?? crypto.randomUUID()}:${Date.now()}`);
    triggered++;
  }
  return { triggered };
}

export async function processScheduledCampaigns(limit = 25) {
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('marketing_campaigns')
    .select('id')
    .eq('active', true)
    .in('trigger_type', ['interval'])
    .lte('next_run_at', new Date().toISOString())
    .limit(limit);
  if (error) throw error;

  let processed = 0;
  for (const campaign of campaigns ?? []) {
    try {
      await dispatchCampaign(campaign.id, `scheduled:${campaign.id}:${new Date().toISOString().slice(0, 13)}`);
      processed++;
    } catch (error) {
      console.error('[MARKETING_SCHEDULER_CAMPAIGN]', { campaignId: campaign.id, error });
    }
  }
  return { processed };
}
