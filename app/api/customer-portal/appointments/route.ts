import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/customer-booking-portal";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessão expirada. Confirma novamente o teu email." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(`
      id,
      date_hour,
      duration_minutes,
      status,
      manual_email,
      cancellation_reason,
      cancelled_at,
      service_id,
      professional_id,
      barbershop_id,
      services ( name, duration, price ),
      professionals ( name ),
      barbershops ( name, address, time_limit_cancellation_hours )
    `)
    .eq("manual_email", session.email)
    .order("date_hour", { ascending: true });

  if (error) {
    console.error("[CUSTOMER_PORTAL_APPOINTMENTS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Não foi possível carregar as marcações." }, { status: 503 });
  }

  const now = Date.now();
  const appointments = (data ?? []).map((appointment: any) => ({
    id: appointment.id,
    dateHour: appointment.date_hour,
    durationMinutes: appointment.duration_minutes ?? appointment.services?.duration ?? 30,
    status: appointment.status,
    serviceName: appointment.services?.name ?? "Serviço",
    servicePrice: Number(appointment.services?.price ?? 0),
    professionalName: appointment.professionals?.name ?? null,
    professionalId: appointment.professional_id,
    barbershopId: appointment.barbershop_id,
    barbershopName: appointment.barbershops?.name ?? "Barbearia",
    barbershopAddress: appointment.barbershops?.address ?? null,
    cancellationHours: Math.max(0, Number(appointment.barbershops?.time_limit_cancellation_hours ?? 24)),
    cancellationReason: appointment.cancellation_reason ?? null,
    cancelledAt: appointment.cancelled_at ?? null,
  }));

  const upcoming = appointments.filter((item) =>
    new Date(item.dateHour).getTime() >= now && ["pending", "scheduled"].includes(item.status),
  );
  const past = appointments.filter((item) => !upcoming.some((upcomingItem) => upcomingItem.id === item.id));

  return NextResponse.json(
    { success: true, email: session.email, upcoming, past },
    { headers: { "Cache-Control": "no-store" } },
  );
}
