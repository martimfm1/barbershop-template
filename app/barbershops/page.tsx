"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";
import { SearchFilterBar } from "./components/search-filter-bar";
import { ShopCard } from "./components/shop-card";
import { BookingDrawer } from "./components/booking-drawer";
import { MapPreview } from "./components/map-preview";
import type { MarketplaceDateFilter, MarketplaceSortFilter, UserCoordinates } from "@/types/marketplace/filters";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { fetchShops } from "@/lib/api";

export default function BarbershopsDirectoryPage() {
  const router = useRouter();
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeDate, setActiveDate] = useState<MarketplaceDateFilter>("Today");
  const [activeFilter, setActiveFilter] = useState<MarketplaceSortFilter>("All");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [bookingShop, setBookingShop] = useState<MarketplaceShop | null>(null);
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);

  useEffect(() => {
    let active = true;
    fetchShops({ query, date: activeDate, filter: activeFilter, userLocation })
      .then((data) => { if (active) setShops(data); })
      .catch((error) => { console.error("Erro ao carregar barbearias:", error); if (active) setShops([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query, activeDate, activeFilter, userLocation]);

  const handleNavigateToShop = (shop: MarketplaceShop) => router.push(`/barbershops/${shop.slug || shop.id}`);

  return <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased"><SiteNavbar /><main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8"><header className="py-6"><h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">Encontre e agende barbeiros</h1><p className="mt-2 text-sm text-zinc-400">Resultados atualizados por disponibilidade, proximidade e avaliações.</p><div className="mt-6"><SearchFilterBar query={query} setQuery={setQuery} activeDate={activeDate} setActiveDate={setActiveDate} activeFilter={activeFilter} setActiveFilter={setActiveFilter} view={view} setView={setView} userLocation={userLocation} setUserLocation={setUserLocation} /></div></header><section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><div>{isLoading ? <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40"><Loader2 className="size-6 animate-spin text-zinc-400" /></div> : shops.length === 0 ? <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-12 text-center text-sm text-zinc-400">Não existem barbearias com disponibilidade para os filtros selecionados.</div> : view === "map" ? <div className="h-[560px] lg:hidden"><MapPreview shops={shops} view={view} onSelectShop={handleNavigateToShop} /></div> : <div className="grid gap-4 sm:grid-cols-2">{shops.map((shop) => <ShopCard key={shop.id} shop={shop} onNavigate={() => handleNavigateToShop(shop)} onOpenBooking={() => setBookingShop(shop)} />)}</div>}</div><div className="hidden lg:block"><MapPreview shops={shops} view={view} onSelectShop={handleNavigateToShop} /></div></section></main><BookingDrawer shop={bookingShop} isOpen={Boolean(bookingShop)} onClose={() => setBookingShop(null)} /></div>;
}
