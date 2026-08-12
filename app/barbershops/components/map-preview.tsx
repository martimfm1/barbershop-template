"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Loader2, Navigation } from "lucide-react";
import type { MapPreviewProps } from "@/types/marketplace/components";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-zinc-900/80">
      <Loader2 className="size-6 animate-spin text-zinc-400" />
    </div>
  ),
});

export function MapPreview({ shops, view, onSelectShop, userLocation }: MapPreviewProps) {
  return (
    <motion.aside
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:sticky lg:top-28"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Mapa</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-50">Barbearias próximas</h3>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 backdrop-blur-xl">
          {view === "grid" ? "Sincronizado" : "Mapa ativo"}
        </span>
      </div>

      <div className="relative mt-5 h-[540px] overflow-hidden rounded-3xl border border-white/10">
        <MapInner shops={shops} onSelectShop={onSelectShop} userLocation={userLocation} />

        <div className="pointer-events-none absolute left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md">
          <Navigation className="size-3.5 text-emerald-300" />
          {userLocation ? "A mostrar a sua localização" : "Pode ativar a localização"}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-medium text-zinc-50">Resultados disponíveis</div>
              <div className="mt-0.5 text-xs text-zinc-400">
                {shops.length} {shops.length === 1 ? "barbearia" : "barbearias"} no mapa
              </div>
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-xl">
              {userLocation ? "Ordenação por distância" : "Ativar localização"}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
