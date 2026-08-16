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
  initialData: BarbershopPublicDetails;
}

export default function BarbershopPublicPage({
  slug,
  loyaltyEnabled = false,
  initialData,
}: BarbershopPublicPageProps) {
  const [shop, setShop] = useState<BarbershopPublicDetails | null>(initialData);
  const [loading, setLoading] = useState(false);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await publicBarbershopService.getBarbershopData(slug);
    if (loadError || !data) {
      setError(loadError?.message || "Barbearia não encontrada.");
    } else {
      setShop(data);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    setShop(initialData);
    setError(null);
    setLoading(false);
    setAvatarError(false);
    setBannerError(false);
  }, [initialData, slug]);

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
    const raw = shop.avatar_url || (shop as { avatar_path?: string })?.avatar_path;
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
