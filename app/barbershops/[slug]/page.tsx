import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { UUID_PATTERN } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPublicBarbershopSlug } from "@/lib/barbershops/public";
import { getPublicProfileByRedirect, getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import BarbershopPublicPage from "./public-barbershop-page";

interface BarbershopPageProps {
  params: Promise<{ slug: string }>;
}

const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://barbers.silentra.me").replace(/\/$/, "");

function absoluteUrl(path: string): string {
  return `${PUBLIC_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({ params }: BarbershopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) return {};

  const canonicalPath = `/barbershops/${encodeURIComponent(profile.slug)}`;
  const title = profile.seo_title?.trim() || `${profile.name} — Barbearia${profile.city ? ` em ${profile.city}` : ""} | Agendamento Online`;
  const description = profile.seo_description?.trim() || `Consulta serviços, preços, horário e localização da ${profile.name}. Marca o teu próximo serviço online em poucos segundos.`;
  const image = profile.og_image_url || profile.cover_url || profile.avatar_url || null;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: "Silentra for Barbers",
      ...(image ? { images: [{ url: image, alt: profile.name }] } : {}),
      locale: "pt_PT",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function PublicBusinessJsonLd({
  name,
  url,
  address,
  city,
  phone,
  image,
}: {
  name: string;
  url: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  image: string | null;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Barbershop",
    name,
    url,
    ...(phone ? { telephone: phone } : {}),
    ...(image ? { image: [image] } : {}),
    ...(address || city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(address ? { streetAddress: address } : {}),
            ...(city ? { addressLocality: city } : {}),
            addressCountry: "PT",
          },
        }
      : {}),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

async function redirectUuidToPublicSlug(id: string) {
  const database = createAdminClient();
  const { data: shop, error } = await database
    .from("shops")
    .select("slug, custom_slug, public_profile_enabled")
    .eq("id", id)
    .maybeSingle();

  if (error || !shop || shop.public_profile_enabled === false) notFound();

  const normalizedCustomSlug = typeof shop.custom_slug === "string" ? shop.custom_slug.trim().toLowerCase() : "";
  const targetSlug = normalizedCustomSlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedCustomSlug)
    ? normalizedCustomSlug
    : shop.slug;

  if (!targetSlug) notFound();
  permanentRedirect(`/barbershops/${encodeURIComponent(targetSlug)}`);
}

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const { slug } = await params;

  if (UUID_PATTERN.test(slug)) {
    await redirectUuidToPublicSlug(slug);
  }

  if (!isValidPublicBarbershopSlug(slug)) notFound();

  const profile = await getPublicProfileBySlug(slug);
  if (!profile) {
    const redirectProfile = await getPublicProfileByRedirect(slug);
    if (redirectProfile) permanentRedirect(`/barbershops/${encodeURIComponent(redirectProfile.slug)}`);
    notFound();
  }

  if (slug !== profile.slug) {
    permanentRedirect(`/barbershops/${encodeURIComponent(profile.slug)}`);
  }

  const canonicalUrl = absoluteUrl(`/barbershops/${encodeURIComponent(profile.slug)}`);
  const image = profile.og_image_url || profile.cover_url || profile.avatar_url || null;

  return (
    <>
      <PublicBusinessJsonLd
        name={profile.name}
        url={canonicalUrl}
        address={profile.address}
        city={profile.city}
        phone={profile.phone}
        image={image}
      />
      <BarbershopPublicPage
        slug={profile.slug}
        loyaltyEnabled={profile.plan === "pro" || profile.plan === "enterprise"}
      />
    </>
  );
}
