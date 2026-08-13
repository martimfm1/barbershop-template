function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendCustomerPortalCodeEmail(email: string, code: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    throw new Error("Configuração do servidor de e-mail incompleta.");
  }

  const safeCode = escapeHtml(code);
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;background:#0c0c0e;color:#f4f4f5;padding:32px 16px;">
      <div style="max-width:480px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:12px;padding:28px;">
        <h1 style="font-size:20px;margin:0 0 10px;">As tuas marcações</h1>
        <p style="color:#a1a1aa;line-height:1.5;margin:0 0 24px;">Usa o código abaixo para confirmar o teu email e aceder às marcações associadas a este endereço.</p>
        <div style="text-align:center;background:#09090b;border:1px solid #3f3f46;border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="font-size:32px;font-weight:800;letter-spacing:10px;color:#fff;">${safeCode}</div>
        </div>
        <p style="font-size:12px;color:#71717a;margin:0;">O código expira em 10 minutos. Se não pediste este código, podes ignorar este email.</p>
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
      to: [{ email }],
      subject: "Código para aceder às tuas marcações — Silentra",
      htmlContent,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Não foi possível enviar o email.");
  }
}
