import { createClient } from "@/lib/supabase/client";

export interface BarbershopConfigPayload {
  name: string;
  phone?: string;
  address?: string;
  opening_time?: string;
  closing_time?: string;
  closed_days?: string;
  allow_online_bookings?: boolean;
  auto_reminders?: boolean;
  popular_service_id?: string | null;
  lunch_start?: string | null;
  lunch_end?: string | null;
  is_public_in_directory?: boolean;
}

export type ServiceResponse<T> = { data: T | null; error: Error | null };

export async function getBarbershopConfig(barbershopId: string): Promise<ServiceResponse<BarbershopConfigPayload>> {
  const supabase = createClient();
  try {
    const { data: barberData, error: barberError } = await supabase
      .from("barbershops")
      .select("name, phone, address, opening_time, closing_time, lunch_start, lunch_end, closed_days, allow_online_bookings, auto_reminders, is_public_in_directory")
      .eq("id", barbershopId)
      .single();
    if (barberError || !barberData) throw new Error(barberError?.message || "Configurações não encontradas.");

    const { data: shopData } = await supabase
      .from("shops")
      .select("popular_service_id")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    return {
      data: { ...barberData, popular_service_id: shopData?.popular_service_id || null },
      error: null,
    };
  } catch (error: unknown) {
    console.error("[Service Exception - getBarbershopConfig]:", error);
    return { data: null, error: error instanceof Error ? error : new Error("Erro desconhecido.") };
  }
}

export async function updateBarbershopConfig(
  barbershopId: string,
  payload: Partial<BarbershopConfigPayload>,
): Promise<ServiceResponse<BarbershopConfigPayload>> {
  const supabase = createClient();
  try {
    if (Object.keys(payload).length === 0) throw new Error("Payload vazio.");

    const popularServiceId = payload.popular_service_id;
    const barbershopPayload: Record<string, unknown> = { ...payload };
    delete barbershopPayload.popular_service_id;

    let updatedBarberData: BarbershopConfigPayload | null = null;
    if (Object.keys(barbershopPayload).length > 0) {
      const { data, error } = await supabase
        .from("barbershops")
        .update(barbershopPayload)
        .eq("id", barbershopId)
        .select()
        .single();
      if (error) throw error;
      updatedBarberData = data;
    }

    const shopUpdatePayload: Record<string, unknown> = {};
    if (popularServiceId !== undefined) shopUpdatePayload.popular_service_id = popularServiceId;
    let finalPopularServiceId = popularServiceId;

    if (Object.keys(shopUpdatePayload).length > 0) {
      const { data: updatedShop, error } = await supabase
        .from("shops")
        .update(shopUpdatePayload)
        .eq("barbershop_id", barbershopId)
        .select("popular_service_id")
        .maybeSingle();
      if (error) throw error;
      if (updatedShop) finalPopularServiceId = updatedShop.popular_service_id;
    }

    return {
      data: { ...(updatedBarberData || {}), popular_service_id: finalPopularServiceId },
      error: null,
    };
  } catch (error: unknown) {
    console.error("[Service Exception - updateBarbershopConfig]:", error);
    return { data: null, error: error instanceof Error ? error : new Error("Erro ao guardar atualizações.") };
  }
}

export const barbershopService = {
  getConfig: getBarbershopConfig,
  updateConfig: updateBarbershopConfig,
} as const;