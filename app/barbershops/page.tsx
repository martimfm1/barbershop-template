"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tag, X } from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";
import { SearchFilterBar } from "./components/search-filter-bar";
import { ShopCard } from "./components/shop-card";
import { BookingDrawer } from "./components/booking-drawer";
import { MapPreview } from "./components/map-preview";
import { LocationRequest } from "@/components/location/location-request";
import type { MarketplaceDateFilter, MarketplaceSortFilter, UserCoordinates } from "@/types/marketplace/filters";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { fetchShops } from "@/lib/api";

export default function BarbershopsDirectoryPage() {
  const router = useRouter();
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<MarketplaceDateFilter>("Today");
  const [activeFilter, setActiveFilter] = useState<MarketplaceSortFilter>("All");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [bookingShop, setBookingShop] = useState<MarketplaceShop | null>(null);
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchShops({ query, date: activeDate, filter: activeFilter, userLocation })
      .then((data) => { if (active) setShops(data); })
      .catch((error) => { console.error("Erro ao carregar barbearias:", error); if (active) setShops([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query, activeDate, activeFilter, userLocation]);

  const availableTags = useMemo(() => {
    const unique = new Map<string, string>();
    for (const shop of shops) {
      for (const rawTag of shop.tags ?? []) {
        const tag = rawTag.trim();
        if (!tag) continue;
        const key = tag.toLocaleLowerCase();
        if (!unique.has(key)) unique.set(key, tag);
      }
    }
    return [...unique.values()].sort((a, b) => a.localeCompare(b, "pt-PT"));
  }, [shops]);

  useEffect(() => {
    if (activeTag && !availableTags.some((tag) => tag.toLocaleLowerCase() === activeTag.toLocaleLowerCase())) {
      setActiveTag(null);
    }
  }, [activeTag, availableTags]);

  const visibleShops = useMemo(() => {
    if (!activeTag) return shops;
    const normalized = activeTag.toLocaleLowerCase();
    return shops.filter((shop) => (shop.tags ?? []).some((tag) => tag.trim().toLocaleLowerCase() === normalized));
  }, [shops, activeTag]);

  const handleNavigateToShop = (shop: MarketplaceShop) => router.push(`/barbershops/${encodeURIComponent(shop.slug)}`);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
      <SiteNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="py-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">Encontre e agende barbeiros</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Resultados atualizados por disponibilidade, proximidade e avaliações. A localização é opcional e pode ser alterada a qualquer momento.</p>
          <div className="mt-5">
            <LocationRequest value={userLocation} onChange={setUserLocation} autoRequest />
          </div>
          <div className="mt-6">
            <SearchFilterBar query={query} setQuery={setQuery} activeDate={activeDate} setActiveDate={setActiveDate} activeFilter={activeFilter} setActiveFilter={setActiveFilter} view={view} setView={setView} userLocation={userLocation} setUserLocation={setUserLocation} />
          </div>

          {availableTags.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-3.5">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <Tag className="size-3.5" />
                Pesquisar por categoria
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  aria-pressed={activeTag === null}
                  className={`min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition ${activeTag === null ? "border-white/30 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"}`}
                >
                  Todas
                </button>
                {availableTags.map((tag) => {
                  const selected = activeTag?.toLocaleLowerCase() === tag.toLocaleLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(selected ? null : tag)}
                      aria-pressed={selected}
                      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition ${selected ? "border-white/30 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"}`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
              {activeTag && (
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                  <span>Filtro ativo: <strong className="text-zinc-300">#{activeTag}</strong></span>
                  <button type="button" onClick={() => setActiveTag(null)} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200">
                    <X className="size-3.5" /> Limpar
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40" aria-live="polite">
                <Loader2 className="size-6 animate-spin text-zinc-400" aria-label="A carregar" />
              </div>
            ) : visibleShops.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-8 text-center sm:p-12">
                <p className="text-sm font-medium text-zinc-200">Não encontrámos barbearias com estes critérios.</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">Experimente remover um filtro, procurar outra cidade ou ativar a localização.</p>
              </div>
            ) : view === "map" ? (
              <div className="h-[620px] lg:hidden">
                <MapPreview shops={visibleShops} view={view} onSelectShop={handleNavigateToShop} userLocation={userLocation} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleShops.map((shop) => <ShopCard key={shop.id} shop={shop} onNavigate={() => handleNavigateToShop(shop)} onOpenBooking={() => setBookingShop(shop)} />)}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <MapPreview shops={visibleShops} view={view} onSelectShop={handleNavigateToShop} userLocation={userLocation} />
          </div>
        </section>
      </main>
      <BookingDrawer shop={bookingShop} isOpen={Boolean(bookingShop)} onClose={() => setBookingShop(null)} />
    </div>
  );
}
