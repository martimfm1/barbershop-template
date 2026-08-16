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

export const publicBarbershopService = {
  async getBarbershopData(slug: string) {
    try {
      const cleanSlug = slug.toLowerCase().trim();
      if (!cleanSlug) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      let shop: any = null;
      let shopError: any = null;

      const bySlug = await supabase
        .from("shops")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      shop = bySlug.data;
      shopError = bySlug.error;

      if (!shop && !shopError) {
        const byCustomSlug = await supabase
          .from("shops")
          .select("*")
          .eq("custom_slug", cleanSlug)
          .maybeSingle();
        shop = byCustomSlug.data;
        shopError = byCustomSlug.error;
      }

      if (shopError || !shop) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      let barberShopData: any = null;
      if (shop.barbershop_id) {
        const { data: bData } = await supabase
          .from("barbershops")
          .select("name, address, opening_time, closing_time, phone, is_public_in_directory")
          .eq("id", shop.barbershop_id)
          .maybeSingle();
        barberShopData = bData;
      }

      if (barberShopData?.is_public_in_directory === false) {
        return { data: null, error: { message: "Barbearia não encontrada." } };
      }

      let servicesQuery = supabase
        .from("services")
        .select("id, name, price, duration, popular");

      if (shop.barbershop_id) {
        servicesQuery = servicesQuery.eq("barbershop_id", shop.barbershop_id);
      } else {
        servicesQuery = servicesQuery.eq("barbershop_id", shop.id);
      }

      const { data: servicesRaw } = await servicesQuery;

      const servicesFormatted: ServiceItem[] = ((servicesRaw as RawService[]) ?? []).map((srv) => ({
        ...srv,
        popular: shop.popular_service_id ? srv.id === shop.popular_service_id : Boolean(srv.popular),
      }));

      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, client_name, rating, comment, created_at")
        .eq("barbershop_id", shop.id)
        .order("created_at", { ascending: false });

      const totalReviews = reviews?.length ?? 0;
      const ratingAvg = totalReviews > 0
        ? Number(((reviews ?? []).reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

      const canonicalSlug = String(shop.custom_slug || shop.slug || cleanSlug);
      const formattedShop: BarbershopPublicDetails = {
        ...shop,
        id: shop.id,
        name: shop.name || barberShopData?.name || "Barbearia",
        slug: canonicalSlug,
        city: shop.city || "",
        address: shop.address || barberShopData?.address || "",
        phone: shop.phone || barberShopData?.phone || "",
        popular_service_id: shop.popular_service_id || null,
        opening_time: shop.opening_time || barberShopData?.opening_time || "09:00",
        closing_time: shop.closing_time || barberShopData?.closing_time || "19:00",
        lunch_start: shop.lunch_start || null,
        lunch_end: shop.lunch_end || null,
        off_days: shop.off_days || [],
        rating_avg: ratingAvg,
        total_reviews: totalReviews,
        tags: shop.tags || [],
        services: servicesFormatted,
        reviews: reviews || [],
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