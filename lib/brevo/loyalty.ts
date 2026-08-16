import QRCode from "qrcode";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  if (!apiKey || !senderEmail) throw new Error("Configuração do servidor de e-mail incompleta.");

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

          <div style="text-align:center;margin-top:24px;">
            <div style="font-size:12px;color:#a1a1aa;margin-bottom:12px;">Mostra este QR na barbearia</div>
            <div style="display:inline-block;background:#fff;border-radius:18px;padding:16px;">
              <img src="cid:loyalty-qrcode" width="260" height="260" alt="QR Code do voucher de fidelização" style="display:block;width:260px;height:260px;" />
            </div>
          </div>

          <div style="margin-top:22px;text-align:center;">
            <div style="font-size:12px;color:#71717a;">Código alternativo</div>
            <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#fff;margin-top:8px;">${safeCode}</div>
          </div>

          <div style="margin-top:24px;border:1px solid #7f1d1d;background:#2a0f12;border-radius:12px;padding:14px;">
            <div style="font-size:13px;font-weight:700;color:#fecaca;">Válido durante 1 hora</div>
            <div style="font-size:12px;line-height:1.5;color:#fca5a5;margin-top:4px;">Este voucher expira em ${escapeHtml(expiryLabel)}. Depois dessa hora, o QR e o código deixam de poder ser utilizados.</div>
          </div>

          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:22px 0 0;">Não partilhes este QR ou código com outras pessoas. O voucher é de utilização única e é validado diretamente pela equipa da barbearia.</p>
        </div>
      </div>
    </div>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "Silentra", email: senderEmail },
      to: [{ email: input.email }],
      subject: `Voucher de fidelização — ${input.rewardName} — ${input.barbershopName}`,
      htmlContent,
      attachment: [
        {
          name: "silentra-voucher-qr.png",
          content: qrBuffer.toString("base64"),
          contentType: "image/png",
          contentId: "loyalty-qrcode",
        },
      ],
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(data.message || "Não foi possível enviar o voucher por email.");
}
