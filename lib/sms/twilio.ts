export type SmsSendResult =
  { success: true; messageId: string } | { success: false; error: string };

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    throw new Error(
      'Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.',
    );
  }

  return { accountSid, authToken, fromNumber, messagingServiceSid };
}

function sanitizeSenderName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 11);
}

export async function sendSms(
  to: string,
  body: string,
  options?: { senderName?: string },
): Promise<SmsSendResult> {
  if (!/^\+?[1-9]\d{7,14}$/.test(to))
    return { success: false, error: 'Invalid recipient phone number.' };
  if (!body.trim() || body.length > 1600)
    return {
      success: false,
      error: 'SMS body must contain between 1 and 1600 characters.',
    };

  try {
    const { accountSid, authToken, fromNumber, messagingServiceSid } =
      getTwilioConfig();
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64',
    );
    const params: Record<string, string> = { To: to, Body: body };
    if (messagingServiceSid) {
      params.MessagingServiceSid = messagingServiceSid;
      const senderName = options?.senderName
        ? sanitizeSenderName(options.senderName)
        : '';
      if (senderName) params.From = senderName;
    } else {
      params.From = fromNumber!;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      },
    );
    const data = (await response.json()) as { sid?: string; message?: string };
    if (!response.ok || !data.sid)
      return {
        success: false,
        error: data.message ?? 'Twilio SMS request failed.',
      };
    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('[TWILIO_SMS_ERROR]', error);
    return { success: false, error: 'Unable to send SMS.' };
  }
}
