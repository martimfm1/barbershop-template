import { MetadataRoute } from "next";
import { supabase, listRecords } from "@/lib/db";

const SITE_URL = "https://barbers.silentra.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/barbershops`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let dynamicShopRoutes: MetadataRoute.Sitemap = [];

  try {
    const { data: shops, error } = await listRecords<{ id: string; updated_at?: string; slug?: string }>(
      supabase,
      "shops",
      {},
      { select: "id, updated_at, slug" },
    );

    if (!error && shops) {
      dynamicShopRoutes = shops
        .filter((shop) => Boolean(shop.slug))
        .map((shop) => ({
          url: `${SITE_URL}/barbershops/${encodeURIComponent(shop.slug as string)}`,
          lastModified: shop.updated_at ? new Date(shop.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Erro ao carregar barbearias para o sitemap:", error);
  }

  return [...staticRoutes, ...dynamicShopRoutes];
}
