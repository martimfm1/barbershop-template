import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import LoyaltyStore from "./loyalty-store";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";

interface LoyaltyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LoyaltyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile || !profile.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) return {};

  const title = `Fidelização ${profile.name} | Silentra`;
  const description = `Consulta os teus pontos, recompensas e benefícios da ${profile.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/barbershops/${encodeURIComponent(profile.slug)}/loyalty` },
    robots: { index: false, follow: true },
  };
}

export default async function LoyaltyPage({ params }: LoyaltyPageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile || !profile.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <Link href={`/barbershops/${encodeURIComponent(profile.slug)}`} className="text-sm text-zinc-500 transition hover:text-zinc-200">
          ← Voltar à {profile.name}
        </Link>
        <header className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Programa de fidelização</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Fica perto da tua próxima recompensa.</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">Entra com o teu email e um código de confirmação. Sem password e sem criar mais uma conta.</p>
        </header>
        <div className="mt-8">
          <LoyaltyStore slug={profile.slug} shopName={profile.name} />
        </div>
      </div>
    </main>
  );
}
