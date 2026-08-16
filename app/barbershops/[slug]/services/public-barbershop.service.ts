import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular_service_id?: boolean;
}

export interface ReviewItem {
  id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface BarbershopPublicDetails {
  id: string;
  barbershop_id?: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  phone?: string;
  popular_service_id?: string | null;
  opening_time?: string;
  closing_time?: string;
  lunch_start?: string;
  lunch_end?: string;
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
}

interface RawService {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean | null;
}

interface BarbershopRow {
  id: string;
  name: string;
  slug: string | null;
  phone: string | null;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  closed_days: string | null;
  is_public_in_directory: boolean | null;
}

interface ShopRow {
  id: string;
  barbershop_id: string | null;
  name: string | null;
  slug: string | null;
  custom_slug?: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  opening_time: string | null;
  closing_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  tags: string[] | null;
  popular_service_id: string | null;
  rating: number | null;
  reviews_count: number | null;
  avatar_url: string | null;
  cover_url: string | null;
  off_days?: number[] | null;
}

export const publicBarbershopService = {
  async getBarbershopData(slug: string) {
    try {
      const cleanSlug = slug.toLowerCase().trim();
      if (!cleanSlug) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      const { data: barbershop, error: barbershopError } = await supabase
        .from("barbershops")
        .select("id, name, slug, phone, address, opening_time, closing_time, lunch_start, lunch_end, closed_days, is_public_in_directory")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (barbershopError || !barbershop) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      if (barbershop.is_public_in_directory === false) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      const { data: shop } = await supabase
        .from("shops")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .maybeSingle();

      const shopRow = (shop as ShopRow | null) ?? null;

      const { data: servicesRaw } = await supabase
        .from("services")
        .select("id, name, price, duration, popular")
        .eq("barbershop_id", barbershop.id);

      const servicesFormatted: ServiceItem[] = ((servicesRaw as RawService[]) ?? []).map((srv) => ({
        ...srv,
        popular: shopRow?.popular_service_id ? srv.id === shopRow.popular_service_id : Boolean(srv.popular),
      }));

      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, client_name, rating, comment, created_at")
        .eq("barbershop_id", shopRow?.id ?? barbershop.id)
        .order("created_at", { ascending: false });

      const normalizedReviews = reviews ?? [];
      const totalReviews = normalizedReviews.length;
      const ratingAvg = totalReviews > 0
        ? Number((normalizedReviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews).toFixed(1))
        : Number(shopRow?.rating ?? 0);

      const canonicalSlug = cleanSlug;
      const formattedShop: BarbershopPublicDetails = {
        id: shopRow?.id ?? barbershop.id,
        barbershop_id: barbershop.id,
        name: shopRow?.name?.trim() || barbershop.name,
        slug: canonicalSlug,
        city: shopRow?.city || "",
        address: shopRow?.address || barbershop.address || "",
        phone: shopRow?.phone || barbershop.phone || "",
        popular_service_id: shopRow?.popular_service_id || null,
        opening_time: shopRow?.opening_time || barbershop.opening_time || "09:00",
        closing_time: shopRow?.closing_time || barbershop.closing_time || "19:00",
        lunch_start: shopRow?.lunch_start || barbershop.lunch_start || undefined,
        lunch_end: shopRow?.lunch_end || barbershop.lunch_end || undefined,
        closed_days: barbershop.closed_days || null,
        off_days: shopRow?.off_days || [],
        rating_avg: ratingAvg,
        total_reviews: totalReviews,
        rating: ratingAvg,
        tags: shopRow?.tags || [],
        avatar_url: shopRow?.avatar_url || null,
        cover_url: shopRow?.cover_url || null,
        services: servicesFormatted,
        reviews: normalizedReviews,
      };

      return { data: formattedShop, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado.";
      return { data: null, error: { message } };
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
    return { data: review as ReviewItem | null, error: null };
  },
};