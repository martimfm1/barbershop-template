import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/customer-booking-portal";
import { createAdminClient } from "@/lib/supabase/admin";

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

function parseClosedDays(value: unknown): Set<number> {
  const names: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    domingo: 0, segunda: 1, terça: 2, terca: 2, quarta: 3, quinta: 4, sexta: 5, sábado: 6, sabado: 6,
  };
  const values = typeof value === "string" ? value.split(",").map((item) => item.trim().toLowerCase()) : Array.isArray(value) ? value : [];
  const result = new Set<number>();
  for (const valueItem of values) {
    if (typeof valueItem === "number" && valueItem >= 0 && valueItem <= 6) result.add(valueItem);
    if (typeof valueItem === "string" && names[valueItem] !== undefined) result.add(names[valueItem]);
  }
  return result;
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

async function getAuthorizedAppointment(appointmentId: string) {
  const session = await getPortalSession();
  if (!session) return { session: null, appointment: null, admin: null };
  const admin = createAdminClient();
  const { data: appointment, error } = await admin
    .from("appointments")
    .select(`
      id,
      barbershop_id,
      date_hour,
      duration_minutes,
      status,
      manual_email,
      professional_id,
      service_id,
      barbershops ( opening_time, closing_time, lunch_start, lunch_end, closed_days, time_limit_cancellation_hours ),
      services ( name, duration )
    `)
    .eq("id", appointmentId)
    .ilike("manual_email", session.email)
    .maybeSingle();

  if (error || !appointment) return { session, appointment: null, admin };
  return { session, appointment, admin };
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    const { session, appointment, admin } = await getAuthorizedAppointment(appointmentId);
    if (!session) return jsonError("Sessão expirada. Confirma novamente o teu email.", 401);
    if (!appointment || !admin) return jsonError("Marcação não encontrada.", 404);
    if (!["pending", "scheduled"].includes(appointment.status)) return jsonError("Esta marcação já não pode ser cancelada.", 409);

    const cancellationHours = Math.max(0, Number((Array.isArray(appointment.barbershops) ? appointment.barbershops[0] : appointment.barbershops)?.time_limit_cancellation_hours ?? 24));
    const appointmentTime = new Date(appointment.date_hour).getTime();
    if (!Number.isFinite(appointmentTime)) return jsonError("Data da marcação inválida.", 409);
    const minimumTime = appointmentTime - cancellationHours * 60 * 60 * 1000;
    if (Date.now() > minimumTime) {
      return jsonError(`Esta marcação já está dentro do prazo mínimo de cancelamento (${cancellationHours}h). Contacta a barbearia para pedir ajuda.`, 409);
    }

    const { error } = await admin
      .from("appointments")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelamento pelo cliente através do portal" })
      .eq("id", appointment.id)
      .ilike("manual_email", session.email)
      .in("status", ["pending", "scheduled"]);

    if (error) {
      console.error("[CUSTOMER_PORTAL_CANCEL_ERROR]", error);
      return jsonError("Não foi possível cancelar a marcação.", 503);
    }

    await admin.from("audit_logs").insert({
      action: "customer_portal_cancel",
      entity_type: "appointment",
      entity_id: appointment.id,
      metadata: { email: session.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CUSTOMER_PORTAL_CANCEL_CRITICAL]", error);
    return jsonError("Não foi possível cancelar a marcação.", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    const body = (await request.json().catch(() => ({}))) as { date?: unknown; slot?: unknown };
    const date = typeof body.date === "string" ? body.date : "";
    const slot = typeof body.slot === "string" ? body.slot.slice(0, 5) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(slot)) return jsonError("Indica uma data e hora válidas.");

    const { session, appointment, admin } = await getAuthorizedAppointment(appointmentId);
    if (!session) return jsonError("Sessão expirada. Confirma novamente o teu email.", 401);
    if (!appointment || !admin) return jsonError("Marcação não encontrada.", 404);
    if (!["pending", "scheduled"].includes(appointment.status)) return jsonError("Esta marcação já não pode ser reagendada.", 409);

    const shop = Array.isArray(appointment.barbershops) ? appointment.barbershops[0] : appointment.barbershops;
    const cancellationHours = Math.max(0, Number(shop?.time_limit_cancellation_hours ?? 24));
    if (Date.now() > new Date(appointment.date_hour).getTime() - cancellationHours * 60 * 60 * 1000) {
      return jsonError(`Esta marcação já está dentro do prazo mínimo de reagendamento (${cancellationHours}h). Contacta a barbearia.`, 409);
    }

    const selectedWeekday = new Date(`${date}T12:00:00`).getDay();
    if (parseClosedDays(shop?.closed_days).has(selectedWeekday)) return jsonError("Este dia é de folga da barbearia.", 409);

    const openingTime = shop?.opening_time || "09:00";
    const closingTime = shop?.closing_time || "19:00";
    const start = timeToMinutes(slot);
    const duration = Math.min(Math.max(Number(appointment.duration_minutes ?? appointment.services?.duration ?? 30), 1), 1440);
    const end = start + duration;
    if (start < timeToMinutes(openingTime) || end > timeToMinutes(closingTime)) return jsonError("O novo horário fica fora do horário de funcionamento.", 409);

    const lunchStart = shop?.lunch_start ? timeToMinutes(shop.lunch_start) : null;
    const lunchEnd = shop?.lunch_end ? timeToMinutes(shop.lunch_end) : null;
    if (lunchStart !== null && lunchEnd !== null && overlaps(start, end, lunchStart, lunchEnd)) return jsonError("O novo horário coincide com a pausa da barbearia.", 409);

    const { data: blocks, error: blocksError } = await admin
      .from("schedule_blocks")
      .select("professional_id, start_time, end_time, reason")
      .eq("barbershop_id", appointment.barbershop_id)
      .eq("date", date);

    if (blocksError && blocksError.code !== "42P01") return jsonError("Não foi possível validar os horários bloqueados.", 503);

    const matchingBlock = (blocks ?? []).find((block: any) => {
      if (block.professional_id && block.professional_id !== appointment.professional_id) return false;
      if (!block.start_time || !block.end_time) return true;
      return overlaps(start, end, timeToMinutes(block.start_time), timeToMinutes(block.end_time));
    });
    if (matchingBlock) {
      const period = matchingBlock.start_time && matchingBlock.end_time ? ` (${matchingBlock.start_time.slice(0, 5)}–${matchingBlock.end_time.slice(0, 5)})` : " (todo o dia)";
      return jsonError(`${matchingBlock.reason?.trim() || "Este horário está bloqueado."}${period}`, 409);
    }

    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    const { data: appointments, error: appointmentsError } = await admin
      .from("appointments")
      .select("id, date_hour, duration_minutes, professional_id")
      .eq("barbershop_id", appointment.barbershop_id)
      .gte("date_hour", dayStart)
      .lte("date_hour", dayEnd)
      .in("status", ["pending", "scheduled"])
      .neq("id", appointment.id);

    if (appointmentsError) return jsonError("Não foi possível confirmar a disponibilidade.", 503);

    const conflict = (appointments ?? []).some((item: any) => {
      if (appointment.professional_id !== item.professional_id) return false;
      const parts = String(item.date_hour || "").includes("T") ? String(item.date_hour).split("T") : String(item.date_hour).split(" ");
      if (parts[0] !== date || !parts[1]) return false;
      const existingStart = timeToMinutes(parts[1]);
      const existingEnd = existingStart + Math.min(Math.max(Number(item.duration_minutes ?? 30), 1), 1440);
      return overlaps(start, end, existingStart, existingEnd);
    });

    if (conflict) return jsonError("O novo horário já não está disponível.", 409);

    const newDateHour = `${date}T${slot}:00`;
    const { error: updateError } = await admin
      .from("appointments")
      .update({ date_hour: newDateHour })
      .eq("id", appointment.id)
      .ilike("manual_email", session.email)
      .in("status", ["pending", "scheduled"]);

    if (updateError) {
      if (updateError.code === "23505" || updateError.code === "23P01") return jsonError("Este horário acabou de ser ocupado. Escolhe outro.", 409);
      console.error("[CUSTOMER_PORTAL_RESCHEDULE_ERROR]", updateError);
      return jsonError("Não foi possível reagendar a marcação.", 503);
    }

    await admin.from("audit_logs").insert({
      action: "customer_portal_reschedule",
      entity_type: "appointment",
      entity_id: appointment.id,
      metadata: { email: session.email, from: appointment.date_hour, to: newDateHour },
    });

    return NextResponse.json({ success: true, dateHour: newDateHour });
  } catch (error) {
    console.error("[CUSTOMER_PORTAL_RESCHEDULE_CRITICAL]", error);
    return jsonError("Não foi possível reagendar a marcação.", 500);
  }
}
