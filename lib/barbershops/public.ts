import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { UUID_PATTERN } from '@/lib/validation';

export interface PublicBarbershopRoute {
  id: string;
  slug: string;
}

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidPublicBarbershopSlug(value: string): boolean {
  return (
    value.length > 0 && value.length <= 160 && PUBLIC_SLUG_PATTERN.test(value)
  );
}

export const getBarbershopBySlug = cache(
  async (slug: string): Promise<PublicBarbershopRoute | null> => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!isValidPublicBarbershopSlug(normalizedSlug)) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },
);

export const getBarbershopById = cache(
  async (id: string): Promise<PublicBarbershopRoute | null> => {
    if (!UUID_PATTERN.test(id)) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },
);
