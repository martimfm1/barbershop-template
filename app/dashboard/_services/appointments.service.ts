import { createClient } from "@/lib/supabase/client";
import { deleteRecord, insertRecord, listRecords, updateRecord } from "@/lib/db";
import type { Appointment, Client } from "@/types";

export interface FinalizeBookingPayload { payment_method: string; value_products: number; description_products: string; }
const supabase = createClient();

export const appointmentService = {
  async getAll(barbershopId: string) {
    const { data, error } = await listRecords<Appointment>(supabase, "appointments", { barbershop_id: barbershopId }, { select: "*, users (name_complete, num_phone, style_notes), services (name, price), professionals (name)", orderBy: { column: "date_hour", ascending: false } });
    return { data: (data ?? []) as Appointment[], error };
  },
  async create(payload: { barbershop_id: string; date_hour: string; status: Appointment["status"]; client_id: string | null; service_id: string; professional_id: string; manual_name: string | null; manual_phone: string | null }) {
    const variants = [payload, { barbershop_id: payload.barbershop_id, date: payload.date_hour, status: payload.status, service_id: payload.service_id, barber_id: payload.professional_id, client_name: payload.manual_name ?? "", client_phone: payload.manual_phone ?? "" }] as const;
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
} as const;
