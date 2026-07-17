"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { pt } from "@/app/locales/pt";
import { en } from "@/app/locales/en";

type Locale = "pt" | "en";
const translations: Record<Locale, unknown> = { pt, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "pt" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  // Função de tradução que resolve caminhos aninhados como 'appointments.finishTitle'
    const t = (path: string, variables?: Record<string, unknown>) => {
      const keys = path.split(".");
      let value: unknown = translations[locale];

      for (const key of keys) {
        if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key)) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return path;
        }
      }

      if (typeof value !== "string") return path;

      let result = value as string;

      // Substitui variáveis dinâmicas no formato {variavel}
      if (variables) {
        Object.entries(variables).forEach(([key, val]) => {
          result = result.replace(`{${key}}`, String(val));
        });
      }

      return result;
    };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage deve ser usado dentro de um LanguageProvider");
  }
  return context;
}
