"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapInnerProps } from "@/types/marketplace/components";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { Star } from "lucide-react";

const customIcon = L.divIcon({
  className: "custom-map-pin",
  html: `
    <div class="relative flex size-9 items-center justify-center">
      <div class="absolute -inset-2 rounded-full bg-emerald-400/25 blur-md"></div>
      <div class="relative flex size-9 items-center justify-center rounded-full border border-emerald-300/40 bg-zinc-950/90 text-emerald-300 shadow-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function MapBoundsController({ shops }: { shops: MarketplaceShop[] }) {
  const map = useMap();

  useEffect(() => {
    const validShops = shops.filter((s) => s.lat && s.lng);
    if (validShops.length === 0) return;

    if (validShops.length === 1) {
      map.setView([validShops[0].lat!, validShops[0].lng!], 14);
    } else {
      const bounds = L.latLngBounds(
        validShops.map((s) => [s.lat!, s.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [shops, map]);

  return null;
}

export default function MapInner({ shops, onSelectShop }: MapInnerProps) {
  const defaultCenter: [number, number] = [38.7223, -9.1393];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full rounded-3xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapBoundsController shops={shops} />

      {shops.map((shop) => {
        if (!shop.lat || !shop.lng) return null;

        return (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={customIcon}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-semibold text-zinc-100">{shop.name}</h5>
                  <div className="flex items-center gap-1 text-xs text-amber-300">
                    <Star className="size-3 fill-amber-300" />
                    <span>{shop.rating}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {shop.city} • {shop.price}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectShop(shop)}
                  className="mt-3 w-full rounded-lg bg-zinc-100 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-white"
                >
                  Book Now
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
