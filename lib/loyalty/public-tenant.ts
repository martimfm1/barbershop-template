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

  if (error) {
    console.error("[LOYALTY_TENANT_ERROR]", { operation: "settings_lookup", code: error.code ?? "UNKNOWN" });
    return false;
  }

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

  if (barbershopError) {
    console.error("[LOYALTY_TENANT_ERROR]", { operation: "barbershop_slug_lookup", code: barbershopError.code ?? "UNKNOWN" });
    return null;
  }

  if (barbershop?.id && barbershop.is_public_in_directory !== false) {
    return (await isLoyaltyEnabled(barbershop.id)) ? { barbershopId: barbershop.id } : null;
  }

  // Legacy/base public slug. Keep this separate from custom_slug so older
  // production schemas remain functional while the custom-slug migration is rolling out.
  const { data: legacyShop, error: legacyShopError } = await admin
    .from("shops")
    .select("barbershop_id, slug")
    .eq("slug", normalized)
    .maybeSingle();

  if (legacyShopError && legacyShopError.code !== "PGRST116") {
    console.error("[LOYALTY_TENANT_ERROR]", { operation: "shop_slug_lookup", code: legacyShopError.code ?? "UNKNOWN" });
  }

  if (legacyShop?.barbershop_id) {
    return (await isLoyaltyEnabled(legacyShop.barbershop_id))
      ? { barbershopId: legacyShop.barbershop_id }
      : null;
  }

  // custom_slug is optional across existing deployments. A missing column must
  // not make the whole loyalty login flow fail.
  const { data: customShop, error: customShopError } = await admin
    .from("shops")
    .select("barbershop_id, custom_slug")
    .eq("custom_slug", normalized)
    .maybeSingle();

  if (customShopError) {
    if (customShopError.code !== "42703" && customShopError.code !== "PGRST116") {
      console.error("[LOYALTY_TENANT_ERROR]", { operation: "custom_slug_lookup", code: customShopError.code ?? "UNKNOWN" });
    }
    return null;
  }

  if (!customShop?.barbershop_id) return null;
  return (await isLoyaltyEnabled(customShop.barbershop_id))
    ? { barbershopId: customShop.barbershop_id }
    : null;
}
