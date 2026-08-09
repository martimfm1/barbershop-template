"use client";

import { MailCheck, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

const agendaItems = [
  { time: "09:00", name: "Mateus", service: "Degradê + Barba", meta: "Check-in confirmado", state: "active" },
  { time: "10:00", name: "Joana", service: "Corte de Cabelo", meta: "Chega em 14m", state: "active" },
  { time: "11:30", name: "Slot Bloqueado", service: "Motivo: Almoço da Equipa", meta: "Horário protegido", state: "blocked" },
  { time: "13:30", name: "Rui", service: "Acabamento / Pezinho", meta: "Lembrete automático enviado", state: "active" },
] as const;

const recentBookings = [
  { name: "Sofia", service: "Corte de Cabelo", badge: "Sem Registo", channel: "Confirmado via SMS" },
  { name: "David", service: "Degradê + Barba", badge: "Sem Conta", channel: "Confirmado via SMS" },
  { name: "Ana", service: "Acabamento / Pezinho", badge: "Sem Registo", channel: "Confirmado via SMS" },
] as const;

const outreach = [
  { icon: MessageSquare, title: "Lembrete enviado a João", detail: "Há 15m · Estado: Entregue" },
  { icon: MailCheck, title: "Pedido de avaliação enviado a Marcus", detail: "Há 2h · Estado: Clicado" },
] as const;

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function CommandCenterSection() {
  return (
    <section id="command-center" className="space-y-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Centro de Comando</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
            Um dashboard de alta fidelidade feito para a clareza.
          </h2>
        </div>
        <p className="hidden max-w-sm text-sm leading-6 text-zinc-500 md:block">
          Marcações, faturação, fila de espera e notificações automáticas numa única interface premium.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.article variants={reveal} transition={{ duration: 0.55 }} className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Agenda Principal</p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-50">Hoje</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-zinc-400 backdrop-blur-xl">09:00 - 14:00</div>
          </div>
          <div className="mt-5 space-y-3">
            {agendaItems.map((item) => (
              <div key={`${item.time}-${item.name}`} className={`rounded-3xl border px-4 py-4 backdrop-blur-xl ${item.state === "blocked" ? "border-amber-500/15 bg-amber-500/5" : "border-white/8 bg-white/3"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="min-w-14 text-sm font-medium text-zinc-100">{item.time}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-50">{item.name}</span>
                        {item.state === "blocked" ? <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.25em] text-amber-100 backdrop-blur-xl">Horário Bloqueado</span> : null}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">{item.meta}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs backdrop-blur-xl ${item.state === "blocked" ? "bg-amber-500/10 text-amber-100" : "bg-white/5 text-zinc-300"}`}>{item.service}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article variants={reveal} transition={{ duration: 0.55 }} className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Resumo de Métricas</p>
          <div className="mt-3 text-sm text-zinc-400">Faturação de Hoje</div>
          <div className="mt-2 text-4xl font-semibold tracking-tighter text-zinc-50">€340.00</div>
          <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-xl">+12% vs semana passada</div>
          <div className="mt-6 h-36 rounded-3xl border border-white/8 bg-linear-to-b from-white/3 to-transparent p-4 backdrop-blur-xl">
            <svg viewBox="0 0 300 120" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(74,222,128,0.45)" />
                  <stop offset="100%" stopColor="rgba(74,222,128,0)" />
                </linearGradient>
              </defs>
              <path d="M0 92L36 78L72 84L108 46L144 60L180 30L216 44L252 34L300 52V120H0Z" fill="url(#revenueFill)" />
              <path d="M0 92L36 78L72 84L108 46L144 60L180 30L216 44L252 34L300 52" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.article>

        <motion.article variants={reveal} transition={{ duration: 0.55 }} className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Fila sem complicações</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-50">Marcações Recentes</h3>
          <div className="mt-5 space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.name} className="rounded-full border border-white/8 bg-white/3 p-4 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-50">{booking.name}</span>
                      <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] uppercase tracking-[0.22em] text-zinc-400 backdrop-blur-xl">{booking.badge}</span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">{booking.service}</div>
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

        <motion.article variants={reveal} transition={{ duration: 0.55 }} className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Notificações automáticas</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-50">Notificações</h3>
          <div className="mt-5 space-y-3">
            {outreach.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-full border border-white/8 bg-white/3 p-4 backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 backdrop-blur-xl">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-50">{item.title}</div>
                      <div className="mt-1 text-sm text-zinc-400">{item.detail}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.article>
      </div>
    </section>
  );
}