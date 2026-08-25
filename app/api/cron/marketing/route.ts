import { NextResponse } from 'next/server';
import { processQueuedCampaignRecipients, processScheduledCampaigns } from '@/lib/marketing/dispatcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  return Boolean(
    expected &&
      (request.headers.get('authorization') === `Bearer ${expected}` ||
        request.headers.get('x-cron-secret') === expected),
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestId = crypto.randomUUID();
  try {
    const scheduled = await processScheduledCampaigns(25);
    const delivery = await processQueuedCampaignRecipients(100);
    const result = {
      ok: true,
      requestId,
      scheduled: scheduled.processed,
      processed: delivery.processed,
      sent: delivery.sent,
      failed: delivery.failed,
    };
    console.info('[MARKETING_CRON_COMPLETED]', result);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[MARKETING_CRON_FAILED]', { requestId, error });
    return NextResponse.json({ ok: false, requestId, error: 'Marketing worker failed' }, { status: 500 });
  }
}
