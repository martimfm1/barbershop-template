"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  publicBarbershopService,
  BarbershopPublicDetails,
  ReviewItem,
} from "./services/public-barbershop.service";
import { BookingDrawer } from "../components/booking-drawer";
import { formatClosedDays } from "@/lib/utils/format-closed-days";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { createClient } from "@/lib/supabase/client";
import {
  Star,
  MapPin,
  Phone,
  Clock,
  Scissors,
  Calendar,
  AlertCircle,
  Coffee,
  MessageSquarePlus,
  Loader2,
  Check,
  ArrowLeft,
  Gift,
} from "lucide-react";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);

const formatTime = (timeStr?: string | null): string =>
  timeStr ? timeStr.slice(0, 5) : "--:--";

function getStorageUrl(
  bucket: "avatar" | "banner",
  pathOrUrl?: string | null,
  entityId?: string | null,
): string | null {
  if (!SUPABASE_URL) return null;

  if (pathOrUrl) {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      return pathOrUrl;
    }
    const cleanPath = pathOrUrl.replace(/^\//, "");
    if (cleanPath.startsWith(`${bucket}/`)) {
      return `${SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
  }

  if (entityId) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${entityId}/${bucket}.webp`;
  }

  return null;
}

interface BarbershopPublicPageProps {
  slug: string;
  loyaltyEnabled?: boolean;
}

export default function BarbershopPublicPage({ slug, loyaltyEnabled = false }: BarbershopPublicPageProps) {
  const [shop, setShop] = useState<BarbershopPublicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      const { data, error } = await publicBarbershopService.getBarbershopData(slug);

      if (!isMounted) return;

      if (error || !data) {
        setError(error?.message || "Barbearia não encontrada.");
      } else {
        setShop(data);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    setAvatarError(false);
    setBannerError(false);
  }, [shop?.id]);

  const targetId = useMemo(
    () => (shop as { barbershop_id?: string })?.barbershop_id || shop?.id,
    [shop],
  );

  const avatarUrl = useMemo(() => {
    if (!shop) return null;
    const raw =
      shop.avatar_url || (shop as { avatar_path?: string })?.avatar_path;
    return getStorageUrl("avatar", raw, targetId);
  }, [shop, targetId]);

  const bannerUrl = useMemo(() => {
    if (!shop) return null;
    const raw =
      shop.cover_url ||
      (shop as { cover_path?: string })?.cover_path ||
      (shop as { banner_path?: string })?.banner_path ||
      (shop as { banner_url?: string })?.banner_url;
    return getStorageUrl("banner", raw, targetId);
  }, [shop, targetId]);

  const totalReviews = shop?.reviews?.length ?? 0;

  const ratingAvg = useMemo(() => {
    if (!shop) return 0;
    if (totalReviews > 0) {
      return shop.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;
    }
    return (
      (shop as { rating?: number })?.rating ??
      (shop as { rate?: number })?.rate ??
      0
    );
  }, [shop, totalReviews]);

  const shopForBooking = useMemo((): MarketplaceShop | null => {
    if (!shop) return null;
    return {
      id: shop.id,
      barbershop_id: targetId || shop.id,
      name: shop.name,
      slug: shop.slug,
      city: shop.city || "",
      address: shop.address || "",
      price: String(shop.price ?? 0),
      rating: ratingAvg,
      reviewsCount: totalReviews,
      opening_time: shop.opening_time || "",
      closing_time: shop.closing_time || "",
      hours: `${formatTime(shop.opening_time)} - ${formatTime(shop.closing_time)}`,
      distanceKm: 0,
      reviews: String(totalReviews),
      nextSlot: "",
      tags: shop.tags || [],
    };
  }, [shop, targetId, ratingAvg, totalReviews]);

  const formattedClosedDays = useMemo(() => {
    return formatClosedDays(shop?.closed_days);
  }, [shop?.closed_days]);

  const handleOpenBooking = useCallback((serviceId?: string) => {
    setSelectedServiceId(serviceId ?? null);
    setIsBookingOpen(true);
  }, []);

  const handleCloseBooking = useCallback(() => {
    setIsBookingOpen(false);
    setSelectedServiceId(null);
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);

    if (!clientName.trim()) {
      setReviewError("Por favor, insira o seu nome.");
      return;
    }
    if (rating === 0) {
      setReviewError(
        "Por favor, selecione uma classificação de 1 a 5 estrelas.",
      );
      return;
    }
    if (!shop) return;

    setIsSubmittingReview(true);

    const { data, error } = await publicBarbershopService.submitReview({
      barbershop_id: shop.id,
      client_name: clientName,
      rating,
      comment,
    });

    setIsSubmittingReview(false);

    if (error) {
      setReviewError("Erro ao submeter a avaliação. Tente novamente.");
      return;
    }

    if (data) {
      const updatedReviews: ReviewItem[] = [data, ...(shop.reviews || [])];
      const newRatingAvg =
        updatedReviews.reduce((acc, r) => acc + r.rating, 0) /
        updatedReviews.length;
      const newReviewsCount = updatedReviews.length;

      try {
        const supabase = createClient();
        await supabase
          .from("shops")
          .update({
            rating: newRatingAvg,
            reviews_count: newReviewsCount,
          })
          .eq("id", shop.id);
      } catch (err) {
        console.error("Erro ao atualizar estatísticas em shops:", err);
      }

      setShop({
        ...shop,
        rating: newRatingAvg,
        reviews: updatedReviews,
      });

      setClientName("");
      setRating(0);
      setComment("");
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    }
  };

  if (loading) return <BarbershopSkeleton />;

  if (error || !shop || !shopForBooking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-zinc-500 mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2 text-zinc-100">
          Barbearia não encontrada
        </h1>
        <p className="text-zinc-400 text-sm max-w-md text-center mb-6">
          {error || "Não foi possível carregar as informações desta barbearia."}
        </p>
        <Link
          href="/barbershops"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Barbearias
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 sm:pb-20">
      <div className="relative h-48 sm:h-64 md:h-80 w-full bg-zinc-900 border-b border-zinc-800/80">
        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/barbershops"
            aria-label="Voltar para a lista de barbearias"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950/70 hover:bg-zinc-900 text-zinc-200 text-xs sm:text-sm font-medium border border-zinc-800/80 backdrop-blur-md transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span>Voltar</span>
          </Link>
        </div>

        {bannerUrl && !bannerError ? (
          <Image
            src={bannerUrl}
            alt={`Banner ${shop.name}`}
            fill
            unoptimized
            onError={() => setBannerError(true)}
            className="object-cover opacity-50"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-5 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5 w-full sm:w-auto">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-zinc-950 bg-zinc-900 shadow-2xl shrink-0">
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={shop.name}
                  fill
                  unoptimized
                  onError={() => setAvatarError(true)}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
                  <Scissors className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-100">
                  {shop.name}
                </h1>
                {shop.city && (
                  <span className="text-[11px] sm:text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {shop.city}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-400 mt-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Star
                    className={`w-4 h-4 ${ratingAvg > 0 ? "fill-zinc-100 text-zinc-100" : "text-zinc-600"}`}
                  />
                  <span className={ratingAvg > 0 ? "text-zinc-100" : "text-zinc-400"}>
                    {ratingAvg.toFixed(1)}
                  </span>
                  <span className="text-zinc-500 text-xs font-normal">
                    ({totalReviews})
                  </span>
                </div>

                {shop.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="line-clamp-1">{shop.address}</span>
                  </div>
                )}

                {shop.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{shop.phone}</span>
                  </div>
                )}
              </div>

              {shop.tags && shop.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {shop.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenBooking()}
            className="hidden sm:block w-auto px-6 py-3 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-md shrink-0"
          >
            Agendar Horário
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Horário</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                {formatTime(shop.opening_time)} - {formatTime(shop.closing_time)}
              </p>
            </div>
          </div>

          {shop.lunch_start && shop.lunch_end && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
              <Coffee className="w-5 h-5 text-zinc-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-400">Pausa</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                  {formatTime(shop.lunch_start)} - {formatTime(shop.lunch_end)}
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Dias de fecho</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                {formattedClosedDays || "Nenhum"}
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-5 sm:space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100">Serviços</h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">Escolhe o serviço e agenda o teu horário.</p>
              </div>
              <button type="button" onClick={() => handleOpenBooking()} className="hidden sm:inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-100 px-4 text-xs font-bold text-zinc-950 hover:bg-zinc-200">Agendar</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {shop.services.map((service) => (
                <article key={service.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-zinc-100">{service.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500">{service.duration} min</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-zinc-100">€{Number(service.price).toFixed(2)}</span>
                  </div>
                  <button type="button" onClick={() => handleOpenBooking(service.id)} className="mt-4 min-h-10 w-full rounded-xl bg-white text-xs font-bold text-zinc-950 hover:bg-zinc-200">Agendar este serviço</button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100">Avaliações</h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">Partilha a tua experiência com esta barbearia.</p>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="O teu nome" className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escreve uma avaliação (opcional)" className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
              <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onMouseEnter={() => setHoverRating(value)} onClick={() => setRating(value)} aria-label={`Classificar com ${value} estrelas`} className="p-1 text-zinc-500">
                    <Star className={`size-5 ${value <= (hoverRating || rating) ? "fill-zinc-100 text-zinc-100" : ""}`} />
                  </button>
                ))}
              </div>
              {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs text-emerald-400">Avaliação enviada.</p>}
              <button type="submit" disabled={isSubmittingReview} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 disabled:opacity-50">{isSubmittingReview ? "A enviar..." : "Enviar avaliação"}</button>
            </form>
            <div className="mt-6 space-y-3">
              {shop.reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-zinc-100">{review.client_name}</strong>
                    <span className="text-xs text-zinc-500">{review.rating}/5</span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm leading-6 text-zinc-400">{review.comment}</p>}
                </article>
              ))}
            </div>
          </div>

          {loyaltyEnabled && (
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><Gift className="size-5" /></div>
                <div className="min-w-0 flex-1"><h2 className="text-base font-bold text-zinc-100">Programa de fidelização</h2><p className="mt-1 text-xs sm:text-sm leading-5 text-zinc-500">Ganha pontos nas tuas visitas e troca-os por recompensas.</p><Link href={`/barbershops/${encodeURIComponent(shop.slug)}/loyalty`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-300 px-4 text-xs font-bold text-zinc-950">Ver fidelização</Link></div>
              </div>
            </div>
          )}
        </section>
      </div>
      <BookingDrawer shop={shopForBooking} isOpen={isBookingOpen} onClose={handleCloseBooking} selectedServiceId={selectedServiceId} />
    </main>
  );
}

function BarbershopSkeleton() {
  return <div className="min-h-screen bg-zinc-950 p-4"><div className="mx-auto max-w-5xl animate-pulse space-y-4"><div className="h-48 rounded-2xl bg-zinc-900" /><div className="h-32 rounded-2xl bg-zinc-900" /><div className="h-64 rounded-2xl bg-zinc-900" /></div></div>;
}
