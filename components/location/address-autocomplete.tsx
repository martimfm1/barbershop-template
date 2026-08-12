"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AddressSuggestion {
  id: string;
  streetWithNumber: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  accuracy?: string | null;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  inputId?: string;
  disabled?: boolean;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Ex.: Rua Garrett, Lisboa",
  inputId,
  disabled,
  className,
  userLocation,
}: AddressAutocompleteProps) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useMemo(() => `${id}-suggestions`, [id]);

  useEffect(() => {
    if (!value.trim() || value.trim().length < 3 || selected || disabled) {
      abortRef.current?.abort();
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: value.trim() });
        if (userLocation) {
          params.set("lat", String(userLocation.latitude));
          params.set("lng", String(userLocation.longitude));
        }

        const response = await fetch(`/api/address/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as { suggestions?: AddressSuggestion[] };
        const next = Array.isArray(data.suggestions) ? data.suggestions : [];
        setSuggestions(next);
        setIsOpen(next.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("[ADDRESS_AUTOCOMPLETE]", error);
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, selected, disabled, userLocation]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    setSelected(true);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(suggestion);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleChange = (next: string) => {
    setSelected(false);
    setIsOpen(true);
    onChange(next);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <Input
          id={id}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${suggestions[activeIndex].id}` : undefined}
          aria-busy={loading}
          autoComplete="street-address"
          disabled={disabled}
          placeholder={placeholder}
          className={cn("min-h-11 pl-10 pr-20 text-base sm:text-sm", className)}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading ? <Loader2 className="size-4 animate-spin text-zinc-500" aria-label="A pesquisar" /> : null}
          {selected ? <CheckCircle2 className="size-4 text-emerald-400" aria-label="Morada confirmada" /> : null}
          {value ? (
            <button
              type="button"
              onClick={() => {
                setSelected(false);
                setSuggestions([]);
                setIsOpen(false);
                onChange("");
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="Limpar morada"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && suggestions.length > 0 ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de morada"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            <Search className="size-3" aria-hidden="true" />
            Moradas encontradas
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              id={`${listboxId}-${suggestion.id}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                "flex min-h-12 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                index === activeIndex ? "bg-white/10" : "hover:bg-white/[0.06]",
              )}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Navigation className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-100">
                  {suggestion.streetWithNumber || suggestion.fullAddress}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500">
                  {suggestion.city}{suggestion.postalCode ? ` · ${suggestion.postalCode}` : ""}
                </span>
              </span>
              {suggestion.accuracy ? (
                <span className="mt-0.5 shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                  {suggestion.accuracy === "rooftop" || suggestion.accuracy === "parcel" ? "Precisa" : "Aproximada"}
                </span>
              ) : null}
            </button>
          ))}
          <p className="px-3 py-2 text-[10px] text-zinc-600">Pesquisa de moradas · © Mapbox</p>
        </div>
      ) : null}
    </div>
  );
}
