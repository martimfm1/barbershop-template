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
  lunch_start?: string;
  lunch_end?: string;
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

    const { data: shopData } = await supabase.from("shops").select("popular_service_id").eq("barbershop_id", barbershopId).maybeSingle();
    return {
      data: {
        ...barberData,
        phone: barberData.phone ?? undefined,
        address: barberData.address ?? undefined,
        opening_time: barberData.opening_time ?? undefined,
        closing_time: barberData.closing_time ?? undefined,
        lunch_start: barberData.lunch_start ?? undefined,
        lunch_end: barberData.lunch_end ?? undefined,
        closed_days: barberData.closed_days ?? undefined,
        allow_online_bookings: barberData.allow_online_bookings ?? undefined,
        auto_reminders: barberData.auto_reminders ?? undefined,
        is_public_in_directory: barberData.is_public_in_directory ?? undefined,
        popular_service_id: shopData?.popular_service_id || null,
      },
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

    const directoryVisibility = payload.is_public_in_directory;
    const popularServiceId = payload.popular_service_id;
    const barbershopPayload: Record<string, unknown> = { ...payload };
    delete barbershopPayload.popular_service_id;
    delete barbershopPayload.is_public_in_directory;

    if (directoryVisibility !== undefined) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sessão inválida.");

      const { error } = await supabase.rpc("set_barbershop_directory_visibility", {
        p_actor_user_id: user.id,
        p_barbershop_id: barbershopId,
        p_visible: directoryVisibility,
      });
      if (error) {
        if (error.message.includes("DIRECTORY_VISIBILITY_PRO_REQUIRED")) {
          throw new Error("A visibilidade no diretório está disponível no plano Pro.");
        }
        throw error;
      }
    }

    if (Object.keys(barbershopPayload).length > 0) {
      const { error } = await supabase
        .from("barbershops")
        .update(barbershopPayload)
        .eq("id", barbershopId);
      if (error) throw error;
    }

    const shopUpdatePayload: Record<string, unknown> = {};
    if (popularServiceId !== undefined) shopUpdatePayload.popular_service_id = popularServiceId;

    if (Object.keys(shopUpdatePayload).length > 0) {
      const { error } = await supabase
        .from("shops")
        .update(shopUpdatePayload)
        .eq("barbershop_id", barbershopId);
      if (error) throw error;
    }

    return getBarbershopConfig(barbershopId);
  } catch (error: unknown) {
    console.error("[Service Exception - updateBarbershopConfig]:", error);
    return { data: null, error: error instanceof Error ? error : new Error("Erro ao guardar atualizações.") };
  }
}

export const barbershopService = { getConfig: getBarbershopConfig, updateConfig: updateBarbershopConfig } as const;
