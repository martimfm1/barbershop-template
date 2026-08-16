import QRCode from "qrcode";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type LoyaltyEmailError = { status: number | null };
export class LoyaltyEmailDeliveryError extends Error implements LoyaltyEmailError {
  readonly status: number | null;

  constructor(status: number | null, message = "Loyalty email delivery failed.") {
    super(message);
    this.name = "LoyaltyEmailDeliveryError";
    this.status = status;
  }
}

async function sendBrevoEmail(input: {
  email: string;
  subject: string;
  htmlContent: string;
  attachment?: Array<{ name: string; content: string }>;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  if (!apiKey || !senderEmail) throw new LoyaltyEmailDeliveryError(null, "Loyalty email configuration is missing.");

  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { name: "Silentra", email: senderEmail },
        to: [{ email: input.email }],
        subject: input.subject,
        htmlContent: input.htmlContent,
        ...(input.attachment ? { attachment: input.attachment } : {}),
      }),
    });
  } catch {
    throw new LoyaltyEmailDeliveryError(null);
  }

  if (!response.ok) throw new LoyaltyEmailDeliveryError(response.status);
}

export async function sendLoyaltyCodeEmail(email: string, code: string, barbershopName: string): Promise<void> {
  const safeShop = escapeHtml(barbershopName);
  const safeCode = escapeHtml(code);
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;background:#09090b;color:#f4f4f5;padding:32px 16px;">
      <div style="max-width:480px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:18px;padding:28px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#86efac;">Programa de fidelização</div>
        <h1 style="font-size:22px;margin:10px 0 8px;color:#fff;">Código de acesso</h1>
        <p style="color:#a1a1aa;line-height:1.5;margin:0 0 22px;">Usa este código para entrar na fidelização da ${safeShop}.</p>
        <div style="text-align:center;background:#09090b;border:1px solid #3f3f46;border-radius:14px;padding:20px;">
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#fff;">${safeCode}</div>
        </div>
        <p style="font-size:12px;line-height:1.6;color:#71717a;margin:20px 0 0;">O código expira em 10 minutos e só pode ser utilizado uma vez. Se não pediste este código, ignora este email.</p>
      </div>
    </div>`;

  await sendBrevoEmail({
    email,
    subject: `Código da fidelização — ${barbershopName}`,
    htmlContent,
  });
}

type LoyaltyRedemptionEmailInput = {
  email: string;
  customerName: string | null;
  barbershopName: string;
  rewardName: string;
  rewardDescription: string | null;
  pointsCost: number;
  remainingPoints: number;
  code: string;
  qrPayload: string;
  expiresAt: string;
};

export async function sendLoyaltyRedemptionEmail(input: LoyaltyRedemptionEmailInput): Promise<void> {
  const qrBuffer = await QRCode.toBuffer(input.qrPayload, {
    type: "png",
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const safeName = escapeHtml(input.customerName?.trim() || "Olá");
  const safeShop = escapeHtml(input.barbershopName);
  const safeReward = escapeHtml(input.rewardName);
  const safeDescription = escapeHtml(input.rewardDescription || "Recompensa de fidelização");
  const safeCode = escapeHtml(input.code);
  const safeToken = escapeHtml(input.qrPayload);
  const expiresAt = new Date(input.expiresAt);
  const expiryLabel = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  }).format(expiresAt);

  const htmlContent = `
    <div style="margin:0;background:#09090b;color:#f4f4f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 28px 20px;background:linear-gradient(145deg,#17171a,#101012);">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#86efac;">Fidelização</div>
          <h1 style="font-size:24px;line-height:1.2;margin:10px 0 8px;color:#fff;">O teu voucher está pronto</h1>
          <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0;">${safeName}, o teu resgate na ${safeShop} foi criado com sucesso.</p>
        </div>
        <div style="padding:24px 28px 28px;">
          <div style="border:1px solid #3f3f46;border-radius:16px;padding:18px;background:#0b0b0d;">
            <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Recompensa</div>
            <div style="font-size:20px;font-weight:700;color:#fff;margin-top:6px;">${safeReward}</div>
            <div style="font-size:13px;line-height:1.5;color:#a1a1aa;margin-top:6px;">${safeDescription}</div>
            <div style="font-size:13px;color:#86efac;margin-top:12px;">${input.pointsCost} pontos utilizados · ${input.remainingPoints} pontos restantes</div>
          </div>
          <div style="text-align:center;margin-top:24px;"><div style="font-size:12px;color:#a1a1aa;margin-bottom:12px;">O QR Code está anexado a este email</div><div style="display:inline-block;background:#fff;border-radius:18px;padding:14px;color:#111;font-size:13px;font-weight:700;">Anexo: silentra-voucher-qr.png</div></div>
          <div style="margin-top:22px;text-align:center;"><div style="font-size:12px;color:#71717a;">Código alternativo</div><div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#fff;margin-top:8px;">${safeCode}</div></div>
          <div style="margin-top:20px;border:1px solid #27272a;background:#0b0b0d;border-radius:12px;padding:14px;"><div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Token do voucher</div><div style="font-size:12px;line-height:1.5;color:#d4d4d8;margin-top:6px;word-break:break-all;">${safeToken}</div></div>
          <div style="margin-top:24px;border:1px solid #7f1d1d;background:#2a0f12;border-radius:12px;padding:14px;"><div style="font-size:13px;font-weight:700;color:#fecaca;">Válido durante 1 hora</div><div style="font-size:12px;line-height:1.5;color:#fca5a5;margin-top:4px;">Este voucher expira em ${escapeHtml(expiryLabel)}. Depois dessa hora, o QR, o token e o código deixam de poder ser utilizados.</div></div>
          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:22px 0 0;">Não partilhes este QR, token ou código. O voucher é de utilização única e é validado diretamente pela equipa da barbearia.</p>
        </div>
      </div>
    </div>`;

  await sendBrevoEmail({
    email: input.email,
    subject: `Voucher de fidelização — ${input.rewardName} — ${input.barbershopName}`,
    htmlContent,
    attachment: [{ name: "silentra-voucher-qr.png", content: qrBuffer.toString("base64") }],
  });
}
