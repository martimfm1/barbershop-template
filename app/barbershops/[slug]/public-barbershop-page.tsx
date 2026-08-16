"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { publicBarbershopService, type BarbershopPublicDetails } from "./services/public-barbershop.service";
import { BookingDrawer } from "../components/booking-drawer";
import { formatClosedDays } from "@/lib/utils/format-closed-days";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { ArrowLeft, Calendar, Coffee, Gift, MapPin, Phone, Star, Scissors } from "lucide-react";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");

function formatTime(value?: string | null): string {
  return value ? value.slice(0, 5) : "--:--";
}

function storageUrl(bucket: "avatar" | "banner", value: string | null | undefined, entityId: string | null | undefined) {
  if (!SUPABASE_URL) return null;
  if (value) {
    if (/^https?:\/\//.test(value)) return value;
    const clean = value.replace(/^\//, "");
    if (clean.startsWith(`${bucket}/`)) return `${SUPABASE_URL}/storage/v1/object/public/${clean}`;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
  }
  return entityId ? `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${entityId}/${bucket}.webp` : null;
}

interface Props {
  slug: string;
  loyaltyEnabled?: boolean;
  initialData: BarbershopPublicDetails;
}

export default function BarbershopPublicPage({ initialData, loyaltyEnabled = false }: Props) {
  const [shop, setShop] = useState(initialData);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const targetId = shop.barbershop_id || shop.id;
  const avatarUrl = storageUrl("avatar", shop.avatar_url, targetId);
  const bannerUrl = storageUrl("banner", shop.cover_url, targetId);
  const reviewsCount = shop.reviews.length;
  const rating = reviewsCount > 0
    ? shop.reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviewsCount
    : Number(shop.rating ?? 0);

  const shopForBooking = useMemo<MarketplaceShop>(() => ({
    id: shop.id,
    barbershop_id: targetId,
    name: shop.name,
    slug: shop.slug,
    city: shop.city || "",
    address: shop.address || "",
    price: String(shop.price ?? 0),
    rating,
    reviewsCount,
    opening_time: shop.opening_time || "",
    closing_time: shop.closing_time || "",
    hours: `${formatTime(shop.opening_time)} - ${formatTime(shop.closing_time)}`,
    distanceKm: 0,
    reviews: String(reviewsCount),
    nextSlot: "",
    tags: shop.tags || [],
  }), [shop, targetId, rating, reviewsCount]);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setReviewError("");
    setReviewSent(false);
    if (!reviewName.trim() || reviewRating < 1) {
      setReviewError("Indica o teu nome e uma classificação de 1 a 5 estrelas.");
      return;
    }

    setReviewLoading(true);
    const result = await publicBarbershopService.submitReview({
      barbershop_id: shop.id,
      client_name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewText.trim(),
    });
    setReviewLoading(false);

    if (result.error || !result.data) {
      setReviewError(result.error?.message || "Não foi possível enviar a avaliação.");
      return;
    }

    setShop((current) => ({ ...current, reviews: [result.data!, ...current.reviews] }));
    setReviewName("");
    setReviewText("");
    setReviewRating(0);
    setReviewSent(true);
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-24 text-zinc-100">
      <section className="relative h-52 border-b border-zinc-800 bg-zinc-900 sm:h-72">
        {bannerUrl ? <Image src={bannerUrl} alt={`Imagem da ${shop.name}`} fill unoptimized priority className="object-cover opacity-50" /> : <div className="h-full w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <Link href="/barbershops" className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs font-medium backdrop-blur sm:text-sm">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="relative -mt-14 sm:-mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-900 shadow-2xl sm:size-32">
                {avatarUrl ? <Image src={avatarUrl} alt={shop.name} fill unoptimized className="object-cover" /> : <div className="grid h-full place-items-center"><Scissors className="size-9 text-zinc-500" /></div>}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold sm:text-3xl">{shop.name}</h1>
                  {shop.city && <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{shop.city}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400 sm:text-sm">
                  <span className="inline-flex items-center gap-1"><Star className="size-4" /> {rating.toFixed(1)} ({reviewsCount})</span>
                  {shop.address && <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {shop.address}</span>}
                  {shop.phone && <span className="inline-flex items-center gap-1"><Phone className="size-4" /> {shop.phone}</span>}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => { setSelectedServiceId(null); setBookingOpen(true); }} className="min-h-11 rounded-xl bg-white px-5 text-sm font-bold text-zinc-950">Agendar horário</button>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><div className="flex items-center gap-3"><Calendar className="size-5 text-zinc-400" /><div><p className="text-xs text-zinc-500">Horário</p><p className="text-sm font-semibold">{formatTime(shop.opening_time)} - {formatTime(shop.closing_time)}</p></div></div></div>
          {shop.lunch_start && shop.lunch_end && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><div className="flex items-center gap-3"><Coffee className="size-5 text-zinc-400" /><div><p className="text-xs text-zinc-500">Pausa</p><p className="text-sm font-semibold">{formatTime(shop.lunch_start)} - {formatTime(shop.lunch_end)}</p></div></div></div>}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="text-xs text-zinc-500">Dias de fecho</p><p className="mt-1 text-sm font-semibold">{formatClosedDays(shop.closed_days) || "Nenhum"}</p></div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <h2 className="text-xl font-bold">Serviços</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shop.services.map((service) => <article key={service.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{service.name}</h3><p className="mt-1 text-xs text-zinc-500">{service.duration} min</p></div><span className="font-bold">€{Number(service.price).toFixed(2)}</span></div><button type="button" onClick={() => { setSelectedServiceId(service.id); setBookingOpen(true); }} className="mt-4 min-h-10 w-full rounded-xl bg-white text-xs font-bold text-zinc-950">Agendar este serviço</button></article>)}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <h2 className="text-xl font-bold">Avaliações</h2>
          <form onSubmit={submitReview} className="mt-4 space-y-3">
            <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="O teu nome" className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm" />
            <div className="flex gap-1">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => setReviewRating(value)} aria-label={`${value} estrelas`}><Star className={`size-5 ${value <= reviewRating ? "fill-white text-white" : "text-zinc-600"}`} /></button>)}</div>
            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Escreve uma avaliação (opcional)" className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm" />
            {reviewError && <p className="text-xs text-red-300">{reviewError}</p>}
            {reviewSent && <p className="text-xs text-emerald-300">Avaliação enviada.</p>}
            <button disabled={reviewLoading} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 disabled:opacity-50">{reviewLoading ? "A enviar..." : "Enviar avaliação"}</button>
          </form>
          <div className="mt-6 space-y-3">{shop.reviews.map((review) => <article key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{review.client_name}</strong><span className="text-xs text-zinc-500">{review.rating}/5</span></div>{review.comment && <p className="mt-2 text-sm leading-6 text-zinc-400">{review.comment}</p>}</article>)}</div>
        </section>

        {loyaltyEnabled && <section className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><Gift className="size-5" /></div><div><h2 className="font-bold">Programa de fidelização</h2><p className="mt-1 text-sm text-zinc-500">Ganha pontos e troca-os por recompensas.</p><Link href={`/barbershops/${encodeURIComponent(shop.slug)}/loyalty`} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-emerald-300 px-4 text-xs font-bold text-zinc-950">Ver fidelização</Link></div></div></section>}
      </div>

      <BookingDrawer shop={shopForBooking} isOpen={bookingOpen} onClose={() => { setBookingOpen(false); setSelectedServiceId(null); }} selectedServiceId={selectedServiceId} />
    </main>
  );
}
