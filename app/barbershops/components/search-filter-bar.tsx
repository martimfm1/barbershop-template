"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Map, LayoutGrid, X, MapPin, Star, Loader2 } from "lucide-react";
import type { MarketplaceDateFilter, MarketplaceSortFilter } from "@/_types/marketplace/filters";
import type { SearchFilterBarProps } from "@/_types/marketplace/components";

const DATE_PILLS: MarketplaceDateFilter[] = ["Today", "Tomorrow"];
const FILTER_PILLS: MarketplaceSortFilter[] = ["All", "Near Me", "Top Rated"];

export function SearchFilterBar({
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

  // Debounce na pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== query) setQuery(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, query, setQuery]);

  const handleClear = useCallback(() => {
    setSearchTerm("");
    setQuery("");
  }, [setQuery]);

  // Gestão da Geolocalização ao selecionar "Near Me"
  const handleFilterClick = (pill: MarketplaceSortFilter) => {
    setActiveFilter(pill);

    if (pill === "Near Me" && !userLocation) {
      if (!navigator.geolocation) {
        alert("A geolocalização não é suportada pelo teu navegador.");
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setIsLocating(false);
          setActiveFilter("All");
          alert("Não foi possível obter a tua localização. Verifica as permissões.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div
      role="search"
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-3 shadow-xl backdrop-blur-md"
    >
      {/* LINHA SUPERIOR: BARRA DE PESQUISA + VISTA */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-1 items-center rounded-xl bg-white/5 px-3.5 py-2.5 transition-all focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-zinc-400">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou cidade..."
            className="ml-2.5 w-full bg-transparent text-base sm:text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ALTERNADOR DE VISTA */}
        <div className="flex shrink-0 items-center rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg p-2 transition-all ${
              view === "grid" ? "bg-white/15 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-lg p-2 transition-all ${
              view === "map" ? "bg-white/15 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LINHA INFERIOR: PILLS DE DIA E FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* SELEÇÃO DE DIA */}
          <div className="flex shrink-0 items-center rounded-xl bg-white/5 p-1">
            {DATE_PILLS.map((pill) => {
              const isActive = activeDate === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setActiveDate(pill)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive ? "bg-zinc-100 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {pill === "Today" ? "Hoje" : "Amanhã"}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-[1px] bg-white/10 shrink-0" />

          {/* FILTROS PRINCIPAIS */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-white/5 p-1 scrollbar-none">
            {FILTER_PILLS.map((pill) => {
              const isActive = activeFilter === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleFilterClick(pill)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive ? "bg-white/15 font-semibold text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {pill === "Near Me" && (
                    isLocating ? (
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                    ) : (
                      <MapPin className="h-3 w-3 text-emerald-400" />
                    )
                  )}
                  {pill === "Top Rated" && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                  {pill === "All" ? "Todas" : pill === "Near Me" ? "Perto de mim" : "Melhor Avaliadas"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
