"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Circle,
  CircleCheckBig,
  Clock3,
  Download,
  MailCheck,
  MessageSquare,
  Store,
  ShieldAlert,
  Sparkles,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";

const services = [
  { id: "haircut", name: "Haircut", duration: "30m", price: "€25" },
  { id: "fade", name: "Fade + Beard", duration: "45m", price: "€38" },
  { id: "cleanup", name: "Quick Cleanup", duration: "20m", price: "€18" },
] as const;

const slots = ["09:00", "09:30", "10:00", "11:30", "12:00", "13:30"] as const;

const oldWay = [
  {
    icon: Download,
    label: "Download app",
    tone: "text-red-200",
    bg: "bg-red-500/10",
  },
  {
    icon: UsersRound,
    label: "Create account",
    tone: "text-red-200",
    bg: "bg-red-500/10",
  },
  {
    icon: ShieldAlert,
    label: "Verify email",
    tone: "text-red-200",
    bg: "bg-red-500/10",
  },
  {
    icon: Workflow,
    label: "Recover password",
    tone: "text-red-200",
    bg: "bg-red-500/10",
  },
] as const;

const silentraWay = [
  {
    icon: Store,
    label: "Pick a service",
    tone: "text-emerald-200",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Clock3,
    label: "Pick a time",
    tone: "text-emerald-200",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BadgeCheck,
    label: "Done",
    tone: "text-emerald-200",
    bg: "bg-emerald-500/10",
  },
] as const;

const agendaItems = [
  {
    time: "09:00",
    name: "Mateus",
    service: "Fade + Beard",
    meta: "Check-in confirmed",
    state: "active",
  },
  {
    time: "10:00",
    name: "Joana",
    service: "Haircut",
    meta: "Arrives in 14m",
    state: "active",
  },
  {
    time: "11:30",
    name: "Blocked Slot",
    service: "Reason: Staff Lunch",
    meta: "Protected time block",
    state: "blocked",
  },
  {
    time: "13:30",
    name: "Rui",
    service: "Cleanup",
    meta: "Auto-reminder sent",
    state: "active",
  },
] as const;

const recentBookings = [
  {
    name: "Sofia",
    service: "Haircut",
    badge: "Guest Booking",
    channel: "Confirmed via WhatsApp",
  },
  {
    name: "David",
    service: "Fade + Beard",
    badge: "No Account",
    channel: "Confirmed via SMS",
  },
  {
    name: "Ana",
    service: "Cleanup",
    badge: "Guest Booking",
    channel: "Confirmed via SMS",
  },
] as const;

