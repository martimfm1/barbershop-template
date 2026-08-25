import { NextResponse } from 'next/server';
import {
  processBirthdayCampaigns,
  processQueuedCampaignRecipients,
  processScheduledCampaigns,
} from '@/lib/marketing/dispatcher';
import { processBirthdayCampaignDelivery } from '@/lib/marketing/birthday-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    request.headers.get('authorization') === `Bearer ${secret}` ||
    request.headers.get('x-cron-secret') === secret
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    // The legacy birthday queue is intentionally no longer dispatched here.
    // Birthday campaigns are handled end-to-end by the Marketing engine so
    // voucher issuance and delivery stay atomic from the barber's point of view.
    const birthdayLegacy = await processBirthdayCampaigns(25);
    const birthdays = await processBirthdayCampaignDelivery(25);
    const scheduled = await processScheduledCampaigns(25);
    const delivery = await processQueuedCampaignRecipients(100);
    const result = {
      ok: true,
      requestId,
      legacyBirthdayCampaignsProcessed: birthdayLegacy.processed,
      birthdayCampaignsProcessed: birthdays.campaignsProcessed,
      birthdayRecipientsProcessed: birthdays.recipientsProcessed,
      birthdaySent: birthdays.sent,
      birthdayFailed: birthdays.failed,
      birthdayVouchersIssued: birthdays.vouchersIssued,
      scheduledCampaigns: scheduled.processed,
      queuedRecipientsProcessed: delivery.processed,
      sent: delivery.sent,
      failed: delivery.failed,
      durationMs: Date.now() - startedAt,
    };
    console.info('[MARKETING_CRON] completed', result);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[MARKETING_CRON] failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: 'Marketing worker failed',
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
