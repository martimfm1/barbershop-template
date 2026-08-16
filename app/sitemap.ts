import type { MetadataRoute } from "next";
import { supabase, listRecords } from "@/lib/db";

const SITE_URL = "https://barbers.silentra.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/barbershops`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  let dynamicShopRoutes: MetadataRoute.Sitemap = [];

  try {
    const { data: shops, error } = await listRecords<{
      id: string;
      slug?: string;
      public_profile_enabled?: boolean;
      updated_at?: string;
    }>(
      supabase,
      "shops",
      {},
      { select: "id, slug, public_profile_enabled, updated_at" },
    );

    if (!error && shops) {
      const seen = new Set<string>();
      dynamicShopRoutes = shops
        .filter((shop) => Boolean(shop.slug) && shop.public_profile_enabled !== false)
        .map((shop) => {
          const slug = shop.slug as string;
          if (seen.has(slug)) return null;
          seen.add(slug);
          return {
            url: `${SITE_URL}/barbershops/${encodeURIComponent(slug)}`,
            lastModified: shop.updated_at ? new Date(shop.updated_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          };
        })
        .filter((item): item is MetadataRoute.Sitemap[number] => item !== null);
    }
  } catch {
    // Sitemap generation should remain best-effort; private application routes are excluded.
  }

  return [...staticRoutes, ...dynamicShopRoutes];
}
