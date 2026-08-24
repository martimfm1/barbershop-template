'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Circle,
  CircleCheckBig,
  Clock3,
  Store,
  type LucideIcon,
} from 'lucide-react';

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
    label: 'Escolher serviço',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Clock3,
    label: 'Escolher hora',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BadgeCheck,
    label: 'Confirmado',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
] as const;

export function HeroSection({ services, slots }: HeroSectionProps) {
  const [selectedService, setSelectedService] = useState(services[0]?.id ?? '');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedServiceData = useMemo(
    () =>
      services.find((service) => service.id === selectedService) ?? services[0],
    [selectedService, services],
  );

  return (
    <section id="inicio">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
        }}
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
      >
        <motion.div
          variants={reveal}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-zinc-300 backdrop-blur-xl">
            <BadgeCheck className="size-3.5 text-zinc-100" />
            Reservas sem fricção
          </div>

          <h1 className="mt-7 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-7xl lg:text-[7.25rem] lg:leading-[0.92]">
            Silentra
            <span className="block text-zinc-400">para barbeiros</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Os teus clientes marcam em segundos através do navegador. Sem
            instalar aplicações, sem criar contas e sem formulários
            desnecessários.
          </p>
        </motion.div>

        <motion.div
          variants={reveal}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
          className="mt-10 rounded-3xl border border-white/10 bg-zinc-900/55 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">
                    Experimenta antes de criar conta
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-2xl">
                    Escolhe um serviço, vê uma hora e confirma.
                  </h2>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-xl">
                  {confirmed ? 'Confirmado' : 'Fluxo rápido'}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {services.map((service, index) => {
                  const active = selectedService === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(service.id);
                        setConfirmed(false);
                      }}
                      aria-pressed={active}
                      className={`rounded-full border px-4 py-3 text-left transition-all duration-200 backdrop-blur-xl ${active ? 'border-white/20 bg-white/6 shadow-[0_12px_50px_rgba(255,255,255,0.04)]' : 'border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4'}`}
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
                  Escolher hora
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
                      aria-pressed={active}
                      className={`rounded-full border px-4 py-2 text-sm transition-all backdrop-blur-xl ${active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/3 text-zinc-300 hover:border-white/20 hover:bg-white/5'}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-400">
                  Selecionado:{' '}
                  <span className="text-zinc-200">
                    {selectedServiceData?.name}
                  </span>{' '}
                  ·{' '}
                  <span className="text-zinc-200">
                    {selectedSlot ?? 'Escolhe uma hora'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => selectedSlot && setConfirmed(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirmar reserva
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
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 text-emerald-100">
                      <CircleCheckBig className="size-5" />
                      <div>
                        <div className="text-sm font-medium">
                          Reserva confirmada
                        </div>
                        <div className="text-sm text-emerald-200/80">
                          {selectedServiceData?.name} · {selectedSlot} · Sem
                          fricção
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
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="mt-5 rounded-3xl border border-white/8 bg-white/2 p-4 text-sm text-zinc-500 backdrop-blur-xl"
                  >
                    Experimenta o fluxo. O visitante recebe valor antes de lhe
                    pedirmos qualquer registo.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.34em] text-zinc-500">
                  <Circle className="size-2 fill-emerald-300 text-emerald-300" />{' '}
                  Experiência em tempo real
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  Menos decisões, menos campos e um caminho óbvio até à reserva.
                </p>
                <div className="mt-6 space-y-3">
                  {silentraWay.map(({ icon: Icon, label, tone, bg }, index) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 p-4"
                    >
                      <div
                        className={`flex size-9 items-center justify-center rounded-xl ${bg} ${tone}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-100">
                          {index + 1}. {label}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Sem passos desnecessários.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                    Sem aplicação
                  </p>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
                    Só no navegador
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Sem instalação, conta ou palavra-passe.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                    Confirmação
                  </p>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
                    Imediata
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Uma confirmação clara reduz a ansiedade depois da reserva.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
