import { NextRequest } from 'next/server';
import { handleBrevoWebhook } from '@/app/api/webhooks/brevo/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleBrevoWebhook(request, 'sms');
}
