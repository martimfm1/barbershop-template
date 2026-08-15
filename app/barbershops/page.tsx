"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search, SlidersHorizontal, Tag, X } from "lucide-react";
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
    if (activeTag && !availableTags.some((tag) => tag.toLocaleLowerCase() === activeTag.toLocaleLowerCase())) setActiveTag(null);
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
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.11),transparent_36%),rgba(24,24,27,0.72)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300"><Search className="size-3.5 text-emerald-300" />Diretório Silentra</div>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1] tracking-[-0.055em] sm:text-5xl">Encontra a barbearia certa e reserva sem complicações.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Compara localização, disponibilidade, etiquetas e avaliações. A localização é opcional e podes alterar os critérios quando quiseres.</p>
          </div>
          <div className="mt-7 grid gap-3 lg:max-w-4xl">
            <LocationRequest value={userLocation} onChange={setUserLocation} autoRequest />
            <SearchFilterBar query={query} setQuery={setQuery} activeDate={activeDate} setActiveDate={setActiveDate} activeFilter={activeFilter} setActiveFilter={setActiveFilter} view={view} setView={setView} userLocation={userLocation} setUserLocation={setUserLocation} />
          </div>
          {availableTags.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3.5 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"><Tag className="size-3.5" />Categorias e estilos</div>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button type="button" onClick={() => setActiveTag(null)} aria-pressed={activeTag === null} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${activeTag === null ? "border-white/30 bg-white text-zinc-950" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"}`}>Todas</button>
                {availableTags.map((tag) => { const selected = activeTag?.toLocaleLowerCase() === tag.toLocaleLowerCase(); return <button key={tag} type="button" onClick={() => setActiveTag(selected ? null : tag)} aria-pressed={selected} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${selected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"}`}>{tag}</button>; })}
              </div>
              {activeTag && <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500"><span>Filtro ativo: <strong className="text-zinc-300">{activeTag}</strong></span><button type="button" onClick={() => setActiveTag(null)} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"><X className="size-3.5" /> Limpar</button></div>}
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">Resultados</p><p className="mt-1 text-sm text-zinc-400">{isLoading ? "A procurar..." : `${visibleShops.length} ${visibleShops.length === 1 ? "barbearia encontrada" : "barbearias encontradas"}`}</p></div><div className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500"><SlidersHorizontal className="size-4" /></div></div>
            {isLoading ? <div className="flex min-h-64 items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50" aria-live="polite"><div className="flex flex-col items-center gap-3 text-sm text-zinc-500"><Loader2 className="size-6 animate-spin" /><span>A encontrar barbearias...</span></div></div> : visibleShops.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-9 text-center sm:p-12"><p className="text-base font-semibold text-zinc-200">Não encontrámos resultados.</p><p className="mt-2 text-sm leading-6 text-zinc-500">Tenta remover um filtro, procurar outra zona ou ativar a localização.</p></div> : view === "map" ? <div className="h-[620px] overflow-hidden rounded-3xl border border-white/10 lg:hidden"><MapPreview shops={visibleShops} view={view} onSelectShop={handleNavigateToShop} userLocation={userLocation} /></div> : <div className="grid gap-4 sm:grid-cols-2">{visibleShops.map((shop) => <ShopCard key={shop.id} shop={shop} onNavigate={() => handleNavigateToShop(shop)} onOpenBooking={() => setBookingShop(shop)} />)}</div>}
          </div>
          <aside className="hidden lg:block"><div className="sticky top-24 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60"><div className="border-b border-white/8 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><MapPin className="size-4 text-emerald-300" />Explora no mapa</div><p className="mt-1 text-[11px] text-zinc-500">Seleciona uma barbearia para abrir a página completa.</p></div><MapPreview shops={visibleShops} view={view} onSelectShop={handleNavigateToShop} userLocation={userLocation} /></div></aside>
        </section>
      </main>
      <BookingDrawer shop={bookingShop} isOpen={Boolean(bookingShop)} onClose={() => setBookingShop(null)} />
    </div>
  );
}
