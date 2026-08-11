import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/brevo/brevo";
import {
  isRecord,
  isSafePublicBookingDate,
  isValidTime,
  normalizeText,
  UUID_PATTERN,
} from "@/lib/validation";

type BookingRequestBody = {
  shopId?: unknown;
  service?: unknown;
  date?: unknown;
  slot?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerEmail?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Creates a public booking only after checking the shop, service and slot. */
export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!isRecord(payload)) {
      return NextResponse.json({ success: false, error: "Pedido inválido." }, { status: 400 });
    }

    const { shopId, service, date, slot, customerName, customerPhone, customerEmail } = payload as BookingRequestBody;
    const name = normalizeText(customerName, 120);
    const phone = normalizeText(customerPhone, 30);
    const email = normalizeText(customerEmail, 254)?.toLowerCase();
    const bookingDate = typeof date === "string" ? date : new Date().toISOString().slice(0, 10);
    const bookingTime = typeof slot === "string" ? slot.slice(0, 5) : "";

    if (
      typeof shopId !== "string" || !UUID_PATTERN.test(shopId) ||
      typeof service !== "string" || !UUID_PATTERN.test(service) ||
      !name || !phone || !email || !EMAIL_PATTERN.test(email) ||
      !isSafePublicBookingDate(bookingDate) || !isValidTime(bookingTime)
    ) {
      return NextResponse.json(
        { success: false, error: "Confirma os dados e escolhe uma data e hora válidas." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select(`
        barbershop_id,
        is_active,
        barbershops (
          name,
          address
        )
      `)
      .eq("id", shopId)
      .maybeSingle();

    if (shopError || !shop?.barbershop_id || !shop.is_active) {
      return NextResponse.json({ success: false, error: "Barbearia indisponível." }, { status: 404 });
    }

    const barbershopId = shop.barbershop_id;
    const shopRelation = Array.isArray(shop.barbershops) ? shop.barbershops[0] : shop.barbershops;
    const barbershopName = shopRelation?.name || "Barbearia";
    const barbershopAddress = shopRelation?.address || "Endereço sob consulta";

    const { data: selectedService, error: serviceError } = await supabase
      .from("services")
      .select("id, name")
      .eq("id", service)
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (serviceError || !selectedService) {
      return NextResponse.json(
        { success: false, error: "Serviço indisponível para esta barbearia." },
        { status: 400 },
      );
    }

    const serviceName = selectedService.name || "Serviço";
    const dateHourIso = `${bookingDate}T${bookingTime}:00`;
    const { data: existingAppointment, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .eq("date_hour", dateHourIso)
      .in("status", ["pending", "scheduled"])
      .maybeSingle();

    if (conflictError) {
      console.error("[API_BOOKING_CONFLICT_CHECK_ERROR]", conflictError);
      return NextResponse.json(
        { success: false, error: "Não foi possível confirmar a disponibilidade." },
        { status: 503 },
      );
    }

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: "Este horário já não está disponível." },
        { status: 409 },
      );
    }

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        barbershop_id: barbershopId,
        service_id: service,
        date_hour: dateHourIso,
        status: "scheduled",
        manual_name: name,
        manual_phone: phone,
        manual_email: email,
      })
      .select()
      .single();

    if (insertError || !appointment) {
      console.error("[API_BOOKING_SUPABASE_ERROR]", insertError);
      return NextResponse.json(
        { success: false, error: "Não foi possível efetuar a marcação. Tenta novamente." },
        { status: 500 },
      );
    }

    sendBookingConfirmationEmail({
      to: email,
      clientName: name,
      serviceName,
      date: bookingDate,
      time: bookingTime,
      barbershopId,
      barbershopName,
      barbershopAddress,
    }).catch((err) => {
      console.error("[BACKGROUND_EMAIL_ERROR] Falha ao enviar e-mail de confirmação:", err);
    });

    console.info(`[API_BOOKING_SUCCESS] ID: ${appointment.id} | Shop: ${shopId}`);
    return NextResponse.json(
      {
        success: true,
        message: "Marcação confirmada com sucesso!",
        booking: {
          id: appointment.id,
          barbershopId: appointment.barbershop_id,
          serviceId: appointment.service_id,
          dateHour: appointment.date_hour,
          status: appointment.status,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[API_BOOKING_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
