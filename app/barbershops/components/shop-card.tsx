"use client";

import Image from "next/image";
import React, { useState, useMemo } from "react";
import { MapPin, Clock, Star, Scissors, ArrowRight, Eye } from "lucide-react";
import type { ShopCardProps } from "@/types/marketplace/components";
import type { BarbershopPublicDetails } from "@/app/barbershops/[slug]/services/public-barbershop.service";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);

export type ExtendedBarbershopDetails = BarbershopPublicDetails & {
  barbershop_id?: string;
  avatar_path?: string;
  cover_path?: string;
  banner_path?: string;
  banner_url?: string;
  reviewsCount?: number;
  reviews?: number;
  hours?: string;
};

// ----------------------------------------------------------------------
// HELPER DE STORAGE (Rigorosamente focado no barbershop_id)
// ----------------------------------------------------------------------
function getStorageUrl(
  bucket: "avatar" | "banner",
  pathOrUrl?: string | null,
  barbershopId?: string | null,
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

  if (barbershopId) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${barbershopId}/${bucket}.webp`;
  }

  return null;
}

// ----------------------------------------------------------------------
// FORMATAÇÃO DE PREÇO
// ----------------------------------------------------------------------
const formatDisplayPrice = (rawPrice: unknown): string => {
  if (rawPrice === null || rawPrice === undefined || rawPrice === "")
    return "15.00€";
  if (typeof rawPrice === "number") {
    return isNaN(rawPrice) ? "15.00€" : `${rawPrice.toFixed(2)}€`;
  }
  if (typeof rawPrice === "string") {
    const sanitized = rawPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed)) return `${parsed.toFixed(2)}€`;
  }
  return "15.00€";
};

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
export const ShopCard: React.FC<ShopCardProps> = ({
  shop: rawShop,
  onNavigate,
  onOpenBooking,
}) => {
  const shop = rawShop as unknown as ExtendedBarbershopDetails | undefined;
  const shopAsMarket = rawShop;

  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const barbershopId = shop?.barbershop_id || null;
  const ratingValue = typeof shop?.rating === "number" ? shop.rating : 0;
  const totalReviews = typeof shop?.reviewsCount === "number" ? shop.reviewsCount : Number(shop?.reviews || 0);

  // Resolução calculada do Avatar
  const avatarUrl = useMemo(() => {
    if (!shop) return null;
    const raw = shop.avatar_url || shop.avatar_path;
    return getStorageUrl("avatar", raw, barbershopId);
  }, [shop, barbershopId]);

  // Resolução calculada do Banner
  const bannerUrl = useMemo(() => {
    if (!shop) return null;
    const raw =
      shop.cover_url || shop.cover_path || shop.banner_path || shop.banner_url;
    return getStorageUrl("banner", raw, barbershopId);
  }, [shop, barbershopId]);

  if (!shop) {
    return (
      <div className="h-72 w-full animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4" />
    );
  }

  const hasRating = ratingValue > 0;
  const displayPrice = formatDisplayPrice(shop.price);

  return (
    <div
      onClick={() => onNavigate && onNavigate(shopAsMarket)}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/65 backdrop-blur-3xl backdrop-saturate-150 transition-all duration-300 hover:border-white/30 hover:bg-zinc-950/80 shadow-2xl"
    >
      <div>
        {/* BANNER / CAPA */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-zinc-900 border-b border-white/10">
          {bannerUrl && !bannerError ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${shop.name || ""}`}
              fill
              unoptimized
              onError={() => setBannerError(true)}
              className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>

        {/* CONTEÚDO */}
        <div className="p-4 sm:p-5 pt-0 relative">
          {/* AVATAR & BADGE DE AVALIAÇÃO */}
          <div className="-mt-7 mb-3 flex items-end justify-between gap-2">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-950 bg-zinc-900 text-zinc-300 shadow-2xl">
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={shop.name || "Barbearia"}
                  fill
                  unoptimized
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Scissors className="w-6 h-6 text-zinc-500" />
              )}
            </div>

            {/* AVALIAÇÃO E NÚMERO DE REVIEWS DA TABELA SHOPS */}
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold shadow-sm">
              <Star
                className={`h-3.5 w-3.5 ${
                  hasRating ? "fill-white text-white" : "text-zinc-600"
                }`}
              />
              <span className={hasRating ? "text-white" : "text-zinc-400"}>
                {ratingValue.toFixed(1)}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">
                ({totalReviews})
              </span>
            </div>
          </div>

          {/* DADOS DA BARBEARIA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-zinc-200 transition-colors truncate">
                {shop.name}
              </h3>
            </div>

            {/* ENDEREÇO E HORÁRIO */}
            <div className="space-y-1 text-xs text-zinc-400">
              {(shop.address || shop.city) && (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">
                    {shop.address
                      ? `${shop.address}${shop.city ? `, ${shop.city}` : ""}`
                      : shop.city}
                  </span>
                </div>
              )}

              {shopAsMarket.distanceKm > 0 && (
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{shopAsMarket.distanceKm.toFixed(1)} km de distância</span>
                </div>
              )}

              {shop.hours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{shop.hours}</span>
                </div>
              )}
            </div>

            {/* TAGS */}
            {shop.tags && shop.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {shop.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/10 backdrop-blur-md"
                  >
                    #{tag}
                  </span>
                ))}
                {shop.tags.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.02] text-zinc-500 border border-white/10">
                    +{shop.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ DO CARD */}
      <div className="p-4 sm:p-5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 bg-zinc-950/40 backdrop-blur-md">
        <div>
          <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
            A partir de
          </span>
          <span className="text-base sm:text-lg font-extrabold text-white">
            {displayPrice}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão Ver Detalhes */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) {
                onNavigate(shopAsMarket);
              }
            }}
            className="cursor-pointer px-3 py-2 rounded-xl border border-white/15 bg-white/[0.05] text-zinc-200 font-semibold text-xs hover:bg-white/10 hover:text-white active:scale-95 transition-all shadow-sm flex items-center gap-1.5 min-h-[36px] backdrop-blur-md"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Detalhes</span>
          </button>

          {/* Botão Agendar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBooking) {
                onOpenBooking(shopAsMarket);
              } else if (onNavigate) {
                onNavigate(shopAsMarket);
              }
            }}
            className="cursor-pointer px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all shadow-lg shadow-black/20 flex items-center gap-1.5 min-h-[36px]"
          >
            <span>Agendar</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
