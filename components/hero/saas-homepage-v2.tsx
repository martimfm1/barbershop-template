"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  Gift,
  Megaphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

const services = [
  { name: "Corte + Barba", duration: "45 min", price: "20 €" },
  { name: "Corte", duration: "30 min", price: "15 €" },
  { name: "Barba", duration: "20 min", price: "10 €" },
] as const;

const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] as const;

const features = [
  { icon: CalendarDays, label: "Operação", title: "Agenda que respeita a realidade", text: "Serviços, duração, profissionais, folgas, pausas, bloqueios e conflitos são considerados no fluxo de marcação." },
  { icon: UsersRound, label: "Equipa", title: "Permissões sem confusão", text: "Owner, administradores e barbeiros partilham o plano da barbearia, enquanto cada membro recebe apenas o acesso autorizado." },
  { icon: Store, label: "Presença", title: "Uma página pública para vender", text: "Serviços, equipa, avaliações e reservas ficam ligados numa página pública simples de partilhar." },
  { icon: QrCode, label: "Aquisição", title: "QR pronto para o mundo real", text: "Cada barbearia tem um QR único para colocar no balcão, cartões, montras ou redes sociais." },
  { icon: Gift, label: "Retenção", title: "Fidelização que dá uma razão para voltar", text: "Cria pontos e recompensas para transformar clientes ocasionais em clientes recorrentes." },
  { icon: Megaphone, label: "Marketing", title: "Campanhas e automações", text: "Comunicação e tarefas repetitivas deixam de depender de trabalho manual todos os dias." },
  { icon: BarChart3, label: "Decisão", title: "Estatísticas para gerir melhor", text: "A atividade da operação torna-se informação útil para acompanhar evolução e tomar decisões." },
  { icon: BellRing, label: "Relacionamento", title: "Clientes acompanhados", text: "Marcações, lembretes, seguimentos e gestão por email mantêm o cliente ligado à barbearia." },
  { icon: ShieldCheck, label: "Controlo", title: "Segurança no centro", text: "Isolamento por barbearia, permissões server-side e validações críticas protegem dados e operações." },
] as const;

const plans = [
  { name: "Free", price: "0 €", subtitle: "Para começar", features: ["Agendamentos ilimitados", "Clientes e serviços ilimitados", "Reservas online + QR", "1 barbeiro / localização"] },
  { name: "Pro", price: "9,90 €", subtitle: "Para crescer", recommended: true, features: ["Até 5 barbeiros", "CRM e estatísticas avançadas", "Campanhas e automações", "Fidelização e seguimentos"] },
  { name: "Enterprise", price: "A partir de 29,90 €", subtitle: "Para escalar", features: ["Barbeiros e localizações ilimitados", "Permissões e gestão global", "POS, stock e comissões", "Relatórios empresariais avançados"] },
] as const;

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">{text}</p>
    </div>
  );
}

