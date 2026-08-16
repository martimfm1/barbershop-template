import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular?: boolean;
}

export interface ReviewItem {
  id: string;
  client_name: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
}

export interface BarbershopPublicDetails {
  id: string;
  barbershop_id?: string | null;
  name: string;
  slug: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  popular_service_id?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  lunch_start?: string | null;
  lunch_end?: string | null;
  off_days?: number[];
  rating_avg?: number;
  total_reviews?: number;
  tags?: string[];
  price?: number;
  services: ServiceItem[];
  reviews: ReviewItem[];
  rating?: number;
  avatar_url?: string | null;
  cover_url?: string | null;
  closed_days?: string | null;
  public_profile_enabled?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
}

interface PublicProfileApiResponse {
  data: BarbershopPublicDetails & {
    reviewsCount?: number;
  };
}

export const publicBarbershopService = {
  async getBarbershopData(slug: string) {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      return { data: null, error: new Error("Barbearia não encontrada.") };
    }

    try {
      const response = await fetch(`/api/public/barbershops/${encodeURIComponent(cleanSlug)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return { data: null, error: new Error("Barbearia não encontrada.") };
      }

      const payload = (await response.json()) as PublicProfileApiResponse;
      if (!payload?.data) {
        return { data: null, error: new Error("Barbearia não encontrada.") };
      }

      return { data: payload.data, error: null };
    } catch {
      return { data: null, error: new Error("Não foi possível carregar a barbearia.") };
    }
  },

  async submitReview(payload: {
    barbershop_id: string;
    client_name: string;
    rating: number;
    comment?: string;
  }) {
    const { data, error } = await supabase.rpc("submit_public_review", {
      p_shop_id: payload.barbershop_id,
      p_client_name: payload.client_name,
      p_rating: payload.rating,
      p_comment: payload.comment ?? null,
    });

    if (error) {
      const messageMap: Record<string, string> = {
        REVIEW_SHOP_REQUIRED: "Barbearia inválida.",
        REVIEW_NAME_REQUIRED: "Introduz o teu nome.",
        REVIEW_RATING_INVALID: "Seleciona uma classificação entre 1 e 5 estrelas.",
        REVIEW_SHOP_NOT_AVAILABLE: "Esta barbearia não está disponível para avaliações.",
      };
      return {
        data: null,
        error: new Error(messageMap[error.message] || "Não foi possível enviar a avaliação."),
      };
    }

    const review = Array.isArray(data) ? data[0] : data;
    return { data: (review as ReviewItem | null) ?? null, error: null };
  },
};
