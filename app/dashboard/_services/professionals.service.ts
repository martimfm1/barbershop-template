import { createClient } from "@/lib/supabase/client";
import { Professional } from "@/_types";
  
const supabase = createClient();

export interface CreateProfessionalPayload {
  name: string;
  commission_percentage?: number;
  active?: boolean;
  barbershop_id: string;
}

export interface UpdateProfessionalPayload {
  name: string;
  active?: boolean;
  commission_percentage?: number;
}

export const professionalService = {
  async getAll(barbershopId: string) {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("name", { ascending: true });

    return { data: data as Professional[], error };
  },

  async create(payload: CreateProfessionalPayload) {
    const { data, error } = await supabase
      .from("professionals")
      .insert([
        {
          name: payload.name,
          commission_percentage: payload.commission_percentage ?? 50,
          active: payload.active ?? true,
          barbershop_id: payload.barbershop_id,
        },
      ])
      .select()
      .single();

    return { data: data as Professional | null, error };
  },

  async update(id: string, updates: UpdateProfessionalPayload) {
    const { data, error } = await supabase
      .from("professionals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data: data as Professional | null, error };
  },

  async delete(id: string) {
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    return { error };
  },

  async createBlock(payload: {
    barbershop_id: string;
    professional_id: string;
    start_time: string;
    end_time: string;
    reason: string;
  }) {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .insert([
        {
          barbershop_id: payload.barbershop_id,
          professional_id: payload.professional_id,
          start_at: payload.start_time,
          end_at: payload.end_time,
          reason: payload.reason,
        },
      ])
      .select();

    return { data, error };
  },

  async deleteBlock(id: string) {
    const { error } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("id", id);

    return { error };
  }
} as const;