export function SaaSHomepageV2() {
  const [selectedService, setSelectedService] = useState(services[0].name);
  const [selectedSlot, setSelectedSlot] = useState<string | null>("10:00");
  const service = useMemo(() => services.find((item) => item.name === selectedService) ?? services[0], [selectedService]);

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_15%_5%,rgba(255,255,255,0.075),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(16,185,129,0.10),transparent_30%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300"><Sparkles className="size-3.5 text-emerald-300" />Software para barbearias</div>
            <h1 className="mt-6 max-w-3xl text-[2.8rem] font-semibold leading-[0.97] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">A barbearia organizada para o cliente voltar.</h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-zinc-400 sm:text-lg">Reservas, agenda, equipa, clientes e crescimento no mesmo sistema. Simples para o cliente; poderoso para quem gere.</p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Criar barbearia grátis <ArrowRight className="size-4" /></Link>
              <Link href="/barbershops" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">Explorar barbearias</Link>
            </div>
            <div className="mt-6 grid gap-2 text-xs text-zinc-500 sm:flex sm:flex-wrap sm:gap-x-5"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Plano Free disponível</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Sem cartão para começar</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Cliente pode reservar sem conta</span></div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="relative">
            <div className="absolute -inset-10 bg-emerald-400/[0.035] blur-3xl" />
            <div className="relative border border-white/10 bg-zinc-900/80 p-2.5 shadow-[0_35px_110px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-3">
              <div className="border border-white/10 bg-black/25 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Experiência de reserva</p><p className="mt-1 text-base font-semibold text-white">Barbearia Silentra</p></div><span className="inline-flex shrink-0 items-center gap-1.5 border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] text-emerald-200"><CircleCheck className="size-3.5" />Disponível</span></div>
                <div className="mt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Serviço</span><span className="text-[11px] text-zinc-600">Preço · duração</span></div><div className="mt-2 grid gap-2">{services.map((item) => { const active = item.name === selectedService; return <button key={item.name} type="button" onClick={() => { setSelectedService(item.name); setSelectedSlot(null); }} aria-pressed={active} className={`flex min-h-14 items-center justify-between border px-3.5 text-left transition ${active ? "border-white/20 bg-white/[0.06]" : "border-white/8 bg-white/[0.025] hover:bg-white/[0.045]"}`}><div><p className="text-sm font-medium text-zinc-100">{item.name}</p><p className="mt-0.5 text-xs text-zinc-500">{item.duration}</p></div><span className="text-sm font-semibold text-zinc-200">{item.price}</span></button>; })}</div></div>
                <div className="mt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Horário</span><span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><Clock3 className="size-3.5" />Hoje</span></div><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{slots.map((slot) => { const active = slot === selectedSlot; return <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} aria-pressed={active} className={`min-h-10 border text-xs font-medium transition ${active ? "border-emerald-400/30 bg-emerald-400/[0.10] text-emerald-200" : "border-white/8 bg-white/[0.025] text-zinc-300 hover:bg-white/[0.05]"}`}>{slot}</button>; })}</div></div>
                <div className="mt-5 border-t border-white/8 pt-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs text-zinc-500">Resumo</p><p className="mt-1 text-sm text-zinc-200">{service.name} · {service.duration} · {selectedSlot ?? "Escolhe uma hora"}</p></div><Link href="/barbershops" className="inline-flex min-h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950">Reservar <ArrowRight className="size-4" /></Link></div></div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">{["Serviço", "Horário", "Confirmação"].map((item, index) => <div key={item} className="border border-white/8 bg-white/[0.02] px-2.5 py-2.5 text-[11px] text-zinc-500"><span className="mr-1.5 text-emerald-300">0{index + 1}</span>{item}</div>)}</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.015]"><div className="mx-auto grid max-w-7xl md:grid-cols-3"><div className="px-4 py-7 sm:px-6 md:px-6 lg:px-8"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Cliente</p><p className="mt-2 text-sm leading-6 text-zinc-300">Reserva sem conta e gestão das marcações através do email.</p></div><div className="border-t border-white/8 px-4 py-7 sm:px-6 md:border-l md:border-t-0 md:px-6 lg:px-8"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Equipa</p><p className="mt-2 text-sm leading-6 text-zinc-300">Agenda, profissionais, clientes e permissões alinhados com a barbearia.</p></div><div className="border-t border-white/8 px-4 py-7 sm:px-6 md:border-l md:border-t-0 md:px-6 lg:px-8"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Negócio</p><p className="mt-2 text-sm leading-6 text-zinc-300">Fidelização, marketing, automações e estatísticas para crescer.</p></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 sm:py-24 lg:px-8"><SectionHeading eyebrow="Produto" title="Tudo o que a operação precisa, numa única linguagem visual." text="O Silentra liga a experiência pública do cliente à operação privada da barbearia. Sem ferramentas espalhadas, sem estados duplicados e sem esconder a complexidade onde ela realmente importa." /><div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{features.map(({ icon: Icon, label, title, text }, index) => <motion.article key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.4, delay: index * 0.02 }} className="border border-white/10 bg-zinc-900/40 p-5 transition hover:border-white/20 hover:bg-white/[0.035] sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex size-10 items-center justify-center border border-white/10 bg-white/[0.04] text-emerald-200"><Icon className="size-4" /></div><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{label}</span></div><h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></motion.article>)}</div></section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-18 sm:px-6 sm:pb-24 lg:grid-cols-2 lg:px-8"><article className="border border-white/10 bg-zinc-900/45 p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Depois da reserva</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">A relação não acaba no botão “confirmar”.</h2><div className="mt-7 space-y-3">{["O cliente consulta todas as marcações associadas ao mesmo email.", "Pode cancelar dentro da janela definida pela barbearia.", "Pode reagendar para horários que respeitam a operação real."].map((text) => <div key={text} className="flex gap-3 border border-white/8 bg-black/15 p-4 text-sm leading-6 text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{text}</div>)}</div><Link href="/my-bookings" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-white">Gerir uma marcação <ArrowRight className="size-4" /></Link></article><article className="border border-emerald-500/15 bg-emerald-500/[0.035] p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">Depois da operação</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Quando a base está organizada, o crescimento deixa de ser improvisado.</h2><div className="mt-7 space-y-3">{["Fidelização para aumentar frequência.", "Campanhas e automações para reduzir trabalho manual.", "QR e página pública para aumentar reservas.", "Estatísticas para perceber o que está a acontecer."].map((text) => <div key={text} className="flex gap-3 border border-white/8 bg-black/15 p-4 text-sm leading-6 text-zinc-300"><CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />{text}</div>)}</div><Link href="/registo" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950">Começar grátis <ArrowRight className="size-4" /></Link></article></section>

      <section className="border-y border-white/8 bg-white/[0.012]"><div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 sm:py-24 lg:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><SectionHeading eyebrow="Planos por barbearia" title="Começa pequeno. Cresce sem trocar de sistema." text="O plano é ligado à barbearia, por isso as funcionalidades do plano acompanham toda a equipa desse tenant." /><Link href="/plans" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-white">Comparar planos <ArrowRight className="size-4" /></Link></div><div className="mt-10 grid gap-3 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative border p-5 sm:p-6 ${plan.recommended ? "border-emerald-400/30 bg-emerald-400/[0.035]" : "border-white/10 bg-zinc-900/35"}`}>{plan.recommended ? <div className="absolute left-5 top-0 -translate-y-1/2 border border-emerald-400/20 bg-zinc-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Recomendado</div> : null}<div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">Barbers {plan.name}</h3><p className="mt-1 text-sm text-zinc-500">{plan.subtitle}</p></div><span className="text-lg font-semibold text-zinc-100">{plan.price}</span></div><div className="mt-6 space-y-3">{plan.features.map((feature) => <div key={feature} className="flex gap-2.5 text-sm text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{feature}</div>)}</div><Link href="/plans" className={`mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold ${plan.recommended ? "bg-white text-zinc-950" : "border border-white/10 bg-white/[0.04] text-zinc-100"}`}>Ver plano <ArrowRight className="size-4" /></Link></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 sm:py-28 lg:px-8"><div className="border border-white/10 bg-zinc-900/55 p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-10 lg:p-14"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Próximo passo</p><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Cria a barbearia. O sistema trata do resto.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Configura o essencial, publica a tua página e começa a receber reservas. O restante cresce contigo.</p><div className="mt-7 grid gap-3 sm:flex sm:justify-center"><Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950">Criar barbearia grátis <ArrowRight className="size-4" /></Link><Link href="/barbershops" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100">Explorar barbearias</Link></div><p className="mt-5 text-xs text-zinc-600">Já tens uma reserva? Gere-a através do email.</p></div></section>
    </main>
  );
}
