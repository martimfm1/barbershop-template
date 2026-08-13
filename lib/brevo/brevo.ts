export interface BookingEmailPayload {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  barbershopId?: string;
  barbershopName: string;
  barbershopAddress: string;
}

export type SendEmailResponse =
  | { success: true; messageId?: string }
  | { success: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBarbershopAvatarUrl(barbershopId?: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl || !barbershopId) return null;
  return `${supabaseUrl}/storage/v1/object/public/avatar/${encodeURIComponent(barbershopId)}/avatar.webp`;
}

function generateHelpers(
  dateStr: string,
  timeStr: string,
  title: string,
  description: string,
  location: string,
) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  const startIso = formatUtc(startDate);
  const endIso = formatUtc(endDate);
  const encodedLocation = encodeURIComponent(location);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startIso}/${endIso}&details=${encodedDesc}&location=${encodedLocation}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${encodedLocation}`;
  const icsRaw = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Silentra Barbers//Booking System//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsBase64 = Buffer.from(icsRaw).toString("base64");
  return {
    googleCalUrl,
    appleCalDataUrl: `data:text/calendar;charset=utf8;base64,${icsBase64}`,
    googleMapsUrl,
    appleMapsUrl,
  };
}

export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload,
): Promise<SendEmailResponse> {
  const {
    to,
    clientName,
    serviceName,
    date,
    time,
    barbershopId,
    barbershopName,
    barbershopAddress,
  } = payload;
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error(
      "[BREVO_ERROR] Variáveis BREVO_API_KEY ou SENDER_EMAIL ausentes.",
    );
    return {
      success: false,
      error: "Configuração do servidor de e-mail incompleta.",
    };
  }

  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const safeBarbershopName = escapeHtml(barbershopName);
  const safeBarbershopAddress = escapeHtml(barbershopAddress);
  const avatarUrl = getBarbershopAvatarUrl(barbershopId);
  const eventTitle = `${serviceName} — ${barbershopName}`;
  const eventDetails = `Reserva de serviço: ${serviceName}.\nCliente: ${clientName}.\nLocal: ${barbershopName}.\nEndereço: ${barbershopAddress}.`;
  const { googleCalUrl, appleCalDataUrl, googleMapsUrl, appleMapsUrl } =
    generateHelpers(
      date,
      time,
      eventTitle,
      eventDetails,
      `${barbershopName}, ${barbershopAddress}`,
    );

  const avatarMarkup = avatarUrl
    ? `<img src="${avatarUrl}" alt="${safeBarbershopName}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:16px;object-fit:cover;border:1px solid #27272a;" />`
    : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Agendamento</title>
        <style>
          body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0c0c0e;color:#f4f4f5;margin:0;padding:24px 12px; }
          .card { max-width:500px;margin:0 auto;background-color:#141417;border:1px solid #27272a;border-radius:8px;padding:32px 24px; }
          .brand { margin-bottom:24px; }
          .brand-title { font-size:14px;color:#ffffff;font-weight:600;margin-top:10px; }
          .header { font-size:20px;font-weight:600;color:#ffffff;margin-bottom:12px; }
          .divider { height:1px;background-color:#27272a;margin:20px 0;border:0; }
          .details-table { width:100%;border-collapse:collapse;margin-bottom:16px; }
          .details-table td { padding:10px 0;border-bottom:1px solid #1f1f23;font-size:14px; }
          .details-table tr:last-child td { border-bottom:0; }
          .label { color:#8e8e93;font-weight:400;width:28%;vertical-align:top; }
          .value { color:#ffffff;font-weight:600;text-align:right;vertical-align:top; }
          .actions-container { margin-top:20px; }
          .btn { display:block;text-decoration:none;padding:12px 16px;border-radius:6px;font-weight:500;font-size:13px;line-height:1.4;text-align:center;box-sizing:border-box; }
          .btn-primary { background-color:#ffffff;color:#09090b !important;border:1px solid #ffffff;margin-bottom:10px; }
          .btn-secondary { background-color:transparent;color:#ffffff !important;border:1px solid #3f3f46;margin-bottom:16px; }
          .nav-grid { display:table;width:100%;table-layout:fixed;border-spacing:6px 0;margin-top:6px; }
          .nav-cell { display:table-cell; }
          .btn-nav { background-color:#1c1c20;color:#a1a1aa !important;border:1px solid #27272a;padding:10px;font-size:12px; }
          .footer { font-size:12px;color:#66666e;text-align:center;margin-top:28px;line-height:1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">
            ${avatarMarkup}
            <div class="brand-title">${safeBarbershopName}</div>
          </div>
          <div class="header">Agendamento Confirmado</div>
          <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px 0;line-height:1.5;">Estimado(a) <strong>${safeClientName}</strong>, confirmamos que a sua marcação foi registada com sucesso.</p>
          <table class="details-table" role="presentation">
            <tr><td class="label">Serviço</td><td class="value">${safeServiceName}</td></tr>
            <tr><td class="label">Data</td><td class="value">${escapeHtml(date)}</td></tr>
            <tr><td class="label">Horário</td><td class="value">${escapeHtml(time)}</td></tr>
            <tr><td class="label">Endereço</td><td class="value" style="font-weight:400;color:#d4d4d8;">${safeBarbershopAddress}</td></tr>
          </table>
          <div class="divider"></div>
          <div class="actions-container">
            <a href="${googleCalUrl}" target="_blank" class="btn btn-primary">Adicionar ao Google Calendar</a>
            <a href="${appleCalDataUrl}" download="agendamento.ics" class="btn btn-secondary">Adicionar ao Apple Calendar</a>
            <div class="nav-grid"><div class="nav-cell"><a href="${googleMapsUrl}" target="_blank" class="btn btn-nav">Google Maps</a></div><div class="nav-cell"><a href="${appleMapsUrl}" target="_blank" class="btn btn-nav">Apple Maps</a></div></div>
          </div>
          <div class="footer">Caso necessite de alterar ou cancelar a sua marcação, solicitamos que entre em contacto direto com o estabelecimento.</div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: barbershopName, email: senderEmail },
        to: [{ email: to, name: clientName }],
        subject: `Confirmação de Agendamento — ${barbershopName}`,
        htmlContent,
      }),
    });
    const data = (await response.json()) as {
      messageId?: string;
      message?: string;
    };
    if (!response.ok) {
      console.error("[BREVO_API_ERROR]", data);
      return {
        success: false,
        error: data.message || "Falha ao enviar e-mail via API Brevo.",
      };
    }
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[BREVO_FETCH_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao comunicar com a API do Brevo.",
    };
  }
}
