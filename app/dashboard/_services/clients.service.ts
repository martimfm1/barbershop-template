import { createClient } from '@/lib/supabase/client';

function getBrowserBarbershopIdFromCookie() {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|; )barbershop_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export interface CreateClientPayload {
  name_complete: string;
  num_phone: string;
  email?: string;
  birth_date?: string | null;
  barbershop_id: string | null;
  role: 'client';
}

export interface UpdateClientPayload {
  name_complete: string;
  num_phone: string;
  email?: string;
  birth_date?: string | null;
}

export const clientsService = {
  async getBarbershopConfig(shopId: string) {
    const supabase = createClient();
    return await supabase
      .from('barbershops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();
  },

  async updateBarbershopConfig(
    shopId: string,
    config: Record<string, unknown>,
  ) {
    const supabase = createClient();
    return await supabase.from('barbershops').update(config).eq('id', shopId);
  },

  async createClient(clientData: CreateClientPayload) {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Utilizador não autenticado.');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('barbershop_id')
      .eq('id', user.id)
      .maybeSingle();

    const resolvedBarbershopId =
      clientData.barbershop_id ??
      profile?.barbershop_id ??
      getBrowserBarbershopIdFromCookie();
    if (profileError || !resolvedBarbershopId)
      throw new Error(
        'Não foi possível encontrar a barbearia do utilizador autenticado.',
      );

    return await supabase
      .from('users')
      .insert([{ ...clientData, barbershop_id: resolvedBarbershopId }])
      .select();
  },

  async updateClient(id: string, clientData: UpdateClientPayload) {
    const supabase = createClient();
    return await supabase.from('users').update(clientData).eq('id', id);
  },

  async deleteClient(id: string) {
    const supabase = createClient();
    return await supabase.from('users').delete().eq('id', id);
  },
} as const;
