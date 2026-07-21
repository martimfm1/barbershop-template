/** Shapes used from Supabase through to marketplace UI cards. */
export interface MarketplaceBarbershopRelation {
  name: string;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
  slug: string | null;
}

export interface MarketplaceShopRecord {
  id: string;
  barbershop_id: string;
  city: string;
  price: number;
  tags: string[];
  lat: number;
  lng: number;
  is_active: boolean;
  barbershops: MarketplaceBarbershopRelation | MarketplaceBarbershopRelation[] | null;
}

/** API representation before presentation formatting. */
export interface MarketplaceShopResponse {
  id: string;
  barbershopId: string;
  name: string;
  address: string;
  city: string;
  price: number;
  tags: string[];
  lat: number;
  lng: number;
  distanceKm: number;
  openTime: string;
  closeTime: string;
  slug: string | null;
  nextSlot: string;
}

/** Marketplace card and map model. */
export interface MarketplaceShop {
  id: string;
  name: string;
  address?: string;
  city: string;
  distanceKm: number;
  hours: string;
  price: string;
  rating: number;
  reviews: string;
  nextSlot: string;
  tags: string[];
  featured?: boolean;
  accent?: string;
  lat?: number;
  lng?: number;
}

export interface MarketplaceService {
  id: string;
  barbershopId: string;
  name: string;
  price: number;
  durationMinutes: number;
}
