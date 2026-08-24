import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const getScheduleBlocksByShop = async (shopId: string) => {
  return await supabase
    .from('schedule_blocks')
    .select(
      `
      *,
      professionals (
        name
      )
    `,
    )
    .eq('barbershop_id', shopId)
    .order('start_time', { ascending: true });
};

export const createScheduleBlock = async (payload: {
  professional_id: string | null;
  barbershop_id: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason?: string;
}) => {
  return await supabase
    .from('schedule_blocks')
    .insert([
      {
        professional_id: payload.professional_id ?? null,
        barbershop_id: payload.barbershop_id,
        date: payload.date ?? null,
        start_time: payload.start_time ?? null,
        end_time: payload.end_time ?? null,
        reason: payload.reason ?? null,
      },
    ])
    .select();
};

export const deleteScheduleBlock = async (id: string) => {
  return await supabase.from('schedule_blocks').delete().eq('id', id);
};
