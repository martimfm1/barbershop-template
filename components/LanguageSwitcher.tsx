"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Languages, Check, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Bloqueia o scroll do body quando o modal de idioma está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSelect = (lang: "pt" | "en") => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <>
      {/* BOTÃO TRIGGER */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 p-0 bg-white/[0.02] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
      >
        <Languages className="size-4" />
        <span className="sr-only">Mudar idioma</span>
      </Button>

      {/* ANIMAÇÃO DO MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            
            {/* BACKDROP (Fundo Escuro Desfocado) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm cursor-pointer"
            />

            {/* CARD DO MODAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-zinc-100 shadow-2xl backdrop-blur-md z-10"
            >
              
              {/* Botão Fechar (X) */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>

              {/* Título e Subtítulo */}
              <div className="mb-6 pr-6">
                <h3 className="font-heading text-lg font-semibold tracking-tight text-white">
                  {locale === "pt" ? "Alterar Idioma" : "Change Language"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {locale === "pt" 
                    ? "Escolha o idioma preferido para a plataforma." 
                    : "Choose your preferred language for the platform."}
                </p>
              </div>

              {/* Opções de Idioma */}
              <div className="grid gap-2">
                
                {/* Opção: Português */}
                <button
                  onClick={() => handleSelect("pt")}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all cursor-pointer ${
                    locale === "pt"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-white"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/5 text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3 text-base">
                    <span className="text-xl">🇵🇹</span> Português
                  </span>
                  {locale === "pt" && (
                    <motion.div layoutId="active-check">
                      <Check className="size-4 text-emerald-400" />
                    </motion.div>
                  )}
                </button>

                {/* Opção: Inglês */}
                <button
                  onClick={() => handleSelect("en")}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all cursor-pointer ${
                    locale === "en"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-white"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/5 text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3 text-base">
                    <span className="text-xl">🇬🇧</span> English
                  </span>
                  {locale === "en" && (
                    <motion.div layoutId="active-check">
                      <Check className="size-4 text-emerald-400" />
                    </motion.div>
                  )}
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}