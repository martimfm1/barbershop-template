"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, CalendarDays, Check, Gift, ShieldCheck, UsersRound } from "lucide-react";
import { motion } from "motion/react";

export function LocalizedHomepage() {
  const { locale } = useLanguage();
  const pt = locale === "pt";

  const copy = pt
    ? {
        eyebrow: "Software para barbearias",
        title: "A barbearia organizada para o cliente voltar.",
        intro: "Reservas, agenda, equipa, clientes e crescimento no mesmo sistema. Simples para o cliente; poderoso para quem gere.",
        primary: "Criar barbearia grátis",
        secondary: "Explorar barbearias",
        free: "Plano Free disponível",
        noCard: "Sem cartão para começar",
        noAccount: "O cliente pode reservar sem conta",
        demo: "Experiência de reserva",
        available: "Disponível",
        service: "Serviço",
        time: "Horário",
        summary: "Resumo",
        book: "Reservar",
        customer: "Cliente",
        customerText: "Reserva sem conta e gestão das marcações através do email.",
        team: "Equipa",
        teamText: "Cada membro vê apenas as áreas autorizadas da sua barbearia.",
        loyalty: "Fidelização",
        loyaltyText: "Pontos e recompensas para transformar visitas ocasionais em clientes recorrentes.",
        security: "Segurança",
        securityText: "Isolamento por barbearia, permissões e validações críticas protegem dados e operações.",
        featuresEyebrow: "Tudo ligado",
        featuresTitle: "Uma operação inteira num só lugar.",
        featuresText: "A Silentra liga reservas, equipa e retenção numa experiência simples para o cliente e poderosa para o barbeiro.",
        feature1: "Agenda inteligente",
        feature1Text: "Serviços, duração, profissionais e disponibilidade num fluxo de marcação claro.",
        feature2: "Gestão de equipa",
        feature2Text: "Roles e permissões ligadas à equipa real da barbearia.",
        feature3: "Fidelização",
        feature3Text: "Recompensas, pontos, QR e histórico preparados para incentivar o regresso.",
        ctaTitle: "Começa com uma operação mais simples.",
        ctaText: "Cria a tua barbearia, configura a agenda e começa a receber reservas.",
        ctaButton: "Começar grátis",
      }
    : {
        eyebrow: "Software for barbershops",
        title: "The organized barbershop your customers want to return to.",
        intro: "Bookings, schedule, team, customers and growth in one system. Simple for customers; powerful for operators.",
        primary: "Create a free barbershop",
        secondary: "Explore barbershops",
        free: "Free plan available",
        noCard: "No card required to start",
        noAccount: "Customers can book without an account",
        demo: "Booking experience",
        available: "Available",
        service: "Service",
        time: "Time",
        summary: "Summary",
        book: "Book",
        customer: "Customer",
        customerText: "Book without an account and manage appointments through email.",
        team: "Team",
        teamText: "Each team member only sees the areas they are authorized to access.",
        loyalty: "Loyalty",
        loyaltyText: "Points and rewards designed to turn occasional visits into repeat customers.",
        security: "Security",
        securityText: "Barbershop isolation, permissions and critical validations protect data and operations.",
        featuresEyebrow: "Connected operations",
        featuresTitle: "Your whole operation in one place.",
        featuresText: "Silentra connects bookings, team management and retention in an experience that stays simple for customers and powerful for barbers.",
        feature1: "Smart scheduling",
        feature1Text: "Services, duration, professionals and availability in one clear booking flow.",
        feature2: "Team management",
        feature2Text: "Roles and permissions connected to the real barbershop team.",
        feature3: "Loyalty",
        feature3Text: "Rewards, points, QR and history built to encourage customers to return.",
        ctaTitle: "Start with a simpler operation.",
        ctaText: "Create your barbershop, configure the schedule and start taking bookings.",
        ctaButton: "Start for free",
      };

  const services = pt
    ? [
        ["Corte + Barba", "45 min", "20 €"],
        ["Corte", "30 min", "15 €"],
        ["Barba", "20 min", "10 €"],
      ]
    : [
        ["Haircut + Beard", "45 min", "20 €"],
        ["Haircut", "30 min", "15 €"],
        ["Beard", "20 min", "10 €"],
      ];
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

  return (
    <main className="relative mt-24 overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              <CalendarDays className="size-3.5 text-emerald-300" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-6 max-w-3xl text-[2.8rem] font-semibold leading-[0.97] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">{copy.title}</h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-zinc-400 sm:text-lg">{copy.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{copy.primary}<ArrowRight className="size-4" /></Link>
              <Link href="/barbershops" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07]">{copy.secondary}</Link>
            </div>
            <div className="mt-6 grid gap-2 text-xs text-zinc-500 sm:flex sm:flex-wrap sm:gap-x-5">
              {[copy.free, copy.noCard, copy.noAccount].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />{item}</span>)}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="relative">
            <div className="absolute -inset-10 bg-emerald-400/[0.035] blur-3xl" />
            <div className="relative border border-white/10 bg-zinc-900/80 p-2.5 shadow-[0_35px_110px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="border border-white/10 bg-black/25 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{copy.demo}</p><p className="mt-1 text-base font-semibold text-white">Silentra Barbershop</p></div>
                  <span className="inline-flex items-center gap-1.5 border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] text-emerald-200">{copy.available}</span>
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{copy.service}</p>
                <div className="mt-2 grid gap-2">{services.map(([name, duration, price], index) => <div key={name} className={`flex min-h-14 items-center justify-between border px-3.5 ${index === 0 ? "border-white/20 bg-white/[0.06]" : "border-white/8 bg-white/[0.025]"}`}><div><p className="text-sm font-medium text-zinc-100">{name}</p><p className="mt-0.5 text-xs text-zinc-500">{duration}</p></div><span className="text-sm font-semibold text-zinc-200">{price}</span></div>)}</div>
                <div className="mt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{copy.time}</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{slots.map((slot, index) => <div key={slot} className={`min-h-10 border text-center py-3 text-xs font-medium ${index === 2 ? "border-emerald-400/30 bg-emerald-400/[0.10] text-emerald-200" : "border-white/8 bg-white/[0.025] text-zinc-300"}`}>{slot}</div>)}</div></div>
                <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs text-zinc-500">{copy.summary}</p><p className="mt-1 text-sm text-zinc-200">{services[0][0]} · 45 min · 10:00</p></div><Link href="/barbershops" className="inline-flex min-h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950">{copy.book}<ArrowRight className="size-4" /></Link></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.015]"><div className="mx-auto grid max-w-7xl md:grid-cols-4">{[
        [copy.customer, copy.customerText], [copy.team, copy.teamText], [copy.loyalty, copy.loyaltyText], [copy.security, copy.securityText],
      ].map(([title, text], index) => <div key={title} className={`px-4 py-7 sm:px-6 lg:px-8 ${index > 0 ? "border-t border-white/8 md:border-l md:border-t-0" : ""}`}><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{title}</p><p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p></div>)}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">{copy.featuresEyebrow}</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">{copy.featuresTitle}</h2><p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">{copy.featuresText}</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [CalendarDays, copy.feature1, copy.feature1Text],
            [UsersRound, copy.feature2, copy.feature2Text],
            [Gift, copy.feature3, copy.feature3Text],
          ].map(([Icon, title, text]) => <div key={String(title)} className="border border-white/8 bg-white/[0.02] p-6"><Icon className="size-5 text-emerald-300" /><h3 className="mt-5 text-lg font-semibold text-white">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{String(text)}</p></div>)}
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]"><div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20"><div className="max-w-2xl"><h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{copy.ctaTitle}</h2><p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">{copy.ctaText}</p></div><Link href="/registo" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950">{copy.ctaButton}<ArrowRight className="size-4" /></Link></div></section>
    </main>
  );
}
