import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmationEmail, BookingEmailPayload } from "@/lib/brevo/brevo";

export async function POST(request: NextRequest) {
  try {
    const body: Partial<BookingEmailPayload> = await request.json();

    const { to, clientName, serviceName, date, time, barbershopName, barbershopAddress } = body;

    // Validação de contrato dos campos obrigatórios
    if (!to || !clientName || !serviceName || !date || !time || !barbershopName || !barbershopAddress) {
      return NextResponse.json(
        { 
          error: "Payload inválido. Os campos 'to', 'clientName', 'serviceName', 'date', 'time', 'barbershopName' e 'barbershopAddress' são obrigatórios." 
        },
        { status: 400 }
      );
    }

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Endereço de e-mail inválido." },
        { status: 400 }
      );
    }

    const result = await sendBookingConfirmationEmail({
      to,
      clientName,
      serviceName,
      date,
      time,
      barbershopName,
      barbershopAddress
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    );

  } catch (error) {
    console.error("[EMAIL_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar o pedido de e-mail." },
      { status: 500 }
    );
  }
}