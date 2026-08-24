'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  publicBarbershopService,
  type BarbershopPublicDetails,
} from './services/public-barbershop.service';
import { formatClosedDays } from '@/lib/utils/format-closed-days';
import type { MarketplaceShop } from '@/types/marketplace/shops';
import {
  ArrowLeft,
  Calendar,
  Coffee,
  Gift,
  MapPin,
  Phone,
  Star,
  Scissors,
} from 'lucide-react';

const BookingDrawer = dynamic(
  () =>
    import('../components/booking-drawer').then(
      (module) => module.BookingDrawer,
    ),
  { ssr: false },
);

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(
  /\/$/,
  '',
);

function formatTime(value?: string | null): string {
  return value ? value.slice(0, 5) : '--:--';
}

function storageUrl(
  bucket: 'avatar' | 'banner',
  value: string | null | undefined,
  entityId: string | null | undefined,
) {
  if (!SUPABASE_URL) return null;
  if (value) {
    if (/^https?:\/\//.test(value)) return value;
    const clean = value.replace(/^\//, '');
    if (clean.startsWith(`${bucket}/`))
      return `${SUPABASE_URL}/storage/v1/object/public/${clean}`;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
  }
  return entityId
    ? `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${entityId}/${bucket}.webp`
    : null;
}

interface Props {
  slug: string;
  loyaltyEnabled?: boolean;
  initialData: BarbershopPublicDetails;
}

export default function BarbershopPublicPage({
  initialData,
  loyaltyEnabled = false,
}: Props) {
  const [shop, setShop] = useState(initialData);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState('');
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const targetId = shop.barbershop_id || shop.id;
  const avatarUrl = storageUrl('avatar', shop.avatar_url, targetId);
  const bannerUrl = storageUrl('banner', shop.cover_url, targetId);
  const reviewsCount = shop.reviews.length;
  const rating =
    reviewsCount > 0
      ? shop.reviews.reduce((sum, item) => sum + Number(item.rating), 0) /
        reviewsCount
      : Number(shop.rating ?? 0);

  const shopForBooking = useMemo<MarketplaceShop>(
    () => ({
      id: shop.id,
      barbershop_id: targetId,
      name: shop.name,
      slug: shop.slug,
      city: shop.city || '',
      address: shop.address || '',
      price: String(shop.price ?? 0),
      rating,
      reviewsCount,
      opening_time: shop.opening_time || '',
      closing_time: shop.closing_time || '',
      hours: `${formatTime(shop.opening_time)} - ${formatTime(shop.closing_time)}`,
      distanceKm: 0,
      reviews: String(reviewsCount),
      nextSlot: '',
      tags: shop.tags || [],
    }),
    [shop, targetId, rating, reviewsCount],
  );

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setReviewError('');
    setReviewSent(false);
    if (!reviewName.trim() || reviewRating < 1) {
      setReviewError(
        'Indica o teu nome e uma classificação de 1 a 5 estrelas.',
      );
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
      setReviewError(
        result.error?.message || 'Não foi possível enviar a avaliação.',
      );
      return;
    }

    setShop((current) => ({
      ...current,
      reviews: [result.data!, ...current.reviews],
    }));
    setReviewName('');
    setReviewText('');
    setReviewRating(0);
    setReviewSent(true);
  }

  return (
    <main className="silentra-page-shell pb-24 text-foreground">
      <div className="silentra-page-grid" aria-hidden="true" />

      <section className="relative h-60 overflow-hidden border-b border-white/[0.08] sm:h-80">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`Imagem da ${shop.name}`}
            fill
            quality={65}
            priority
            sizes="100vw"
            className="object-cover opacity-45 transition-transform duration-700 hover:scale-[1.015]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.14),transparent_30%),linear-gradient(135deg,#18181b,#09090b)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-70" />
        <Link
          href="/barbershops"
          className="absolute left-4 top-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/65 px-3.5 text-xs font-medium text-zinc-200 shadow-xl backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-zinc-950/80 sm:left-6 sm:top-6 sm:text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </section>

      <div className="silentra-page-content !pt-0">
        <section className="relative -mt-16 sm:-mt-24">
          <div className="silentra-surface-raised rounded-3xl p-4 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-900 shadow-2xl sm:size-32">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={shop.name}
                      fill
                      quality={70}
                      sizes="(max-width: 639px) 96px, 128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Scissors
                        className="size-9 text-zinc-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-heading text-2xl font-semibold tracking-[-0.035em] text-zinc-50 sm:text-3xl">
                      {shop.name}
                    </h1>
                    {shop.city && (
                      <span className="silentra-pill border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                        {shop.city}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Star
                        className="size-4 text-amber-300"
                        aria-hidden="true"
                      />{' '}
                      {rating.toFixed(1)} ({reviewsCount})
                    </span>
                    {shop.address && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4" aria-hidden="true" />{' '}
                        {shop.address}
                      </span>
                    )}
                    {shop.phone && (
                      <a
                        href={`tel:${shop.phone}`}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-100"
                      >
                        <Phone className="size-4" aria-hidden="true" />{' '}
                        {shop.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceId(null);
                  setBookingOpen(true);
                }}
                className="silentra-action-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 transition-all hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Calendar className="size-4" aria-hidden="true" />
                Agendar horário
              </button>
            </div>
          </div>
        </section>

        <section
          className="mt-4 grid gap-3 sm:grid-cols-3"
          aria-label="Informações da barbearia"
        >
          <div className="silentra-section-block rounded-2xl p-4 transition-colors duration-200 hover:border-white/[0.14]">
            <div className="flex items-center gap-3">
              <Calendar
                className="size-5 text-emerald-300"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-zinc-500">Horário</p>
                <p className="text-sm font-semibold text-zinc-100">
                  {formatTime(shop.opening_time)} -{' '}
                  {formatTime(shop.closing_time)}
                </p>
              </div>
            </div>
          </div>
          {shop.lunch_start && shop.lunch_end && (
            <div className="silentra-section-block rounded-2xl p-4 transition-colors duration-200 hover:border-white/[0.14]">
              <div className="flex items-center gap-3">
                <Coffee className="size-5 text-zinc-300" aria-hidden="true" />
                <div>
                  <p className="text-xs text-zinc-500">Pausa</p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatTime(shop.lunch_start)} -{' '}
                    {formatTime(shop.lunch_end)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="silentra-section-block rounded-2xl p-4 transition-colors duration-200 hover:border-white/[0.14]">
            <p className="text-xs text-zinc-500">Dias de fecho</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {formatClosedDays(shop.closed_days) || 'Nenhum'}
            </p>
          </div>
        </section>

        <section
          className="silentra-section-block mt-4 rounded-3xl p-5 sm:p-6"
          aria-labelledby="services-heading"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="silentra-eyebrow">Serviços</p>
              <h2
                id="services-heading"
                className="silentra-page-title !text-2xl sm:!text-3xl"
              >
                Escolhe o que queres marcar
              </h2>
              <p className="silentra-page-description !mt-2 !text-sm">
                Vê duração e preço e agenda diretamente o serviço que procuras.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {shop.services.map((service) => (
              <article
                key={service.id}
                className="interactive-card rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tight text-zinc-100">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {service.duration} min
                    </p>
                  </div>
                  <span className="text-base font-semibold text-zinc-50">
                    €{Number(service.price).toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setBookingOpen(true);
                  }}
                  className="silentra-action-secondary mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-100 transition-all hover:border-emerald-400/25 hover:bg-emerald-400/[0.07]"
                >
                  Agendar este serviço
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          className="silentra-section-block mt-4 rounded-3xl p-5 sm:p-6"
          aria-labelledby="reviews-heading"
        >
          <p className="silentra-eyebrow">Confiança</p>
          <h2
            id="reviews-heading"
            className="silentra-page-title !text-2xl sm:!text-3xl"
          >
            Avaliações
          </h2>
          <form
            onSubmit={submitReview}
            className="mt-5 grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 sm:grid-cols-2 sm:p-5"
          >
            <input
              aria-label="O teu nome"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              placeholder="O teu nome"
              className="silentra-control w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400/45 focus:ring-4 focus:ring-emerald-400/[0.08]"
            />
            <div
              className="flex min-h-11 items-center gap-1"
              aria-label="Classificação"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value} estrelas`}
                  className="flex size-10 items-center justify-center rounded-lg transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                >
                  <Star
                    className={`size-5 ${value <= reviewRating ? 'fill-amber-300 text-amber-300' : 'text-zinc-600'}`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <textarea
              aria-label="Avaliação"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Escreve uma avaliação (opcional)"
              className="silentra-control min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400/45 focus:ring-4 focus:ring-emerald-400/[0.08] sm:col-span-2"
            />
            {reviewError && (
              <p className="text-xs text-red-300 sm:col-span-2" role="alert">
                {reviewError}
              </p>
            )}
            {reviewSent && (
              <p
                className="text-xs text-emerald-300 sm:col-span-2"
                role="status"
              >
                Avaliação enviada.
              </p>
            )}
            <button
              disabled={reviewLoading}
              className="silentra-action-primary inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 transition-all hover:-translate-y-px hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:w-fit"
            >
              {reviewLoading ? 'A enviar...' : 'Enviar avaliação'}
            </button>
          </form>
          <div className="mt-5 grid gap-3">
            {shop.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.014] p-4 transition-colors hover:border-white/[0.12]"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-zinc-100">
                    {review.client_name}
                  </strong>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Star
                      className="size-3.5 fill-amber-300 text-amber-300"
                      aria-hidden="true"
                    />
                    {review.rating}/5
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {review.comment}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {loyaltyEnabled && (
          <section className="mt-4 overflow-hidden rounded-3xl border border-emerald-400/15 bg-[radial-gradient(circle_at_75%_0%,rgba(16,185,129,0.09),transparent_22rem),rgba(16,185,129,0.03)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300">
                  <Gift className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="silentra-eyebrow !mb-1">Fidelização</p>
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Volta. Acumula. Ganha.
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
                    Ganha pontos nas tuas visitas e troca-os por recompensas.
                  </p>
                </div>
              </div>
              <Link
                href={`/barbershops/${encodeURIComponent(shop.slug)}/loyalty`}
                className="silentra-action-primary inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-300 px-4 text-xs font-bold text-zinc-950 transition-all hover:-translate-y-px hover:bg-emerald-200"
              >
                Ver fidelização
              </Link>
            </div>
          </section>
        )}
      </div>

      <BookingDrawer
        shop={shopForBooking}
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setSelectedServiceId(null);
        }}
        selectedServiceId={selectedServiceId}
      />
    </main>
  );
}
