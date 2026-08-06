"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarberIcon } from "./BarberIcon";
import { motion, AnimatePresence } from "motion/react";
import { MenuIcon } from "@/components/MenuIcon";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { NAVBAR_POPUP_TRANSITION, NAVBAR_TRANSITION } from "./navbar-motion";

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const guestLinks = useMemo(
    () => [
      {
        label: t("nav.barbershops", { defaultValue: "Barbershops" }),
        href: "/barbershops",
      },
      {
        label: t("nav.howItWorks", { defaultValue: "How it works" }),
        href: "/#friction",
      },
      {
        label: t("nav.forBarbers", { defaultValue: "For barbers" }),
        href: "/registo",
      },
    ],
    [t],
  );

  const authenticatedLinks = useMemo(
    () => [
      {
        label: t("nav.dashboard", { defaultValue: "Dashboard" }),
        href: "/dashboard",
      },
      {
        label: t("nav.barbershops", { defaultValue: "Barbershops" }),
        href: "/barbershops",
      },
      {
        label: t("nav.settings", { defaultValue: "Settings" }),
        href: "/dashboard/settings",
      },
      {
        label: t("nav.stats", { defaultValue: "Stats" }),
        href: "/dashboard/stats",
      },
      {
        label: t("nav.plans", { defaultValue: "Plans" }),
        href: "/plans",
      },
    ],
    [t],
  );

  const links = user ? authenticatedLinks : guestLinks;

  useEffect(() => {
    const getUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Bloqueio de Scroll do Body quando o menu mobile está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Transição da navbar de cápsula para full-width ao scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserDetails = () => {
    const fullName =
      user?.user_metadata?.name || user?.user_metadata?.full_name;
    const firstName = fullName
      ? fullName.split(" ")[0]
      : user?.email?.split("@")[0] || "User";
    return {
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      initial: firstName.charAt(0).toUpperCase(),
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setOpen(false);
    router.push("/");
  };

  const { firstName, initial } = user
    ? getUserDetails()
    : { firstName: "", initial: "" };

  return (
    <>
      <motion.header
        layout
        className="fixed inset-x-0 top-0 z-200"
        animate={{
          paddingTop: isScrolled ? 0 : 16,
          paddingLeft: isScrolled ? 0 : 16,
          paddingRight: isScrolled ? 0 : 16,
        }}
        transition={NAVBAR_TRANSITION}
      >
        <motion.div
          layout
          className="relative border border-white/10 bg-zinc-950/55 backdrop-blur-2xl"
          style={{
            width: isScrolled ? "100%" : "min(100%, 80rem)",
            maxWidth: isScrolled ? "100%" : "80rem",
            marginLeft: isScrolled ? 0 : "auto",
            marginRight: isScrolled ? 0 : "auto",
          }}
          animate={{
            borderRadius: isScrolled ? 0 : 9999,
            boxShadow: isScrolled
              ? "0 18px 80px rgba(0,0,0,0.18)"
              : "0 18px 80px rgba(0,0,0,0.32)",
          }}
          transition={NAVBAR_TRANSITION}
        >
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex min-h-11 items-center gap-3">
            <div className="flex items-center justify-center text-zinc-100">
              <BarberIcon className="size-7 sm:size-8" />
            </div>
            <span className="text-zinc-100 font-heading text-lg sm:text-xl font-semibold tracking-tight">
              Silentra
            </span>
          </Link>

          {/* AÇÕES DA NAVBAR */}
          <div className="flex items-center gap-2 sm:gap-3 z-200">
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={NAVBAR_POPUP_TRANSITION}
                >
                  <LanguageSwitcher />
                </motion.div>
              )}
            </AnimatePresence>
            {!loading &&
              (user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-medium tracking-wider text-zinc-100 transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
                  >
                    {initial}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={NAVBAR_POPUP_TRANSITION}
                        className="absolute right-0 mt-3 w-64 origin-top-right rounded-xl border border-white/10 bg-zinc-900/98 p-1.5 text-zinc-200 shadow-2xl backdrop-blur-lg"
                      >
                        <div className="px-3 py-2.5 text-xs text-zinc-400 border-b border-white/5 truncate font-medium">
                          <span className="text-zinc-100 font-semibold">
                            {firstName}
                          </span>
                          <span className="mx-1.5 text-white/20">|</span>
                          <span className="text-zinc-400 font-normal">
                            {user.email}
                          </span>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2.5 mt-1 text-sm transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {t("nav.dashboard", { defaultValue: "Dashboard" })}
                        </Link>

                        <Link
                          href="/dashboard/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {t("nav.settings", { defaultValue: "Settings" })}
                        </Link>

                        <Link
                          href="/plans"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {t("nav.plans", { defaultValue: "Plans" })}
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer font-medium"
                        >
                          {t("nav.logout", { defaultValue: "Logout" })}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/5 text-zinc-100 hover:border-white/30 hover:bg-white/10 text-xs sm:text-sm px-3 h-9 sm:h-10 sm:px-4"
                >
                  <Link href="/login">
                    {t("nav.signIn", { defaultValue: "Sign In" })}
                  </Link>
                </Button>
              ))}

            {/* BOTÃO DO MENU MOBILE */}
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="relative z-110 size-10 cursor-pointer border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <MenuIcon open={open} className="size-5" />
            </Button>
          </div>
          </div>
        </motion.div>
      </motion.header>

      {/* MENU OVERLAY MOBILE */}
      <div
        className={cn(
          "fixed inset-0 z-90 flex flex-col bg-zinc-950/98 px-6 py-24 text-zinc-50 backdrop-blur-2xl transition-opacity duration-700 ease-out origin-top-right",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        style={{
          clipPath: open
            ? "circle(150% at calc(100% - 2.5rem) 2.5rem)"
            : "circle(0% at calc(100% - 2.5rem) 2.5rem)",
        }}
        aria-hidden={!open}
      >
        <motion.div
          className="z-200 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center overflow-y-auto max-h-[calc(100vh-12rem)] no-scrollbar"
          initial={false}
          animate={open ? { opacity: 1 } : { opacity: 0 }}
          transition={NAVBAR_TRANSITION}
        >
          <div className="grid gap-4 sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group border-b border-white/4 py-3 sm:py-4 font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-200 transition-colors hover:text-white"
              >
                <span className="mr-3 inline-block text-sm sm:text-base text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400">
                  /
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
