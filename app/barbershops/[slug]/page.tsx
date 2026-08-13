import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { UUID_PATTERN } from "@/lib/validation";
import {
  getBarbershopById,
  getBarbershopBySlug,
  isValidPublicBarbershopSlug,
} from "@/lib/barbershops/public";
import BarbershopPublicPage from "./public-barbershop-page";

interface BarbershopPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BarbershopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getBarbershopBySlug(slug);
  if (!shop) return {};

  const canonicalPath = `/barbershops/${encodeURIComponent(shop.slug)}`;
  return {
    alternates: { canonical: canonicalPath },
    openGraph: { url: canonicalPath },
  };
}

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const { slug } = await params;

  if (UUID_PATTERN.test(slug)) {
    const shop = await getBarbershopById(slug);
    if (!shop) notFound();
    permanentRedirect(`/barbershops/${encodeURIComponent(shop.slug)}`);
  }

  if (!isValidPublicBarbershopSlug(slug)) notFound();

  const shop = await getBarbershopBySlug(slug);
  if (!shop) notFound();

  if (slug !== shop.slug) {
    permanentRedirect(`/barbershops/${encodeURIComponent(shop.slug)}`);
  }

  return <BarbershopPublicPage slug={shop.slug} />;
}
