import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmationEmail, BookingEmailPayload } from "@/lib/brevo/brevo";
import { requireTenantAuthorization } from "@/lib/security/tenant-guard";

export async function POST(request: NextRequest) {
  try {
    const body: Partial<BookingEmailPayload> = await request.json();

    const { to, clientName, serviceName, date, time, barbershopId, barbershopName, barbershopAddress } = body;

    if (!to || !clientName || !serviceName || !date || !time || !barbershopId || !barbershopName || !barbershopAddress) {
      return NextResponse.json(
        { error: "Payload inválido. Os campos 'to', 'clientName', 'serviceName', 'date', 'time', 'barbershopId', 'barbershopName' e 'barbershopAddress' são obrigatórios." },
        { status: 400 },
      );
    }

    await requireTenantAuthorization({ barbershopId });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: "Endereço de e-mail inválido." }, { status: 400 });
    }

    const result = await sendBookingConfirmationEmail({
      to,
      clientName,
      serviceName,
      date,
      time,
      barbershopId,
      barbershopName,
      barbershopAddress,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 });
  } catch (error) {
    console.error("[EMAIL_ROUTE_ERROR]", error);
    const status = error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "TENANT_ACCESS_DENIED") ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Não autorizado." : "Erro interno do servidor ao processar o pedido de e-mail." },
      { status },
    );
  }
}
