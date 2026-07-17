import { createClient } from "@/lib/supabase/client";

export interface BarbershopConfigPayload {
  name: string;
  phone: string;
  address: string;
  opening_time: string;
  closing_time: string;
  closed_days: string;
  allow_online_bookings: boolean;
  auto_reminders: boolean;
}

export type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

const TABLE_NAME = "barbershops";

export async function getBarbershopConfig(
  barbershopId: string,
): Promise<ServiceResponse<BarbershopConfigPayload>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        "name, phone, address, opening_time, closing_time, closed_days, allow_online_bookings, auto_reminders",
      )
      .eq("id", barbershopId)
      .single();

    if (error) {
      throw new Error(
        `[Database Error]: ${error.message} (Code: ${error.code})`,
      );
    }

    if (!data) {
      throw new Error(
        `Configurações não encontradas para o ID: ${barbershopId}`,
      );
    }

    return { data: data as BarbershopConfigPayload, error: null };
  } catch (error: typeof Error | unknown) {
    console.error(`❌ [Service Exception - getBarbershopConfig]:`, error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error in infrastructure."),
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
      throw new Error("Payload cannot be empty.");
    }

    const normalizedPayload = {
      ...payload,
      opening_time: payload.opening_time?.trim() || "09:00",
      closing_time: payload.closing_time?.trim() || "19:00",
    };

    console.log("[Barbershop Update Payload]", normalizedPayload);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(normalizedPayload)
      .eq("id", barbershopId)
      .select();

    if (error) {
      throw new Error(
        `[Database Error]: ${error.message} (Code: ${error.code})`,
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        "As alterações foram rejeitadas pela Base de Dados. Motivo provável: Políticas de RLS (Row-Level Security) ativas ou o ID da barbearia está incorreto."
      );
    }

    return { data: data[0], error: null };
  } catch (error) {
    console.error(`❌ [Service Exception - updateBarbershopConfig]:`, error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Error persisting updates to database."),
    };
  }
}

export const barbershopService = {
  getConfig: getBarbershopConfig,
  updateConfig: updateBarbershopConfig,
} as const;