const outreach = [
  {
    icon: MessageSquare,
    title: "Reminder sent to John",
    detail: "15m ago · Status: Delivered",
  },
  {
    icon: MailCheck,
    title: "Review request sent to Marcus",
    detail: "2h ago · Status: Clicked",
  },
] as const;

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const [selectedService, setSelectedService] =
    useState<(typeof services)[number]["id"]>("haircut");
  const [selectedSlot, setSelectedSlot] = useState<
    (typeof slots)[number] | null
  >(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedServiceData = useMemo(
    () =>
      services.find((service) => service.id === selectedService) ?? services[0],
    [selectedService],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_22%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to_bottom,black,transparent_88%)",
        }}
      />

      <SiteNavbar />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <section id="home">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
            className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
          >
            <motion.div
              variants={reveal}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-zinc-300 backdrop-blur-xl">
                <Sparkles className="size-3.5 text-zinc-100" />
                Zero Friction booking
              </div>

              <h1 className="mt-7 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-7xl lg:text-[7.25rem] lg:leading-[0.92]">
                Silentra
                <span className="block text-zinc-400">for barbers</span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Clients book in seconds through the browser. No app downloads.
                No account creation. Just a direct path to a confirmed
                appointment.
              </p>
            </motion.div>

            <motion.div
              variants={reveal}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              className="mt-10 rounded-3xl border border-white/10 bg-zinc-900/55 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
            >
              <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                        Interactive micro-booking simulator
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-2xl">
                        Pick a service, choose a slot, confirm instantly.
                      </h2>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-xl">
                      {confirmed ? "Confirmed" : "Instant flow"}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {services.map((service) => {
                      const active = selectedService === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            setSelectedService(service.id);
                            setConfirmed(false);
                          }}
                          className={`rounded-full border px-4 py-3 text-left transition-all duration-200 backdrop-blur-xl ${active ? "border-white/20 bg-white/6 shadow-[0_12px_50px_rgba(255,255,255,0.04)]" : "border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-zinc-50">
                                {service.name}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {service.duration}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-zinc-300">
                              {service.price}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      Choose time
                    </span>
                    {slots.map((slot) => {
                      const active = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setConfirmed(false);
                          }}
                          className={`rounded-full border px-4 py-2 text-sm transition-all backdrop-blur-xl ${active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/3 text-zinc-300 hover:border-white/20 hover:bg-white/5"}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-zinc-400">
                      Selected:{" "}
                      <span className="text-zinc-200">
                        {selectedServiceData.name}
                      </span>{" "}
                      ·{" "}
                      <span className="text-zinc-200">
                        {selectedSlot ?? "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectedSlot && setConfirmed(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition-transform hover:-translate-y-0.5"
                    >
                      Confirm Booking
                      <ArrowRight className="size-4" />
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {confirmed ? (
                      <motion.div
                        key="confirmed"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 24,
                        }}
                        className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-3 text-emerald-100">
                          <CircleCheckBig className="size-5" />
                          <div>
                            <div className="text-sm font-medium">
                              Booking confirmed
                            </div>
                            <div className="text-sm text-emerald-200/80">
                              {selectedServiceData.name} · {selectedSlot} · Zero
                              friction
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 24,
                        }}
                        className="mt-5 rounded-3xl border border-white/8 bg-white/2 p-4 text-sm text-zinc-500 backdrop-blur-xl"
                      >
                        Try the flow. It mirrors the actual client experience:
                        select, slot, confirm.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl sm:p-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.34em] text-zinc-500">
                      <Circle className="size-2 fill-emerald-300 text-emerald-300" />
                      Live signal
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      Fast decisions, clean confirmation, and no onboarding
                      wall.
                    </p>
                    <div className="mt-6 rounded-3xl border border-white/8 bg-linear-to-br from-white/6 to-transparent p-5 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-sm text-zinc-300">
                        <span>{selectedServiceData.name}</span>
                        <span>{selectedServiceData.price}</span>
                      </div>
                      <div className="mt-5 h-32 rounded-3xl border border-white/8 bg-[linear-gradient(to_top,rgba(255,255,255,0.03),transparent)] p-4 backdrop-blur-xl">
                        <div className="flex h-full items-end gap-2">
                          {[24, 42, 34, 78, 62, 90, 58, 44].map(
                            (height, index) => (
                              <div
                                key={index}
                                className="flex-1 rounded-t-full bg-linear-to-t from-emerald-500/25 to-zinc-100/80"
                                style={{ height: `${height}%` }}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                        No app
                      </p>
                      <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
                        Browser only
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        No install, no account, no password reset loop.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                        SMS / WhatsApp
                      </p>
                      <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
                        Instant confirmation
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        A quick confirmation touchpoint keeps the experience
                        seamless.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section id="friction" className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
              <span className="size-2 rounded-full bg-red-400/70" />
              The old way
            </div>
            <div className="mt-6 grid gap-3">
              {oldWay.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-full border border-white/8 px-4 py-3 backdrop-blur-xl ${item.bg}`}
                  >
                    <Icon className={`size-4 ${item.tone}`} />
                    <span className="text-sm text-zinc-200">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/4 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              <span className="size-2 rounded-full bg-emerald-300/80" />
              The Silentra way
            </div>
            <div className="mt-6 grid gap-3">
              {silentraWay.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-full border border-white/8 px-4 py-3 backdrop-blur-xl ${item.bg}`}
                  >
                    <Icon className={`size-4 ${item.tone}`} />
                    <span className="text-sm text-zinc-100">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="command-center" className="space-y-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                The command center
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                A high-fidelity dashboard built for clarity.
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm leading-6 text-zinc-500 md:block">
              Appointments, revenue, queue signals, and automated outreach in
              one premium interface.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <motion.article
              variants={reveal}
              transition={{ duration: 0.55 }}
              className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:col-span-2"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                    Calendar core
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-50">
                    Today
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-zinc-400 backdrop-blur-xl">
                  09:00 - 14:00
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {agendaItems.map((item) => (
                  <div
                    key={`${item.time}-${item.name}`}
                    className={`rounded-3xl border px-4 py-4 backdrop-blur-xl ${item.state === "blocked" ? "border-amber-500/15 bg-amber-500/5" : "border-white/8 bg-white/3"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="min-w-14 text-sm font-medium text-zinc-100">
                          {item.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-50">
                              {item.name}
                            </span>
                            {item.state === "blocked" ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.25em] text-amber-100 backdrop-blur-xl">
                                Blocked Slot
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {item.meta}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs backdrop-blur-xl ${item.state === "blocked" ? "bg-amber-500/10 text-amber-100" : "bg-white/5 text-zinc-300"}`}
                      >
                        {item.service}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.article
              variants={reveal}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                Analytics snapshot
              </p>
              <div className="mt-3 text-sm text-zinc-400">
                Today&apos;s Revenue
              </div>
              <div className="mt-2 text-4xl font-semibold tracking-tighter text-zinc-50">
                €340.00
              </div>
              <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-xl">
                +12% vs last week
              </div>
              <div className="mt-6 h-36 rounded-3xl border border-white/8 bg-linear-to-b from-white/3 to-transparent p-4 backdrop-blur-xl">
                <svg
                  viewBox="0 0 300 120"
                  className="h-full w-full"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgba(74,222,128,0.45)" />
                      <stop offset="100%" stopColor="rgba(74,222,128,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 92L36 78L72 84L108 46L144 60L180 30L216 44L252 34L300 52V120H0Z"
                    fill="url(#revenueFill)"
                  />
                  <path
                    d="M0 92L36 78L72 84L108 46L144 60L180 30L216 44L252 34L300 52"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.article>

            <motion.article
              variants={reveal}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                Frictionless queue
              </p>
              <h3 className="mt-3 text-xl font-semibold text-zinc-50">
                Recent Bookings
              </h3>
              <div className="mt-5 space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.name}
                    className="rounded-full border border-white/8 bg-white/3 p-4 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-50">
                            {booking.name}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] uppercase tracking-[0.22em] text-zinc-400 backdrop-blur-xl">
                            {booking.badge}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-zinc-400">
                          {booking.service}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-200">
                        <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                        {booking.channel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.article
              variants={reveal}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                Automated outreach
              </p>
              <h3 className="mt-3 text-xl font-semibold text-zinc-50">
                Notifications
              </h3>
              <div className="mt-5 space-y-3">
                {outreach.map((item) => {
                  const Icon = item.icon as LucideIcon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-full border border-white/8 bg-white/3 p-4 backdrop-blur-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 backdrop-blur-xl">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-50">
                            {item.title}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.article>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-linear-to-br from-white/6 to-transparent p-6 backdrop-blur-xl shadow-[0_24px_100px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-emerald-300">
                A tua próxima marcação começa aqui
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Encontra o teu próximo serviço ou leva a tua barbearia mais longe.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                Marca em segundos numa barbearia parceira ou cria o espaço da tua
                barbearia na plataforma e gere tudo num só lugar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/barbershops"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-50 px-5 text-sm font-medium text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.34),0_18px_55px_rgba(255,255,255,0.08)] transition-transform hover:-translate-y-0.5"
              >
                Marcar um serviço <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/registo"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-zinc-100 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/10"
              >
                Criar a minha barbearia
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
