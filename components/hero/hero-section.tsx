"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Circle,
  CircleCheckBig,
  Clock3,
  Store,
  type LucideIcon,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  duration: string;
  price: string;
};

type Slot = string;

type HeroSectionProps = {
  services: readonly Service[];
  slots: readonly Slot[];
};

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

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

export function HeroSection({ services, slots }: HeroSectionProps) {
  const [selectedService, setSelectedService] = useState(services[0]?.id ?? "");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedServiceData = useMemo(
    () => services.find((service) => service.id === selectedService) ?? services[0],
    [selectedService, services],
  );

  return (
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
            <BadgeCheck className="size-3.5 text-zinc-100" />
            Zero Friction booking
          </div>

          <h1 className="mt-7 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-7xl lg:text-[7.25rem] lg:leading-[0.92]">
            Silentra
            <span className="block text-zinc-400">for barbers</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Clients book in seconds through the browser. No app downloads. No
            account creation. Just a direct path to a confirmed appointment.
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
                  Selected: <span className="text-zinc-200">{selectedServiceData?.name}</span> ·{" "}
                  <span className="text-zinc-200">{selectedSlot ?? "—"}</span>
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
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 text-emerald-100">
                      <CircleCheckBig className="size-5" />
                      <div>
                        <div className="text-sm font-medium">Booking confirmed</div>
                        <div className="text-sm text-emerald-200/80">
                          {selectedServiceData?.name} · {selectedSlot} · Zero friction
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
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="mt-5 rounded-3xl border border-white/8 bg-white/2 p-4 text-sm text-zinc-500 backdrop-blur-xl"
                  >
                    Try the flow. It mirrors the actual client experience: select,
                    slot, confirm.
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
                  Fast decisions, clean confirmation, and no onboarding wall.
                </p>
                <div className="mt-6 rounded-3xl border border-white/8 bg-linear-to-br from-white/6 to-transparent p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>{selectedServiceData?.name}</span>
                    <span>{selectedServiceData?.price}</span>
                  </div>
                  <div className="mt-5 h-32 rounded-3xl border border-white/8 bg-[linear-gradient(to_top,rgba(255,255,255,0.03),transparent)] p-4 backdrop-blur-xl">
                    <div className="flex h-full items-end gap-2">
                      {[24, 42, 34, 78, 62, 90, 58, 44].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-full bg-linear-to-t from-emerald-500/25 to-zinc-100/80"
                          style={{ height: `${height}%` }}
                        />
                      ))}
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
                    A quick confirmation touchpoint keeps the experience seamless.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/4 p-6 backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200/70">
                  <span className="size-2 rounded-full bg-emerald-300/80" />
                  The Silentra way
                </div>
                <div className="mt-6 grid gap-3">
                  {silentraWay.map((item) => {
                    const Icon = item.icon as LucideIcon;
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
