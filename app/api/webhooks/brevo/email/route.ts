import { NextRequest } from 'next/server';
import { handleBrevoWebhook } from '@/lib/marketing/brevo-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleBrevoWebhook(request, 'email');
}
