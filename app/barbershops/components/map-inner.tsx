"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapInnerProps } from "@/types/marketplace/components";
import type { MarketplaceShop } from "@/types/marketplace/shops";
import { Navigation, Star } from "lucide-react";

const shopIcon = L.divIcon({
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

const userIcon = L.divIcon({
  className: "custom-user-location-pin",
  html: `<div class="relative flex size-8 items-center justify-center"><span class="absolute inset-0 animate-ping rounded-full bg-sky-400/30"></span><span class="relative size-4 rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-sky-500/40"></span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapBoundsController({ shops, userLocation }: Pick<MapInnerProps, "shops" | "userLocation">) {
  const map = useMap();

  useEffect(() => {
    const validShops = shops.filter((shop) => Number.isFinite(shop.lat) && Number.isFinite(shop.lng));
    const points: [number, number][] = validShops.map((shop) => [shop.lat!, shop.lng!]);
    if (userLocation) points.push([userLocation.latitude, userLocation.longitude]);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], userLocation ? 14 : 13, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
  }, [shops, userLocation, map]);

  return null;
}

export default function MapInner({ shops, onSelectShop, userLocation }: MapInnerProps) {
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [38.7223, -9.1393];

  return (
    <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-full w-full rounded-3xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapBoundsController shops={shops} userLocation={userLocation} />

      {userLocation ? (
        <>
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            radius={45}
            pathOptions={{ color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.08, weight: 1 }}
          />
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon} zIndexOffset={1000}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-sky-400" />
                  <span className="font-semibold text-zinc-100">A sua localização</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">Usada para calcular a proximidade das barbearias.</p>
              </div>
            </Popup>
          </Marker>
        </>
      ) : null}

      {shops.map((shop: MarketplaceShop) => {
        if (!Number.isFinite(shop.lat) || !Number.isFinite(shop.lng)) return null;

        return (
          <Marker key={shop.id} position={[shop.lat!, shop.lng!]} icon={shopIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-semibold text-zinc-100">{shop.name}</h5>
                  <div className="flex items-center gap-1 text-xs text-amber-300">
                    <Star className="size-3 fill-amber-300" />
                    <span>{shop.rating}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{shop.city} · {shop.distanceKm > 0 ? `${shop.distanceKm.toFixed(1)} km · ` : ""}{shop.price}</p>
                <button
                  type="button"
                  onClick={() => onSelectShop(shop)}
                  className="mt-3 min-h-11 w-full rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Ver barbearia
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
