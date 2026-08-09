import { isSmsEnabled } from "@/lib/notifications/config";
import type { NotificationMessage, NotificationRecipient, NotificationResult } from "@/lib/notifications/types";

export async function sendSms(recipient: NotificationRecipient, message: NotificationMessage): Promise<NotificationResult> {
  if (!isSmsEnabled()) return { success: false, channel: "sms", skipped: true, error: "SMS notifications are disabled." };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!accountSid || !authToken || !messagingServiceSid) {
    return { success: false, channel: "sms", error: "Twilio is not configured." };
  }
  if (!recipient.phone) return { success: false, channel: "sms", error: "SMS recipient has no phone number." };

  const body = message.body.trim();
  if (!body || body.length > 1600) return { success: false, channel: "sms", error: "SMS body must contain 1-1600 characters." };

  const payload = new URLSearchParams({ To: recipient.phone, MessagingServiceSid: messagingServiceSid, Body: body });
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });
    const data = (await response.json().catch(() => null)) as { sid?: string; message?: string } | null;
    if (!response.ok) return { success: false, channel: "sms", error: data?.message ?? "Twilio SMS request failed." };
    return { success: true, channel: "sms", messageId: data?.sid };
  } catch (error) {
    console.error("[TWILIO_SMS_ERROR]", error);
    return { success: false, channel: "sms", error: "Unable to send SMS." };
  }
}
