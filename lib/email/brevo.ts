export type EmailSendResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

export async function sendBrevoEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME ?? "Silentra";

  if (!apiKey || !senderEmail) {
    return { success: false, error: "Brevo is not configured." };
  }

  if (!input.to || !input.subject || !input.htmlContent) {
    return { success: false, error: "Email recipient, subject and content are required." };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: input.to, ...(input.toName ? { name: input.toName } : {}) }],
        subject: input.subject,
        htmlContent: input.htmlContent,
      }),
    });

    const data = (await response.json()) as { messageId?: string; message?: string };
    if (!response.ok) {
      return { success: false, error: data.message ?? "Brevo email request failed." };
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[BREVO_EMAIL_ERROR]", error);
    return { success: false, error: "Unable to send email." };
  }
}
