"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
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
    <div ref={dropdownRef} className="relative inline-flex min-w-0">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={locale === "pt" ? "Idioma: Português" : "Language: English"}
        className="group h-10 min-h-10 min-w-10 gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-zinc-200 shadow-sm transition-[background-color,border-color,transform] hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] sm:px-3"
      >
        <Languages className="size-4 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-200" aria-hidden="true" />
        <span className="hidden text-xs font-semibold tracking-wide min-[520px]:inline">{current.short}</span>
        <span className="text-sm leading-none sm:hidden" aria-hidden="true">{current.flag}</span>
        <span className="sr-only">Mudar idioma</span>
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={NAVBAR_POPUP_TRANSITION}
            role="listbox"
            aria-label={locale === "pt" ? "Selecionar idioma" : "Select language"}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-210 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 text-zinc-100 shadow-2xl shadow-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-zinc-950/80"
          >
            <div className="px-2.5 pb-1.5 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                {locale === "pt" ? "Idioma" : "Language"}
              </p>
            </div>

            <div className="grid gap-1" role="presentation">
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
                      "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm font-medium",
                      "transition-[background-color,border-color,transform,color] active:scale-[0.99]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      selected
                        ? "border-white/15 bg-white/[0.09] text-white"
                        : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="text-base leading-none" aria-hidden="true">{option.flag}</span>
                      <span className="truncate">{option.label}</span>
                      <span className="text-[11px] font-medium tracking-wide text-zinc-500">{option.short}</span>
                    </span>
                    {selected ? <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" /> : null}
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
