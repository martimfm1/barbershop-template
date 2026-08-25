import { sendBrevoEmail } from '@/lib/email/brevo';

export type MarketingSendResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

function getBrevoApiKey() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured.');
  return apiKey;
}

function sanitizeSender(value: string) {
  return value.replace(/[^a-zA-Z0-9 ._-]/g, '').trim().slice(0, 15) || 'Silentra';
}

export async function sendBrevoSms(input: {
  to: string;
  content: string;
  sender?: string;
}): Promise<MarketingSendResult> {
  if (!input.to || !input.content) {
    return { success: false, error: 'SMS recipient and content are required.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': getBrevoApiKey(),
      },
      body: JSON.stringify({
        sender: sanitizeSender(input.sender ?? process.env.BREVO_SMS_SENDER ?? 'Silentra'),
        recipient: input.to.replace(/[^0-9+]/g, ''),
        content: input.content,
        type: 'marketing',
        unicodeEnabled: true,
      }),
    });

    const data = (await response.json()) as { messageId?: string | number; message?: string };
    if (!response.ok) {
      return { success: false, error: data.message ?? 'Brevo SMS request failed.' };
    }
    return { success: true, messageId: data.messageId ? String(data.messageId) : undefined };
  } catch (error) {
    console.error('[BREVO_SMS_ERROR]', error);
    return { success: false, error: 'Unable to send SMS.' };
  }
}

export async function sendMarketingEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  senderName?: string;
}): Promise<MarketingSendResult> {
  return sendBrevoEmail({
    to: input.to,
    toName: input.toName,
    subject: input.subject,
    htmlContent: input.html,
    senderName: input.senderName,
  });
}
