'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { NAVBAR_POPUP_TRANSITION } from './navbar-motion';

type Locale = 'pt' | 'en';

type LanguageOption = {
  value: Locale;
  label: string;
  short: string;
  description: string;
};

const OPTIONS: LanguageOption[] = [
  {
    value: 'pt',
    label: 'Português',
    short: 'PT',
    description: 'Português (Portugal)',
  },
  { value: 'en', label: 'English', short: 'EN', description: 'English' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current =
    OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node))
        setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const syncMobileMenuState = () => {
      setMobileMenuOpen(
        Boolean(document.getElementById('site-navigation-overlay')),
      );
    };

    syncMobileMenuState();

    const observer = new MutationObserver(syncMobileMenuState);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) setIsOpen(false);
  }, [mobileMenuOpen]);

  const selectLocale = (nextLocale: Locale) => {
    if (nextLocale !== locale) setLocale(nextLocale);
    setIsOpen(false);
  };

  const label = locale === 'pt' ? 'Idioma' : 'Language';
  const ariaLabel =
    locale === 'pt' ? `Idioma: ${current.label}` : `Language: ${current.label}`;
  const menuLabel = locale === 'pt' ? 'Selecionar idioma' : 'Select language';

  return (
    <AnimatePresence initial={false}>
      {!mobileMenuOpen ? (
        <motion.div
          key="language-switcher"
          initial={{ opacity: 0, scale: 0.96, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -2 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          ref={dropdownRef}
          className="relative shrink-0"
        >
          <motion.button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            whileTap={{ scale: 0.98 }}
            className="group flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-transparent px-2.5 text-xs font-medium text-zinc-300 transition-[background-color,border-color,color,box-shadow] hover:border-white/15 hover:bg-white/[0.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <Languages
              className="size-3.5 text-zinc-500 transition-colors group-hover:text-zinc-300"
              aria-hidden="true"
            />
            <span className="hidden text-zinc-500 sm:inline">{label}</span>
            <span className="font-semibold tracking-[0.08em] text-zinc-200">
              {current.short}
            </span>
            <ChevronDown
              className={`size-3 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </motion.button>

          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.985 }}
                transition={NAVBAR_POPUP_TRANSITION}
                role="menu"
                aria-label={menuLabel}
                className="absolute right-0 top-[calc(100%+0.55rem)] z-[230] w-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl shadow-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-zinc-950/82"
              >
                <div className="px-2.5 pb-1.5 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {label}
                  </p>
                </div>
                <div className="grid gap-0.5">
                  {OPTIONS.map((option) => {
                    const selected = option.value === locale;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => selectLocale(option.value)}
                        className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                          selected
                            ? 'bg-white/[0.07] text-white'
                            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                        }`}
                      >
                        <span
                          className="flex size-7 items-center justify-center rounded-md border border-white/8 bg-white/[0.025] text-[10px] font-semibold tracking-[0.08em] text-zinc-400"
                          aria-hidden="true"
                        >
                          {option.short}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {option.label}
                          </span>
                          <span className="block truncate text-[10px] text-zinc-600">
                            {option.description}
                          </span>
                        </span>
                        {selected ? (
                          <Check
                            className="size-4 shrink-0 text-zinc-200"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
