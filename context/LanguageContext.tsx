"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { pt } from "@/app/locales/pt";
import { en } from "@/app/locales/en";

type Locale = "pt" | "en";
const translations = { pt, en } as const;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function resolveTranslation(locale: Locale, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, key)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, translations[locale]);

  return typeof value === "string" ? value : undefined;
}

function interpolate(value: string, variables?: Record<string, unknown>) {
  if (!variables) return value;
  return Object.entries(variables).reduce(
    (result, [key, val]) => result.replaceAll(`{${key}}`, String(val)),
    value,
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = window.localStorage.getItem("locale");
    if (saved === "pt" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
    document.documentElement.dir = "ltr";
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    window.localStorage.setItem("locale", newLocale);
  };

  const t = useMemo(
    () => (path: string, variables?: Record<string, unknown>) => {
      const translated = resolveTranslation(locale, path);
      if (translated === undefined) return path;
      return interpolate(translated, variables);
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage deve ser usado dentro de um LanguageProvider");
  return context;
}
