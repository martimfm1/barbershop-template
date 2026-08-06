export interface BookingEmailPayload {
  to: string;
  clientName: string;
  serviceName: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:MM
  barbershopName: string;
  barbershopAddress: string;
}

export type SendEmailResponse = 
  | { success: true; messageId?: string }
  | { success: false; error: string };

/**
 * Gera os links do Google Calendar, Apple Calendar e links de navegação GPS.
 */
function generateHelpers(
  dateStr: string,
  timeStr: string,
  title: string,
  description: string,
  location: string
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

  // Link do Google Calendar
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startIso}/${endIso}&details=${encodedDesc}&location=${encodedLocation}`;

  // Links de Direções e Tempo de Percurso em Tempo Real
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${encodedLocation}`;

  // Ficheiro iCalendar (.ics) para Apple Calendar
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
  const appleCalDataUrl = `data:text/calendar;charset=utf8;base64,${icsBase64}`;

  return { googleCalUrl, appleCalDataUrl, googleMapsUrl, appleMapsUrl, icsBase64 };
}

/**
 * Envia o e-mail transacional de confirmação com itinerário e agenda no bloco principal.
 */
export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload
): Promise<SendEmailResponse> {
  const { to, clientName, serviceName, date, time, barbershopName, barbershopAddress } = payload;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error("[BREVO_ERROR] Variáveis BREVO_API_KEY ou SENDER_EMAIL ausentes.");
    return { success: false, error: "Configuração do servidor de e-mail incompleta." };
  }

  const eventTitle = `${serviceName} — ${barbershopName}`;
  const eventDetails = `Reserva de serviço: ${serviceName}.\nCliente: ${clientName}.\nLocal: ${barbershopName}.\nEndereço: ${barbershopAddress}.`;
  
  const { googleCalUrl, appleCalDataUrl, googleMapsUrl, appleMapsUrl, icsBase64 } = generateHelpers(
    date,
    time,
    eventTitle,
    eventDetails,
    `${barbershopName}, ${barbershopAddress}`
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Agendamento</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0e; color: #f4f4f5; margin: 0; padding: 24px 12px; }
          .card { max-width: 500px; margin: 0 auto; background-color: #141417; border: 1px solid #27272a; border-radius: 8px; padding: 32px 24px; }
          .brand-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa; font-weight: 600; margin-bottom: 6px; }
          .header { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 12px; letter-spacing: -0.3px; }
          .divider { height: 1px; background-color: #27272a; margin: 20px 0; border: 0; }
          
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .details-table td { padding: 10px 0; border-bottom: 1px solid #1f1f23; font-size: 14px; }
          .details-table tr:last-child td { border-bottom: 0; }
          .label { color: #8e8e93; font-weight: 400; width: 28%; vertical-align: top; }
          .value { color: #ffffff; font-weight: 600; text-align: right; vertical-align: top; }
          
          /* Bloco de Ações Unificado */
          .actions-container { margin-top: 20px; }
          .btn { display: block; text-decoration: none; padding: 12px 16px; border-radius: 6px; font-weight: 500; font-size: 13px; line-height: 1.4; text-align: center; box-sizing: border-box; }
          
          .btn-primary { background-color: #ffffff; color: #09090b !important; border: 1px solid #ffffff; margin-bottom: 10px; }
          .btn-secondary { background-color: transparent; color: #ffffff !important; border: 1px solid #3f3f46; margin-bottom: 16px; }
          
          .nav-grid { display: table; width: 100%; table-layout: fixed; border-spacing: 6px 0; margin-top: 6px; }
          .nav-cell { display: table-cell; }
          .btn-nav { background-color: #1c1c20; color: #a1a1aa !important; border: 1px solid #27272a; padding: 10px; font-size: 12px; }
          .btn-nav:hover { color: #ffffff !important; border-color: #3f3f46; }
          
          .footer { font-size: 12px; color: #66666e; text-align: center; margin-top: 28px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand-title">${barbershopName}</div>
          <div class="header">Agendamento Confirmado</div>
          
          <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 20px 0; line-height: 1.5;">
            Estimado(a) <strong>${clientName}</strong>, confirmamos que a sua marcação foi registada com sucesso.
          </p>

          <!-- Tabela de Detalhes da Marcação -->
          <table class="details-table" role="presentation">
            <tr>
              <td class="label">Serviço</td>
              <td class="value">${serviceName}</td>
            </tr>
            <tr>
              <td class="label">Data</td>
              <td class="value">${date}</td>
            </tr>
            <tr>
              <td class="label">Horário</td>
              <td class="value">${time}</td>
            </tr>
            <tr>
              <td class="label">Endereço</td>
              <td class="value" style="font-weight: 400; color: #d4d4d8;">${barbershopAddress}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Ações Principais: Calendário e Direções de Chegada -->
          <div class="actions-container">
            <a href="${googleCalUrl}" target="_blank" class="btn btn-primary" aria-label="Adicionar ao Google Calendar">
              Adicionar ao Google Calendar
            </a>
            <a href="${appleCalDataUrl}" download="agendamento.ics" class="btn btn-secondary" aria-label="Adicionar ao Apple Calendar">
              Adicionar ao Apple Calendar
            </a>

            <div class="nav-grid">
              <div class="nav-cell">
                <a href="${googleMapsUrl}" target="_blank" class="btn btn-nav" aria-label="Ver rota no Google Maps">
                  Google Maps
                </a>
              </div>
              <div class="nav-cell">
                <a href="${appleMapsUrl}" target="_blank" class="btn btn-nav" aria-label="Ver rota no Apple Maps">
                  Apple Maps
                </a>
              </div>
            </div>
          </div>

          <div class="footer">
            Caso necessite de alterar ou cancelar a sua marcação, solicitamos que entre em contacto direto com o estabelecimento.
          </div>
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

    const data = await response.json();

    if (!response.ok) {
      console.error("[BREVO_API_ERROR]", data);
      return { success: false, error: data.message || "Falha ao enviar e-mail via API Brevo." };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error("[BREVO_FETCH_ERROR]", error);
    return { success: false, error: error?.message || "Erro ao comunicar com a API do Brevo." };
  }
}