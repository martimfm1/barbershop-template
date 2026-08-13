import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/brevo/brevo";

const CONFIRM_ROLES = new Set(["owner", "admin", "manager", "receptionist", "staff"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sessão inválida." },
        { status: 401 },
      );
    }

    // Read the already-authenticated user's profile with the server-only admin client.
    // This avoids a false 403 caused by client-side RLS while preserving strict tenant checks below.
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("barbershop_id, role")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(profile?.role ?? "").trim().toLowerCase();

    if (profileError || !profile?.barbershop_id || !CONFIRM_ROLES.has(role)) {
      console.error("[APPOINTMENT_CONFIRM_PERMISSION]", {
        userId: user.id,
        role: profile?.role ?? null,
        barbershopId: profile?.barbershop_id ?? null,
        profileError: profileError?.message ?? null,
      });
      return NextResponse.json(
        { success: false, error: "Sem permissão para confirmar marcações." },
        { status: 403 },
      );
    }

    const { data: appointment, error: appointmentError } = await admin
      .from("appointments")
      .select(
        "id, status, barbershop_id, date_hour, manual_name, manual_phone, manual_email, client_id, service_id, services(name), users!appointments_client_id_fkey(name_complete, email)",
      )
      .eq("id", appointmentId)
      .eq("barbershop_id", profile.barbershop_id)
      .maybeSingle();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { success: false, error: "Marcação não encontrada." },
        { status: 404 },
      );
    }

    if (appointment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Esta marcação já foi processada.",
          alreadyConfirmed: appointment.status === "scheduled",
        },
        { status: 409 },
      );
    }

    const { data: barbershop, error: barbershopError } = await admin
      .from("barbershops")
      .select("name, address")
      .eq("id", profile.barbershop_id)
      .maybeSingle();

    if (barbershopError || !barbershop) {
      return NextResponse.json(
        { success: false, error: "Não foi possível carregar os dados da barbearia." },
        { status: 500 },
      );
    }

    const { data: confirmedAppointment, error: updateError } = await admin
      .from("appointments")
      .update({ status: "scheduled" })
      .eq("id", appointmentId)
      .eq("barbershop_id", profile.barbershop_id)
      .eq("status", "pending")
      .select("id, status, date_hour")
      .maybeSingle();

    if (updateError || !confirmedAppointment) {
      console.error("[APPOINTMENT_CONFIRM_UPDATE_ERROR]", updateError);
      return NextResponse.json(
        { success: false, error: "Não foi possível confirmar a marcação." },
        { status: 409 },
      );
    }

    const clientRelation = Array.isArray(appointment.users)
      ? appointment.users[0]
      : appointment.users;
    const serviceRelation = Array.isArray(appointment.services)
      ? appointment.services[0]
      : appointment.services;

    const recipientEmail =
      appointment.manual_email?.trim().toLowerCase() ||
      clientRelation?.email?.trim().toLowerCase() ||
      null;
    const recipientName =
      appointment.manual_name?.trim() ||
      clientRelation?.name_complete?.trim() ||
      "Cliente";

    let emailSent = false;
    let emailError: string | null = null;

    if (recipientEmail) {
      const date = new Date(appointment.date_hour);
      const result = await sendBookingConfirmationEmail({
        to: recipientEmail,
        clientName: recipientName,
        serviceName: serviceRelation?.name || "Serviço",
        date: date.toISOString().slice(0, 10),
        time: date.toTimeString().slice(0, 5),
        barbershopId: profile.barbershop_id,
        barbershopName: barbershop.name,
        barbershopAddress: barbershop.address || "Endereço sob consulta",
      });

      emailSent = result.success;
      if (!result.success) {
        emailError = result.error;
        console.error("[MANUAL_BOOKING_CONFIRM_EMAIL_ERROR]", result.error);
      }
    }

    return NextResponse.json({
      success: true,
      appointment: confirmedAppointment,
      emailSent,
      emailError,
      message: emailSent
        ? "Marcação confirmada e e-mail enviado."
        : recipientEmail
          ? "Marcação confirmada, mas não foi possível enviar o e-mail."
          : "Marcação confirmada. O cliente não tem e-mail associado.",
    });
  } catch (error) {
    console.error("[APPOINTMENT_CONFIRM_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao confirmar a marcação." },
      { status: 500 },
    );
  }
}
