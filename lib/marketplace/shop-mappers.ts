import type {
  MarketplaceShop,
  MarketplaceShopRecord,
  MarketplaceShopResponse,
} from "@/_types/marketplace/shops";

/** Converts a Supabase result into the public marketplace response. */
export function mapRecordToMarketplaceShopResponse(record: MarketplaceShopRecord): MarketplaceShopResponse {
  const relation = Array.isArray(record.barbershops) ? record.barbershops[0] : record.barbershops;

  return {
    id: record.id, barbershopId: record.barbershop_id, name: relation?.name || "Barbearia",
    address: relation?.address || "", city: record.city, price: record.price, tags: record.tags || [],
    lat: record.lat, lng: record.lng, distanceKm: 2.5,
    openTime: relation?.opening_time?.substring(0, 5) || "09:00",
    closeTime: relation?.closing_time?.substring(0, 5) || "19:00",
    slug: relation?.slug || null, nextSlot: "15:00",
  };
}

/** Formats an API response for marketplace cards and the map. */
export function mapMarketplaceShopResponseToMarketplaceShop(shop: MarketplaceShopResponse): MarketplaceShop {
  return {
    id: shop.id, name: shop.name, address: shop.address, city: shop.city,
    distanceKm: shop.distanceKm, hours: `${shop.openTime} - ${shop.closeTime}`,
    price: `€${shop.price.toFixed(2)}`, rating: 5, reviews: "(12)",
    nextSlot: shop.nextSlot ? `${shop.nextSlot} Hoje` : "Sem vagas", tags: shop.tags,
    lat: shop.lat, lng: shop.lng, accent: "amber",
  };
}
