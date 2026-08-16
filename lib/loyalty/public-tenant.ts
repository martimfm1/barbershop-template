import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPublicProfileSlug } from "@/lib/barbershops/public-profile";

interface LoyaltyTenant {
  barbershopId: string;
}

async function isLoyaltyEnabled(barbershopId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("loyalty_settings")
    .select("enabled")
    .eq("barbershop_id", barbershopId)
    .maybeSingle();

  if (error) throw error;
  return data?.enabled === true;
}

export async function getLoyaltyTenantBySlug(slug: string): Promise<LoyaltyTenant | null> {
  const normalized = slug.trim().toLowerCase();
  if (!isValidPublicProfileSlug(normalized)) return null;

  const admin = createAdminClient();

  const { data: barbershop, error: barbershopError } = await admin
    .from("barbershops")
    .select("id, is_public_in_directory")
    .eq("slug", normalized)
    .maybeSingle();

  if (barbershopError) throw barbershopError;

  if (barbershop?.id && barbershop.is_public_in_directory !== false) {
    return (await isLoyaltyEnabled(barbershop.id))
      ? { barbershopId: barbershop.id }
      : null;
  }

  const { data: shop, error: shopError } = await admin
    .from("shops")
    .select("barbershop_id, public_profile_enabled, custom_slug, slug")
    .or(`custom_slug.eq.${normalized},slug.eq.${normalized}`)
    .maybeSingle();

  if (shopError) {
    if (shopError.code === "42703") return null;
    throw shopError;
  }

  if (!shop?.barbershop_id || shop.public_profile_enabled === false) return null;
  return (await isLoyaltyEnabled(shop.barbershop_id))
    ? { barbershopId: shop.barbershop_id }
    : null;
}
