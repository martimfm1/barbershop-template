import { createClient } from "@/lib/supabase/client";
import { deleteRecord, insertRecord, listRecords, updateRecord } from "@/lib/db";
import type { Appointment, Client } from "@/types";

export interface FinalizeBookingPayload { payment_method: string; value_products: number; description_products: string; }
const supabase = createClient();

export const appointmentService = {
  async getAll(barbershopId: string) {
    const { data, error } = await listRecords<Appointment>(supabase, "appointments", { barbershop_id: barbershopId }, { select: "*, users (name_complete, num_phone, email, birth_date, style_notes), services (name, price), professionals (name)", orderBy: { column: "date_hour", ascending: false } });
    return { data: (data ?? []) as Appointment[], error };
  },
  async create(payload: { barbershop_id: string; date_hour: string; status: Appointment["status"]; client_id: string | null; service_id: string; professional_id: string; manual_name: string | null; manual_phone: string | null; manual_birth_date: string | null }) {
    const variants = [
      payload,
      {
        barbershop_id: payload.barbershop_id,
        date: payload.date_hour,
        status: payload.status,
        service_id: payload.service_id,
        barber_id: payload.professional_id,
        client_name: payload.manual_name ?? "",
        client_phone: payload.manual_phone ?? "",
        manual_birth_date: payload.manual_birth_date,
      },
    ] as const;
    let lastError: Error | null = null;
    for (const variant of variants) { const result = await insertRecord<Appointment>(supabase, "appointments", variant as Partial<Appointment>); if (!result.error) return result; lastError = result.error; }
    return { data: null, error: lastError };
  },
  async update(id: string, updates: Partial<Appointment>) { return updateRecord<Appointment>(supabase, "appointments", id, updates); },
  async delete(id: string) { return deleteRecord(supabase, "appointments", id); },
  async finalize(id: string, payload: FinalizeBookingPayload) { return updateRecord<Appointment>(supabase, "appointments", id, { status: "completed", payment_method: payload.payment_method, value_products: payload.value_products, description_products: payload.description_products }); },
  async getClients(barbershopId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from("users").select("id, name_complete, num_phone, email, birth_date, style_notes").eq("barbershop_id", barbershopId).order("name_complete", { ascending: true });
    if (user?.id) query = query.neq("id", user.id);
    const { data, error } = await query;
    return { data: data as Client[], error };
  },
  async createClient(payload: { barbershop_id: string; name_complete: string; num_phone: string; email?: string; birth_date?: string | null; style_notes?: string }) { return insertRecord<Client>(supabase, "users", payload); },
  async updateClient(id: string, updates: Partial<Client>) { return updateRecord<Client>(supabase, "users", id, updates); },
  async addClientFromCompletedAppointment(barbershopId: string, appointmentId: string) {
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, status, barbershop_id, client_id, manual_name, manual_phone, manual_birth_date")
      .eq("id", appointmentId)
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (appointmentError) return { data: null, error: appointmentError };
    if (!appointment) return { data: null, error: new Error("Marcação não encontrada.") };
    if (appointment.status !== "completed") return { data: null, error: new Error("Só podes adicionar clientes depois de concluir a marcação.") };
    if (appointment.client_id) return { data: null, alreadyExists: true, error: null };
    if (!appointment.manual_name?.trim()) return { data: null, error: new Error("Esta marcação não tem um nome de cliente válido.") };

    const normalizedPhone = appointment.manual_phone?.replace(/\s+/g, "").trim() || "";
    if (normalizedPhone) {
      const { data: existingByPhone, error: phoneError } = await supabase
        .from("users")
        .select("id, name_complete, num_phone, email, birth_date, style_notes")
        .eq("barbershop_id", barbershopId)
        .eq("num_phone", appointment.manual_phone)
        .maybeSingle();
      if (phoneError) return { data: null, error: phoneError };
      if (existingByPhone) {
        await supabase.from("appointments").update({ client_id: existingByPhone.id }).eq("id", appointmentId).eq("barbershop_id", barbershopId);
        return { data: existingByPhone as Client, alreadyExists: true, error: null };
      }
    }

    const { data: created, error: createError } = await supabase
      .from("users")
      .insert({
        barbershop_id: barbershopId,
        name_complete: appointment.manual_name.trim(),
        num_phone: appointment.manual_phone?.trim() || "",
        birth_date: appointment.manual_birth_date ?? null,
      })
      .select("id, name_complete, num_phone, email, birth_date, style_notes")
      .single();

    if (createError) return { data: null, error: createError };

    const { error: linkError } = await supabase
      .from("appointments")
      .update({ client_id: created.id })
      .eq("id", appointmentId)
      .eq("barbershop_id", barbershopId);

    if (linkError) return { data: null, error: linkError };
    return { data: created as Client, alreadyExists: false, error: null };
  },
} as const;
