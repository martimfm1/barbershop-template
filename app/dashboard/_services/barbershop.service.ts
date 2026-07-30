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
}

export type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

export async function getBarbershopConfig(
  barbershopId: string,
): Promise<ServiceResponse<BarbershopConfigPayload>> {
  const supabase = createClient();

  try {
    // 1. Configurações gerais na tabela 'barbershops'
    const { data: barberData, error: barberError } = await supabase
      .from("barbershops")
      .select(
        "name, phone, address, opening_time, closing_time, lunch_start, lunch_end, closed_days, allow_online_bookings, auto_reminders",
      )
      .eq("id", barbershopId)
      .single();

    if (barberError || !barberData) {
      throw new Error(barberError?.message || "Configurações não encontradas.");
    }

    const { data: shopData } = await supabase
      .from("shops")
      .select("popular_service_id")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    const popularServiceId = shopData?.popular_service_id || null;

    const formattedData: BarbershopConfigPayload = {
      ...barberData,
      popular_service_id: popularServiceId,
    };

    return { data: formattedData, error: null };
  } catch (error: unknown) {
    console.error(`❌ [Service Exception - getBarbershopConfig]:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Erro desconhecido."),
    };
  }
}

export async function updateBarbershopConfig(
  barbershopId: string,
  payload: Partial<BarbershopConfigPayload>,
): Promise<ServiceResponse<BarbershopConfigPayload>> {
  const supabase = createClient();

  try {
    if (Object.keys(payload).length === 0) {
      throw new Error("Payload vazio.");
    }

    const popularServiceId = payload.popular_service_id;

    const barbershopPayload: Record<string, any> = { ...payload };
    delete barbershopPayload.popular_service_id;

    let updatedBarberData = null;

    // 1. Atualização da tabela 'barbershops'
    if (Object.keys(barbershopPayload).length > 0) {
      const { data, error: barberError } = await supabase
        .from("barbershops")
        .update(barbershopPayload)
        .eq("id", barbershopId)
        .select()
        .single();

      if (barberError) throw barberError;
      updatedBarberData = data;
    }

    // 2. Atualização da tabela 'shops'
    const shopUpdatePayload: Record<string, any> = {};
    if (popularServiceId !== undefined)
      shopUpdatePayload.popular_service_id = popularServiceId;

    let finalPopularServiceId = popularServiceId;

    if (Object.keys(shopUpdatePayload).length > 0) {
      const { data: updatedShop, error: shopError } = await supabase
        .from("shops")
        .update(shopUpdatePayload)
        .eq("barbershop_id", barbershopId)
        .select("popular_service_id")
        .maybeSingle();

      if (shopError) throw shopError;

      if (updatedShop) {
        finalPopularServiceId = updatedShop.popular_service_id;
      }
    }

    const result: BarbershopConfigPayload = {
      ...(updatedBarberData || {}),
      popular_service_id: finalPopularServiceId,
    };

    return { data: result, error: null };
  } catch (error: unknown) {
    console.error(`❌ [Service Exception - updateBarbershopConfig]:`, error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Erro ao guardar atualizações."),
    };
  }
}

export const barbershopService = {
  getConfig: getBarbershopConfig,
  updateConfig: updateBarbershopConfig,
} as const;