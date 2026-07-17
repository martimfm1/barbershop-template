import { createClient } from "@/lib/supabase/client";

function getBrowserBarbershopIdFromCookie() {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|; )barbershop_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export interface CreateClientPayload {
  name_complete: string;
  num_phone: string;
  email?: string;
  barbershop_id: string | null;
  role: "client";
}

export interface UpdateClientPayload {
  name_complete: string;
  num_phone: string;
  email?: string;
}

export const clientsService = {
  // 1. Obter configuração da barbearia
  async getBarbershopConfig(shopId: string) {
    const supabase = createClient();
    return await supabase
      .from("barbershops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle();
  },

  // 2. Atualizar configuração da barbearia
  async updateBarbershopConfig(shopId: string, config: Record<string, unknown>) {
    const supabase = createClient();
    return await supabase
      .from("barbershops")
      .update(config)
      .eq("id", shopId);
  },

  // 3. Criar novo cliente
  async createClient(clientData: CreateClientPayload) {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("barbershop_id")
      .eq("id", user.id)
      .maybeSingle();

    const resolvedBarbershopId =
      clientData.barbershop_id ??
      profile?.barbershop_id ??
      getBrowserBarbershopIdFromCookie();

    if (profileError || !resolvedBarbershopId) {
      throw new Error("Não foi possível encontrar o barbershop_id do utilizador autenticado.");
    }

    const payload = {
      ...clientData,
      barbershop_id: resolvedBarbershopId,
    };

    console.log("[Client Service Payload]", payload);

    return await supabase.from("users").insert([payload]).select();
  },

  // 4. Atualizar dados do cliente
  async updateClient(id: string, clientData: UpdateClientPayload) {
    const supabase = createClient();
    return await supabase
      .from("users")
      .update(clientData)
      .eq("id", id);
  },

  // 5. Apagar cliente
  async deleteClient(id: string) {
    const supabase = createClient();
    return await supabase
      .from("users")
      .delete()
      .eq("id", id);
  }
} as const;