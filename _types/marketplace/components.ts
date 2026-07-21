import type { Dispatch, SetStateAction } from "react";
import type { MarketplaceDateFilter, MarketplaceSortFilter, UserCoordinates } from "./filters";
import type { MarketplaceShop } from "./shops";

/** Props shared by marketplace presentation components. */
export interface ShopCardProps {
  shop: MarketplaceShop;
  onSelect: (shop: MarketplaceShop) => void;
}

export interface MapPreviewProps {
  shops: MarketplaceShop[];
  view: "grid" | "map";
  onSelectShop: (shop: MarketplaceShop) => void;
}

export interface MapInnerProps {
  shops: MarketplaceShop[];
  onSelectShop: (shop: MarketplaceShop) => void;
}

export interface SearchFilterBarProps {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  activeDate: MarketplaceDateFilter;
  setActiveDate: Dispatch<SetStateAction<MarketplaceDateFilter>>;
  activeFilter: MarketplaceSortFilter;
  setActiveFilter: Dispatch<SetStateAction<MarketplaceSortFilter>>;
  view: "grid" | "map";
  setView: Dispatch<SetStateAction<"grid" | "map">>;
  userLocation: UserCoordinates | null;
  setUserLocation: Dispatch<SetStateAction<UserCoordinates | null>>;
}
