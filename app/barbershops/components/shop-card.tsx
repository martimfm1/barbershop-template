"use client";

import React from "react";
import { MapPin, Clock, Star, Calendar } from "lucide-react";
import type { ShopCardProps } from "@/_types/marketplace/components";

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onSelect }) => {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/60">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {shop.name}
          </h3>
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-zinc-800/50 px-2 py-0.5 text-xs font-medium text-zinc-200">
            <Star className="h-3.5 w-3.5 fill-zinc-200 text-zinc-200" />
            <span>5.0</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-400">
          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
          <span>{shop.address || "Localização disponível"}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          <span>09:00 - 19:00</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-500">
            A partir de
          </span>
          <p className="text-base font-bold text-zinc-100">
            €15.00
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(shop)}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-95"
        >
          <Calendar className="h-3.5 w-3.5" />
          Ver Horários
        </button>
      </div>
    </div>
  );
};
