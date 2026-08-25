import { NextRequest, NextResponse } from 'next/server';
import { applyProviderDeliveryEvent } from '@/lib/marketing/delivery';

function authorized(request: NextRequest) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-webhook-secret');
  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

function resolveChannel(payload: Record<string, unknown>): 'email' | 'sms' {
  const channel = typeof payload.channel === 'string' ? payload.channel.toLowerCase() : '';
  if (channel === 'sms') return 'sms';

  const eventType = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
  if (eventType.startsWith('sms')) return 'sms';

  return 'email';
}

export async function handleBrevoWebhook(
  request: NextRequest,
  channelOverride?: 'email' | 'sms',
) {
  if (!authorized(request)) {
    console.warn('[BREVO_WEBHOOK] unauthorized');
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const payloads = Array.isArray(raw) ? raw : [raw];
  let processed = 0;
  let matched = 0;

  for (const payload of payloads) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) continue;

    const normalized = payload as Record<string, unknown>;
    const channel = channelOverride ?? resolveChannel(normalized);

    try {
      const result = await applyProviderDeliveryEvent({
        channel,
        payload: normalized,
      });

      processed += 1;
      if (result.matched) matched += 1;
    } catch (error) {
      console.error('[BREVO_WEBHOOK] event processing failed', {
        channel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ ok: true, processed, matched });
}
