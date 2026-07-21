import type { FetchMarketplaceShopsParams } from "@/_types/marketplace/filters";
import type { MarketplaceShop, MarketplaceShopResponse } from "@/_types/marketplace/shops";
import { mapMarketplaceShopResponseToMarketplaceShop } from "@/lib/marketplace/shop-mappers";

export async function fetchShops({
  query = "",
  date,
  filter,
}: FetchMarketplaceShopsParams): Promise<MarketplaceShop[]> {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (date) params.set("date", date);
  if (filter && filter !== "All") params.set("filter", filter);

  const response = await fetch(`/api/shops?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch shops: ${response.statusText}`);
  }

  const result: { data: MarketplaceShopResponse[] } = await response.json();

  return (result.data || []).map(mapMarketplaceShopResponseToMarketplaceShop);
}
