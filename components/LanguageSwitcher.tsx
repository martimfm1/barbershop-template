"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { NAVBAR_POPUP_TRANSITION } from "./navbar-motion";

type Locale = "pt" | "en";

const OPTIONS: Array<{ value: Locale; label: string; short: string; flag: string }> = [
  { value: "pt", label: "Português", short: "PT", flag: "🇵🇹" },
  { value: "en", label: "English", short: "EN", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale !== locale) setLocale(nextLocale);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={locale === "pt" ? "Idioma atual: Português" : "Idioma atual: English"}
        className={[
          "group inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold tracking-wide",
          "transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
          isOpen
            ? "border-white/20 bg-white/[0.10] text-white"
            : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
        ].join(" ")}
      >
        <Languages className="size-4 text-zinc-400 transition-colors group-hover:text-zinc-200" aria-hidden="true" />
        <span className="hidden sm:inline">Idioma</span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none" aria-hidden="true">{current.flag}</span>
          <span>{current.short}</span>
        </span>
        <ChevronDown className={["size-3.5 text-zinc-500 transition-transform", isOpen ? "rotate-180" : ""].join(" ")} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={NAVBAR_POPUP_TRANSITION}
            role="listbox"
            aria-label={locale === "pt" ? "Selecionar idioma" : "Select language"}
            className="absolute right-0 top-[calc(100%+0.6rem)] z-[230] w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/96 p-1.5 text-zinc-100 shadow-2xl shadow-black/35 backdrop-blur-2xl supports-[backdrop-filter]:bg-zinc-950/84"
          >
            <div className="px-2.5 pb-2 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {locale === "pt" ? "Idioma" : "Language"}
              </p>
            </div>
            <div className="grid gap-1">
              {OPTIONS.map((option) => {
                const selected = option.value === locale;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.value)}
                    className={[
                      "flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-left",
                      "transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:scale-[0.99]",
                      selected
                        ? "border-white/15 bg-white/[0.08] text-white"
                        : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-base leading-none" aria-hidden="true">{option.flag}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{option.label}</span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{option.short}</span>
                      </span>
                    </span>
                    {selected ? <Check className="size-4 shrink-0 text-emerald-300" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
