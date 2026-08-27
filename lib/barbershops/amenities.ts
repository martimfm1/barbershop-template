export type ParkingAvailability = 'free' | 'paid' | 'none';

export type BarbershopAmenities = {
  wifi: boolean;
  parking: ParkingAvailability;
  wheelchair_accessible: boolean;
  accessible_entrance: boolean;
  accessible_toilet: boolean;
  kids_friendly: boolean;
  waiting_area: boolean;
  restroom: boolean;
  air_conditioning: boolean;
  card_payments: boolean;
  walk_ins: boolean;
  coffee: boolean;
  water: boolean;
  pet_friendly: boolean;
  appointment_required: boolean;
};

export const DEFAULT_BARBERSHOP_AMENITIES: BarbershopAmenities = {
  wifi: false,
  parking: 'none',
  wheelchair_accessible: false,
  accessible_entrance: false,
  accessible_toilet: false,
  kids_friendly: false,
  waiting_area: false,
  restroom: false,
  air_conditioning: false,
  card_payments: true,
  walk_ins: false,
  coffee: false,
  water: false,
  pet_friendly: false,
  appointment_required: false,
};

export function normalizeBarbershopAmenities(value: unknown): BarbershopAmenities {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  const parking: ParkingAvailability =
    raw.parking === 'free' || raw.parking === 'paid' || raw.parking === 'none'
      ? raw.parking
      : DEFAULT_BARBERSHOP_AMENITIES.parking;

  return {
    wifi: raw.wifi === true,
    parking,
    wheelchair_accessible: raw.wheelchair_accessible === true,
    accessible_entrance: raw.accessible_entrance === true,
    accessible_toilet: raw.accessible_toilet === true,
    kids_friendly: raw.kids_friendly === true,
    waiting_area: raw.waiting_area === true,
    restroom: raw.restroom === true,
    air_conditioning: raw.air_conditioning === true,
    card_payments: raw.card_payments !== false,
    walk_ins: raw.walk_ins === true,
    coffee: raw.coffee === true,
    water: raw.water === true,
    pet_friendly: raw.pet_friendly === true,
    appointment_required: raw.appointment_required === true,
  };
}
