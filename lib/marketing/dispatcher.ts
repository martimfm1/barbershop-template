import { createAdminClient } from '@/lib/supabase/admin';
import { sendMarketingEmail, sendBrevoSms } from '@/lib/marketing/brevo';

const MAX_RECIPIENTS_PER_BATCH = 100;
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
  return new Date(Date.now() + (unit === 'days' ? value * 86400000 : value * 3600000)).toISOString();
}

async function getCampaign(campaignId: string): Promise<Campaign> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('marketing_campaigns')
    .select('id,barbershop_id,name,channel,subject,body,trigger_type,interval_value,interval_unit,event_name,next_run_at')
    .eq('id', campaignId)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? 'Campaign not found.');
  return data as Campaign;
}

export async function queueCampaign(campaignId: string, runKey = crypto.randomUUID(), targetClientId?: string | null) {
  const admin = createAdminClient();
  const campaign = await getCampaign(campaignId);
  const recipientField = campaign.channel === 'email' ? 'email' : 'num_phone';

  let query = admin
    .from('users')
    .select('id,name_complete,email,num_phone', { count: 'exact' })
    .eq('barbershop_id', campaign.barbershop_id)
    .eq('role', 'client')
    .not(recipientField, 'is', null);
  if (targetClientId) query = query.eq('id', targetClientId);
  const { data: clients, error: clientsError, count } = await query.limit(targetClientId ? 1 : 5000);
  if (clientsError) throw clientsError;

  if (!clients?.length) {
    const next = campaign.trigger_type === 'interval' && campaign.interval_value && campaign.interval_unit
      ? nextInterval(campaign.interval_value, campaign.interval_unit)
      : null;
    await admin.from('marketing_campaigns').update({
      status: next ? 'scheduled' : 'completed',
      next_run_at: next,
      completed_at: next ? null : new Date().toISOString(),
      total_recipients: 0,
      sent_count: 0,
      failed_count: 0,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id);
    return { campaignId, runKey, queued: 0, total: count ?? 0 };
  }

  const { error: recipientError } = await admin
    .from('marketing_campaign_recipients')
    .upsert(
      clients.map((client) => ({
        campaign_id: campaign.id,
        client_id: client.id,
        destination: campaign.channel === 'email' ? client.email! : client.num_phone!,
        run_key: runKey,
        status: 'queued',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
      })),
      { onConflict: 'campaign_id,client_id,run_key', ignoreDuplicates: true },
    );
  if (recipientError) throw recipientError;

  await admin
    .from('marketing_campaigns')
    .update({ status: 'sending', last_run_at: new Date().toISOString(), total_recipients: clients.length, sent_count: 0, failed_count: 0, completed_at: null, next_run_at: null, updated_at: new Date().toISOString() })
    .eq('id', campaign.id);

  return { campaignId, runKey, queued: clients.length, total: count ?? clients.length };
}

export async function processQueuedCampaignRecipients(limit = MAX_RECIPIENTS_PER_BATCH) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: recipients, error } = await admin
    .from('marketing_campaign_recipients')
    .select('id,campaign_id,client_id,destination,attempts')
    .eq('status', 'queued')
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  if (!recipients?.length) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const attempts = Number(recipient.attempts ?? 0) + 1;
    const claim = await admin
      .from('marketing_campaign_recipients')
      .update({ status: 'sending', attempts, error_message: null })
      .eq('id', recipient.id)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();
    if (claim.error || !claim.data) continue;

    try {
      const campaign = await getCampaign(recipient.campaign_id);
      const [{ data: client }, { data: shop }] = await Promise.all([
        admin.from('users').select('name_complete,email,num_phone').eq('id', recipient.client_id).eq('barbershop_id', campaign.barbershop_id).maybeSingle(),
        admin.from('barbershops').select('name,slug').eq('id', campaign.barbershop_id).maybeSingle(),
      ]);

      if (!client) {
        await admin.from('marketing_campaign_recipients').update({ status: 'skipped', error_message: 'Client not found.' }).eq('id', recipient.id);
        continue;
      }

      const name = client.name_complete?.trim() || 'Cliente';
      const shopName = shop?.name?.trim() || 'A tua barbearia';
      const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barbers.silentra.me'}/barbershops/${shop?.slug ?? campaign.barbershop_id}`;
      const body = token(campaign.body, { nome: name, barbearia: shopName, bookingUrl });
      const subject = token(campaign.subject?.trim() || `${campaign.name} — ${shopName}`, { nome: name, barbearia: shopName, bookingUrl });

      const result = campaign.channel === 'email'
        ? await sendMarketingEmail({ to: recipient.destination, toName: name, subject, html: emailHtml(body, shopName), senderName: shopName })
        : await sendBrevoSms({ to: recipient.destination, content: body, sender: process.env.BREVO_SMS_SENDER ?? shopName });

      if (result.success) {
        sent++;
        await admin.from('marketing_campaign_recipients').update({ status: 'sent', sent_at: new Date().toISOString(), delivered_at: new Date().toISOString(), provider_message_id: result.messageId ?? null, error_message: null, next_attempt_at: null }).eq('id', recipient.id);
      } else {
        failed++;
        await admin.from('marketing_campaign_recipients').update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'queued', failed_at: attempts >= MAX_ATTEMPTS ? new Date().toISOString() : null, next_attempt_at: attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + attempts * 60000).toISOString(), error_message: result.error }).eq('id', recipient.id);
      }
    } catch (error) {
      failed++;
      await admin.from('marketing_campaign_recipients').update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'queued', failed_at: attempts >= MAX_ATTEMPTS ? new Date().toISOString() : null, next_attempt_at: attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + attempts * 60000).toISOString(), error_message: error instanceof Error ? error.message : String(error) }).eq('id', recipient.id);
    }
  }

  const campaignIds = [...new Set(recipients.map((item) => item.campaign_id))];
  for (const campaignId of campaignIds) {
    const [{ count: queued }, { count: sending }, { count: sentForCampaign }, { count: failedForCampaign }] = await Promise.all([
      admin.from('marketing_campaign_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'queued'),
      admin.from('marketing_campaign_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'sending'),
      admin.from('marketing_campaign_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'sent'),
      admin.from('marketing_campaign_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'failed'),
    ]);

    const complete = (queued ?? 0) === 0 && (sending ?? 0) === 0;
    const campaign = await getCampaign(campaignId);
    const update: Record<string, unknown> = { sent_count: sentForCampaign ?? 0, failed_count: failedForCampaign ?? 0, updated_at: new Date().toISOString() };
    if (complete) {
      update.completed_at = new Date().toISOString();
      update.status = campaign.trigger_type === 'interval' ? 'scheduled' : 'completed';
      if (campaign.trigger_type === 'interval' && campaign.interval_value && campaign.interval_unit) update.next_run_at = nextInterval(campaign.interval_value, campaign.interval_unit);
    } else {
      update.status = 'sending';
    }
    await admin.from('marketing_campaigns').update(update).eq('id', campaignId);
  }

  return { processed: recipients.length, sent, failed };
}

export async function dispatchMarketingEvent(input: { barbershopId: string; eventName: string; clientId?: string | null }) {
  if (!input.clientId) {
    console.warn('[MARKETING_EVENT_SKIPPED_NO_CLIENT]', { barbershopId: input.barbershopId, eventName: input.eventName });
    return { triggered: 0 };
  }

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
  let queued = 0;
  for (const campaign of campaigns ?? []) {
    await queueCampaign(campaign.id, `event:${input.eventName}:${input.clientId}:${Date.now()}:${crypto.randomUUID()}`, input.clientId);
    queued++;
  }
  return { triggered: queued };
}

export async function processScheduledCampaigns(limit = 25) {
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('marketing_campaigns')
    .select('id')
    .eq('active', true)
    .eq('trigger_type', 'interval')
    .eq('status', 'scheduled')
    .lte('next_run_at', new Date().toISOString())
    .limit(limit);
  if (error) throw error;
  let processed = 0;
  for (const campaign of campaigns ?? []) {
    await queueCampaign(campaign.id, `scheduled:${campaign.id}:${Date.now()}:${crypto.randomUUID()}`);
    processed++;
  }
  return { processed };
}
