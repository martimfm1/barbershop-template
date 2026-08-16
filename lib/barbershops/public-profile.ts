import type { BillingPlan } from "@/types/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidPublicProfileSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 60 && PUBLIC_SLUG_PATTERN.test(value);
}

export function planSupportsCustomSlug(plan: BillingPlan): boolean {
  return plan === "pro" || plan === "enterprise";
}

export function planSupportsEnterpriseCustomization(plan: BillingPlan): boolean {
  return plan === "enterprise";
}

export interface PublicProfileRecord {
  id: string;
  slug: string;
  custom_slug: string | null;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  tags: string[];
  barbershop_id: string | null;
  public_profile_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  theme_config: Record<string, unknown>;
  plan: BillingPlan;
  owner_user_id: string | null;
}

async function getShopByColumn(column: "slug" | "custom_slug", value: string) {
  const database = createAdminClient();
  const { data, error } = await database
    .from("shops")
    .select("id, slug, custom_slug, name, city, address, phone, avatar_url, cover_url, tags, barbershop_id, public_profile_enabled, seo_title, seo_description, og_image_url, theme_config")
    .eq(column, value)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function getPlanForShop(barbershopId: string | null): Promise<{ plan: BillingPlan; ownerUserId: string | null }> {
  if (!barbershopId) return { plan: "free", ownerUserId: null };

  const database = createAdminClient();
  const { data: barbershop } = await database
    .from("barbershops")
    .select("id, created_by")
    .eq("id", barbershopId)
    .maybeSingle();

  if (!barbershop?.created_by) return { plan: "free", ownerUserId: null };

  try {
    const plan = await BarbershopStripeService.getEffectivePlan(barbershop.created_by);
    return { plan, ownerUserId: barbershop.created_by };
  } catch {
    return { plan: "free", ownerUserId: barbershop.created_by };
  }
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfileRecord | null> {
  const normalized = slug.trim().toLowerCase();
  if (!isValidPublicProfileSlug(normalized)) return null;

  const customMatch = await getShopByColumn("custom_slug", normalized);
  const shop = customMatch ?? await getShopByColumn("slug", normalized);
  if (!shop || shop.public_profile_enabled === false) return null;

  const { plan, ownerUserId } = await getPlanForShop(shop.barbershop_id ?? null);
  const effectiveSlug = planSupportsCustomSlug(plan) && shop.custom_slug ? shop.custom_slug : shop.slug;

  return {
    ...shop,
    city: shop.city ?? null,
    address: shop.address ?? null,
    phone: shop.phone ?? null,
    avatar_url: shop.avatar_url ?? null,
    cover_url: shop.cover_url ?? null,
    tags: Array.isArray(shop.tags) ? shop.tags : [],
    barbershop_id: shop.barbershop_id ?? null,
    public_profile_enabled: shop.public_profile_enabled !== false,
    seo_title: planSupportsEnterpriseCustomization(plan) ? shop.seo_title ?? null : null,
    seo_description: planSupportsEnterpriseCustomization(plan) ? shop.seo_description ?? null : null,
    og_image_url: planSupportsEnterpriseCustomization(plan) ? shop.og_image_url ?? null : null,
    theme_config: planSupportsEnterpriseCustomization(plan) && shop.theme_config && typeof shop.theme_config === "object"
      ? shop.theme_config as Record<string, unknown>
      : {},
    slug: effectiveSlug,
    plan,
    owner_user_id: ownerUserId,
  };
}

export async function getPublicProfileByRedirect(oldSlug: string): Promise<PublicProfileRecord | null> {
  const normalized = oldSlug.trim().toLowerCase();
  if (!normalized) return null;

  const database = createAdminClient();
  const { data: redirect } = await database
    .from("shop_slug_redirects")
    .select("shop_id")
    .eq("old_slug", normalized)
    .maybeSingle();

  if (!redirect?.shop_id) return null;

  const { data: shop } = await database
    .from("shops")
    .select("slug")
    .eq("id", redirect.shop_id)
    .maybeSingle();

  if (!shop?.slug) return null;
  return getPublicProfileBySlug(shop.slug);
}
