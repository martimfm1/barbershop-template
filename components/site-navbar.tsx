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
import { useRouter, usePathname } from "next/navigation";
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
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const bookingManagementLink = useMemo(() => ({
    label: t("nav.manageBookings", { defaultValue: "Gerir marcações" }),
    href: "/my-bookings",
  }), [t]);

  const guestLinks = useMemo(() => [
    { label: t("nav.barbershops", { defaultValue: "Barbershops" }), href: "/barbershops" },
    bookingManagementLink,
    { label: t("nav.howItWorks", { defaultValue: "How it works" }), href: "/#friction" },
    { label: t("nav.forBarbers", { defaultValue: "For barbers" }), href: "/registo" },
  ], [t, bookingManagementLink]);

  const authenticatedLinks = useMemo(() => [
    { label: t("nav.dashboard", { defaultValue: "Dashboard" }), href: "/dashboard" },
    { label: t("nav.barbershops", { defaultValue: "Barbershops" }), href: "/barbershops" },
    bookingManagementLink,
    { label: t("nav.settings", { defaultValue: "Settings" }), href: "/dashboard/settings" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: t("nav.plans", { defaultValue: "Plans" }), href: "/plans" },
  ], [t, bookingManagementLink]);

  const links = user ? authenticatedLinks : guestLinks;

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null); setLoading(false);
    };
    getUserSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll(); window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
