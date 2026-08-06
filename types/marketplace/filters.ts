/** Controls available in the marketplace directory. */
export type MarketplaceDateFilter = "Today" | "Tomorrow" | `${number}-${number}-${number}`;
export type MarketplaceSortFilter = "All" | "Near Me" | "Top Rated";

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface FetchMarketplaceShopsParams {
  query?: string;
  date?: MarketplaceDateFilter;
  filter?: MarketplaceSortFilter;
  userLocation?: UserCoordinates | null;
}
