import { createAdminClient } from '@/lib/supabase/admin';

const POSITIVE_EVENTS = new Set(['delivered', 'delivery', 'accepted', 'sent']);
const OPEN_EVENTS = new Set(['opened', 'open', 'uniqueopened', 'firstopening']);
const CLICK_EVENTS = new Set(['click', 'clicked']);
const UNSUBSCRIBE_EVENTS = new Set([
  'unsubscribed',
  'unsubscribe',
  'list_unsubscribe',
  'unsub',
]);
const FAILURE_EVENTS = new Set([
  'hard_bounce',
  'soft_bounce',
  'hardbounce',
  'softbounce',
  'bounce',
  'blocked',
  'failed',
  'error',
  'invalid_email',
  'invalid',
  'rejected',
  'skip',
  'deferred',
  'spam',
  'complaint',
]);

function normalizeEvent(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function parseProviderMessageId(payload: Record<string, unknown>) {
  const candidates = [
    payload['message-id'],
    payload.messageId,
    payload['message_id'],
    payload.id,
  ];
  const value = candidates.find(
    (item) => typeof item === 'string' || typeof item === 'number',
  );
  if (value === undefined || value === null) return null;
  return String(value).trim().replace(/^<|>$/g, '');
}

function parseOccurredAt(payload: Record<string, unknown>) {
  const candidates = [
    payload.date,
    payload.timestamp,
    payload.ts_event,
    payload.ts,
    payload.occurred_at,
  ];
  for (const value of candidates) {
    if (typeof value === 'number') {
      const date = new Date(value < 1e12 ? value * 1000 : value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }
  return new Date().toISOString();
}

async function refreshCampaignMetrics(
  admin: ReturnType<typeof createAdminClient>,
  campaignId: string,
) {
  const [sent, delivered, failed, opened, clicked] = await Promise.all([
    admin
      .from('marketing_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['sent', 'delivered']),
    admin
      .from('marketing_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'delivered'),
    admin
      .from('marketing_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'failed'),
    admin
      .from('marketing_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .not('opened_at', 'is', null),
    admin
      .from('marketing_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .not('clicked_at', 'is', null),
  ]);

  const { error } = await admin
    .from('marketing_campaigns')
    .update({
      sent_count: sent.count ?? 0,
      delivered_count: delivered.count ?? 0,
      failed_count: failed.count ?? 0,
      opened_count: opened.count ?? 0,
      clicked_count: clicked.count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
  if (error) throw error;
}

export async function applyProviderDeliveryEvent(input: {
  channel: 'email' | 'sms';
  payload: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const eventType = normalizeEvent(
    input.payload.event ?? input.payload.type ?? input.payload.status,
  );
  if (!eventType) throw new Error('Provider event type is missing.');

  const providerMessageId = parseProviderMessageId(input.payload);
  const occurredAt = parseOccurredAt(input.payload);
  const email =
    typeof input.payload.email === 'string'
      ? input.payload.email.trim().toLowerCase()
      : null;
  const recipientValue = (() => {
    const candidates = [
      input.payload.recipient,
      input.payload.to,
      input.payload.phone_number,
    ];
    const value = candidates.find((item) => typeof item === 'string');
    return typeof value === 'string' ? value.trim() : null;
  })();

  let recipient: {
    id: string;
    campaign_id: string;
    barbershop_id: string;
  } | null = null;

  if (providerMessageId) {
    const { data } = await admin
      .from('marketing_campaign_recipients')
      .select('id,campaign_id,barbershop_id')
      .eq('provider_message_id', providerMessageId)
      .limit(1)
      .maybeSingle();
    recipient = data;
  }

  if (!recipient && (email || recipientValue)) {
    const value = email ?? recipientValue;
    const { data } = await admin
      .from('marketing_campaign_recipients')
      .select('id,campaign_id,barbershop_id,destination')
      .eq('destination', value)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    recipient = data;
  }

  const { data: eventRow, error: eventError } = await admin
    .from('marketing_delivery_events')
    .insert({
      recipient_id: recipient?.id ?? null,
      campaign_id: recipient?.campaign_id ?? null,
      provider_message_id: providerMessageId,
      channel: input.channel,
      event_type: eventType,
      occurred_at: occurredAt,
      payload: input.payload,
    })
    .select('id')
    .maybeSingle();

  if (eventError && eventError.code !== '23505') throw eventError;

  if (!recipient) {
    return {
      matched: false,
      duplicate: eventError?.code === '23505',
      eventId: eventRow?.id ?? null,
    };
  }

  const update: Record<string, unknown> = {
    provider_status: eventType,
    provider_event_at: occurredAt,
  };

  if (POSITIVE_EVENTS.has(eventType)) {
    update.status = 'delivered';
    update.delivered_at = occurredAt;
    update.error_message = null;
  } else if (OPEN_EVENTS.has(eventType)) {
    update.opened_at = occurredAt;
  } else if (CLICK_EVENTS.has(eventType)) {
    update.clicked_at = occurredAt;
  } else if (UNSUBSCRIBE_EVENTS.has(eventType)) {
    update.status = 'skipped';
    update.unsubscribed_at = occurredAt;
    update.error_message = 'Recipient unsubscribed.';
  } else if (FAILURE_EVENTS.has(eventType)) {
    update.status = 'failed';
    update.error_message = eventType;
  }

  const { error: recipientError } = await admin
    .from('marketing_campaign_recipients')
    .update(update)
    .eq('id', recipient.id);
  if (recipientError) throw recipientError;

  await refreshCampaignMetrics(admin, recipient.campaign_id);

  return {
    matched: true,
    duplicate: eventError?.code === '23505',
    eventId: eventRow?.id ?? null,
    recipientId: recipient.id,
  };
}
