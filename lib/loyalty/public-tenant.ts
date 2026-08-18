import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug, isValidPublicProfileSlug } from "@/lib/barbershops/public-profile";

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
    console.error("[LOYALTY_TENANT_ERROR]", {
      operation: "settings_lookup",
      code: error.code ?? "UNKNOWN",
    });
    return false;
  }

  return data?.enabled === true;
}

export async function getLoyaltyTenantBySlug(slug: string): Promise<LoyaltyTenant | null> {
  const normalized = slug.trim().toLowerCase();
  if (!isValidPublicProfileSlug(normalized)) return null;

  try {
    const profile = await getPublicProfileBySlug(normalized);
    const barbershopId = profile?.barbershop_id ?? null;

    if (!barbershopId || profile?.public_profile_enabled === false) {
      return null;
    }

    return (await isLoyaltyEnabled(barbershopId))
      ? { barbershopId }
      : null;
  } catch (error) {
    console.error("[LOYALTY_TENANT_ERROR]", {
      operation: "public_profile_resolution",
      code: error instanceof Error ? error.name : "UNKNOWN",
    });
    return null;
  }
}
