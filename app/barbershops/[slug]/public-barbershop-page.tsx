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

const formatTime = (timeStr?: string): string =>
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
                <p className="text-xs text-zinc-400">Almoço</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                  {formatTime(shop.lunch_start)} - {formatTime(shop.lunch_end)}
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Folga</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                {formattedClosedDays || "Sem folgas fixas"}
              </p>
            </div>
          </div>
        </div>

        {loyaltyEnabled && (
          <section className="mb-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <Gift className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/80">Fidelização</p>
                  <h2 className="mt-1 text-base font-semibold text-white">Acumula pontos e desbloqueia recompensas.</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">Consulta o teu saldo e os benefícios disponíveis nesta barbearia.</p>
                </div>
              </div>
              <Link
                href={`/barbershops/${encodeURIComponent(shop.slug)}/loyalty`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Abrir fidelização
              </Link>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-3 sm:mb-4">
              <Scissors className="w-5 h-5 text-zinc-400" />
              Serviços Disponíveis
            </h2>

            {!shop.services || shop.services.length === 0 ? (
              <p className="text-zinc-500 text-sm italic">Nenhum serviço cadastrado.</p>
            ) : (
              shop.services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                const isPopular =
                  (service as { popular?: boolean }).popular ||
                  Boolean((service as { popular_service_id?: string }).popular_service_id);

                return (
                  <div
                    key={service.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${isSelected ? "bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400/40" : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"}`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-zinc-100 truncate">{service.name}</h3>
                        {isPopular && <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">POPULAR</span>}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">⏱️ {service.duration} min</p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end justify-center">
                      <span className="text-base sm:text-lg font-bold text-zinc-100">{Number(service.price || 0).toFixed(2)}€</span>
                      <button
                        type="button"
                        onClick={() => handleOpenBooking(service.id)}
                        className="mt-1.5 min-h-[36px] min-w-[80px] px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-3 sm:mb-4">
              <Star className="w-5 h-5 text-zinc-400" />
              Avaliações ({totalReviews})
            </h2>

            <form onSubmit={handleSubmitReview} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-zinc-400" />
                Deixe a sua avaliação
              </h3>

              {reviewError && <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{reviewError}</div>}
              {reviewSuccess && <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" />Avaliação enviada com sucesso!</div>}

              <div>
                <label htmlFor="clientName" className="block text-xs font-medium text-zinc-400 mb-1">Seu Nome <span className="text-zinc-400">*</span></label>
                <input id="clientName" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: João Silva" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-zinc-100 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 placeholder:text-zinc-600" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Classificação <span className="text-zinc-400">*</span></label>
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" aria-label={`Classificar com ${star} estrelas`} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="p-1.5 transition-transform hover:scale-110 active:scale-95 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Star className={`w-6 h-6 ${star <= (hoverRating || rating) ? "fill-zinc-100 text-zinc-100" : "text-zinc-700"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-xs font-medium text-zinc-400 mb-1">Comentário (Opcional)</label>
                <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Partilhe a sua experiência..." rows={3} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-zinc-100 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 placeholder:text-zinc-600 resize-none" />
              </div>

              <button type="submit" disabled={isSubmittingReview} className="w-full py-3 sm:py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]">
                {isSubmittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submeter Avaliação
              </button>
            </form>

            {!shop.reviews || shop.reviews.length === 0 ? (
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center"><p className="text-zinc-500 text-sm">Ainda não existem avaliações.</p></div>
            ) : (
              <div className="space-y-3">
                {shop.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-200">{rev.client_name}</p>
                      <div className="flex items-center gap-0.5 text-zinc-100">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-zinc-100 text-zinc-100" : "text-zinc-700"}`} />)}
                      </div>
                    </div>
                    {rev.comment && <p className="text-xs text-zinc-400">{rev.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 z-40 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-200 truncate">{shop.name}</p>
          <div className="flex items-center gap-1 text-xs text-zinc-400"><Star className="w-3 h-3 fill-zinc-100 text-zinc-100" /><span className="font-semibold text-zinc-100">{ratingAvg.toFixed(1)}</span><span>({totalReviews})</span></div>
        </div>
        <button type="button" onClick={() => handleOpenBooking()} className="px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-all shrink-0 min-h-[40px] shadow-sm">Agendar Horário</button>
      </div>

      <BookingDrawer shop={shopForBooking} isOpen={isBookingOpen} onClose={handleCloseBooking} selectedServiceId={selectedServiceId} />
    </main>
  );
}

function BarbershopSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 animate-pulse">
      <div className="h-48 sm:h-64 bg-zinc-900 w-full" />
      <div className="max-w-5xl mx-auto px-4 relative -mt-16 sm:-mt-20 space-y-6">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-zinc-800 border-4 border-zinc-950" />
          <div className="space-y-2 flex-1"><div className="h-6 sm:h-8 bg-zinc-800 rounded w-1/3" /><div className="h-4 bg-zinc-800 rounded w-1/4" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="h-16 bg-zinc-900 rounded-xl" /><div className="h-16 bg-zinc-900 rounded-xl" /><div className="h-16 bg-zinc-900 rounded-xl" /></div>
        <div className="h-64 bg-zinc-900 rounded-2xl" />
      </div>
    </div>
  );
}