"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Map, LayoutGrid, X, MapPin, Star, Loader2, SlidersHorizontal } from "lucide-react";
import type { MarketplaceDateFilter, MarketplaceSortFilter, UserCoordinates } from "@/types/marketplace/filters";
import type { SearchFilterBarProps } from "@/types/marketplace/components";

const DATE_PILLS: MarketplaceDateFilter[] = ["Today", "Tomorrow"];
const FILTER_PILLS: MarketplaceSortFilter[] = ["All", "Near Me", "Top Rated"];

export function MobileSearchFilterBar({
  query,
  setQuery,
  activeDate,
  setActiveDate,
  activeFilter,
  setActiveFilter,
  view,
  setView,
  userLocation,
  setUserLocation,
}: SearchFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState(query);
  const [isLocating, setIsLocating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchTerm.trimStart();
      if (normalized !== query) setQuery(normalized);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm, query, setQuery]);

  const handleClear = useCallback(() => {
    setSearchTerm("");
    setQuery("");
  }, [setQuery]);

  const requestLocation = useCallback(() => {
    if (userLocation) {
      setActiveFilter("Near Me");
      return;
    }
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setActiveFilter("Near Me");
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }, [setActiveFilter, setUserLocation, userLocation]);

  const handleFilterClick = (pill: MarketplaceSortFilter) => {
    if (pill === "Near Me" && !userLocation) {
      requestLocation();
      return;
    }
    setActiveFilter(pill);
  };

  const filterLabel = activeFilter === "Near Me"
    ? userLocation ? "Perto de si" : "Perto de mim"
    : activeFilter === "Top Rated" ? "Melhor avaliadas" : "Todas";

  return (
    <div role="search" aria-label="Pesquisar barbearias" className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 p-2.5 shadow-xl backdrop-blur-md sm:p-3">
      <div className="flex items-stretch gap-2">
        <div className="relative flex min-w-0 flex-1 items-center rounded-xl border border-white/8 bg-black/20 px-3.5 transition focus-within:border-emerald-400/30 focus-within:bg-black/30 focus-within:ring-2 focus-within:ring-emerald-400/10">
          <Search className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Barbearia, rua ou cidade"
            aria-label="Pesquisar por barbearia, rua ou cidade"
            className="ml-2.5 min-w-0 flex-1 bg-transparent py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          {searchTerm ? (
            <button type="button" onClick={handleClear} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label="Limpar pesquisa">
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          aria-expanded={filtersOpen}
          aria-controls="mobile-marketplace-filters"
          className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <SlidersHorizontal className="size-5" />
          <span className="sr-only">Filtros</span>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center rounded-xl bg-white/5 p-1" role="group" aria-label="Vista dos resultados">
          <button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${view === "grid" ? "bg-white text-zinc-950" : "text-zinc-400"}`}>
            <LayoutGrid className="size-3.5" /> Lista
          </button>
          <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${view === "map" ? "bg-white text-zinc-950" : "text-zinc-400"}`}>
            <Map className="size-3.5" /> Mapa
          </button>
        </div>
        <span className="h-5 w-px shrink-0 bg-white/10" />
        <div className="flex shrink-0 items-center rounded-xl bg-white/5 p-1" role="group" aria-label="Disponibilidade">
          {DATE_PILLS.map((pill) => (
            <button key={pill} type="button" onClick={() => setActiveDate(pill)} aria-pressed={activeDate === pill} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${activeDate === pill ? "bg-white/15 text-zinc-50" : "text-zinc-400"}`}>
              {pill === "Today" ? "Hoje" : "Amanhã"}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-xs font-medium text-zinc-500">{filterLabel}</span>
      </div>

      {filtersOpen ? (
        <div id="mobile-marketplace-filters" className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <label className="sr-only" htmlFor="mobile-marketplace-date">Escolher data</label>
          <input
            id="mobile-marketplace-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={/^\d{4}-\d{2}-\d{2}$/.test(activeDate) ? activeDate : ""}
            onChange={(event) => setActiveDate((event.target.value || "Today") as MarketplaceDateFilter)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
          <div className="grid grid-cols-3 gap-2">
            {FILTER_PILLS.map((pill) => (
              <button key={pill} type="button" onClick={() => handleFilterClick(pill)} disabled={pill === "Near Me" && isLocating} aria-pressed={activeFilter === pill} className={`min-h-11 rounded-xl border px-2 text-xs font-semibold ${activeFilter === pill ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  {pill === "Near Me" ? (isLocating ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />) : pill === "Top Rated" ? <Star className="size-3 fill-amber-400 text-amber-400" /> : null}
                  {pill === "All" ? "Todas" : pill === "Near Me" ? "Perto de mim" : "Top"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
