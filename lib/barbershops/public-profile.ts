import type { BillingPlan } from "@/types/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/validation";

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

type ShopRecord = {
  id: string;
  slug: string;
  custom_slug: string | null;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  tags: string[] | null;
  barbershop_id: string | null;
  public_profile_enabled: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  theme_config: unknown;
};

async function getShopByColumn(column: "id" | "slug" | "custom_slug", value: string): Promise<ShopRecord | null> {
  const database = createAdminClient();
  const { data, error } = await database
    .from("shops")
    .select("id, slug, custom_slug, name, city, address, phone, avatar_url, cover_url, tags, barbershop_id, public_profile_enabled, seo_title, seo_description, og_image_url, theme_config")
    .eq(column, value)
    .maybeSingle();

  if (error) {
    console.error("[PUBLIC_PROFILE_DB_ERROR]", { operation: "shop_lookup", column, code: error.code ?? "UNKNOWN" });
    return null;
  }
  if (!data) {
    console.warn("[PUBLIC_PROFILE_NOT_FOUND]", { operation: "shop_lookup", column });
    return null;
  }
  return data as ShopRecord;
}

async function getPlanForShop(barbershopId: string | null): Promise<{ plan: BillingPlan; ownerUserId: string | null }> {
  if (!barbershopId) {
    console.warn("[PUBLIC_PROFILE_PLAN_FALLBACK]", { reason: "missing_tenant" });
    return { plan: "free", ownerUserId: null };
  }

  const database = createAdminClient();
  const [{ data: barbershop, error: barbershopError }, { data: assignment, error: assignmentError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    database.from("barbershops").select("id, created_by").eq("id", barbershopId).maybeSingle(),
    database.from("barbershop_plan_assignments").select("plan, expires_at").eq("barbershop_id", barbershopId).maybeSingle(),
    database.from("subscriptions").select("plan, plan_override, status").eq("barbershop_id", barbershopId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (barbershopError || assignmentError || subscriptionError) {
    console.error("[PUBLIC_PROFILE_PLAN_LOOKUP_ERROR]", {
      barbershop: barbershopError?.code ?? null,
      assignment: assignmentError?.code ?? null,
      subscription: subscriptionError?.code ?? null,
    });
  }

  const ownerUserId = barbershop?.created_by ?? null;
  if (assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now())) {
    return { plan: assignment.plan as BillingPlan, ownerUserId };
  }

  const subscriptionPlan = subscription?.plan_override && subscription.plan_override !== "free" ? subscription.plan_override : subscription?.plan;
  const paidStatus = ["active", "trialing"].includes(String(subscription?.status ?? ""));
  if (paidStatus && (subscriptionPlan === "pro" || subscriptionPlan === "enterprise")) {
    return { plan: subscriptionPlan as BillingPlan, ownerUserId };
  }
  return { plan: "free", ownerUserId };
}

function buildPublicProfile(shop: ShopRecord, plan: BillingPlan, ownerUserId: string | null): PublicProfileRecord {
  const effectiveSlug = planSupportsCustomSlug(plan) && shop.custom_slug ? shop.custom_slug : shop.slug;
  const themeConfig = planSupportsEnterpriseCustomization(plan) && shop.theme_config && typeof shop.theme_config === "object" && !Array.isArray(shop.theme_config)
    ? shop.theme_config as Record<string, unknown>
    : {};
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
    theme_config: themeConfig,
    slug: effectiveSlug,
    plan,
    owner_user_id: ownerUserId,
  };
}

async function resolvePublicShop(shop: ShopRecord | null): Promise<PublicProfileRecord | null> {
  if (!shop) return null;
  if (shop.public_profile_enabled === false) {
    console.warn("[PUBLIC_PROFILE_DISABLED]", { operation: "profile_resolution" });
    return null;
  }
  const { plan, ownerUserId } = await getPlanForShop(shop.barbershop_id ?? null);
  return buildPublicProfile(shop, plan, ownerUserId);
}

export async function getPublicProfileById(id: string): Promise<PublicProfileRecord | null> {
  const normalized = id.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return resolvePublicShop(await getShopByColumn("id", normalized));
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfileRecord | null> {
  const normalized = slug.trim().toLowerCase();
  if (!isValidPublicProfileSlug(normalized)) return null;
  const customMatch = await getShopByColumn("custom_slug", normalized);
  const shop = customMatch ?? await getShopByColumn("slug", normalized);
  return resolvePublicShop(shop);
}

export async function getPublicProfileByRedirect(oldSlug: string): Promise<PublicProfileRecord | null> {
  const normalized = oldSlug.trim().toLowerCase();
  if (!normalized) return null;
  const database = createAdminClient();
  const { data: redirect, error } = await database.from("shop_slug_redirects").select("shop_id").eq("old_slug", normalized).maybeSingle();
  if (error) {
    console.error("[PUBLIC_PROFILE_REDIRECT_ERROR]", { code: error.code ?? "UNKNOWN" });
    return null;
  }
  if (!redirect?.shop_id) return null;
  return getPublicProfileById(String(redirect.shop_id));
}
