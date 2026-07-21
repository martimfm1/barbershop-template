"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Languages, Check, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { NAVBAR_POPUP_TRANSITION } from "./navbar-motion";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (lang: "pt" | "en") => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-white/2 p-0 text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
      >
        <Languages className="size-4" />
        <span className="sr-only">Mudar idioma</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={NAVBAR_POPUP_TRANSITION}
            role="menu"
            aria-label={locale === "pt" ? "Selecionar idioma" : "Select language"}
            className="absolute right-0 top-full z-210 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-2 text-zinc-100 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4 px-3 py-3">
              <div>
                <h3 className="font-heading text-sm font-semibold tracking-tight text-white">
                  {locale === "pt" ? "Alterar idioma" : "Change language"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  {locale === "pt"
                    ? "Escolhe o idioma da interface."
                    : "Choose the interface language."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label={locale === "pt" ? "Fechar" : "Close"}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-1 grid gap-1.5">
              <button
                type="button"
                onClick={() => handleSelect("pt")}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-medium transition-all ${
                  locale === "pt"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white"
                    : "border-white/5 bg-white/2 text-zinc-300 hover:border-white/15 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇵🇹</span>
                  Português
                </span>
                {locale === "pt" ? (
                  <motion.div layoutId="language-switcher-check">
                    <Check className="size-4 text-emerald-400" />
                  </motion.div>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleSelect("en")}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-medium transition-all ${
                  locale === "en"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white"
                    : "border-white/5 bg-white/2 text-zinc-300 hover:border-white/15 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇬🇧</span>
                  English
                </span>
                {locale === "en" ? (
                  <motion.div layoutId="language-switcher-check">
                    <Check className="size-4 text-emerald-400" />
                  </motion.div>
                ) : null}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}