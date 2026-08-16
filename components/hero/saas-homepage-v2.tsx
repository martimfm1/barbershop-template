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
import { useSubscription } from "@/hooks/useSubscription";

type ServiceName = "Corte + Barba" | "Corte" | "Barba";
type DemoService = { name: ServiceName; duration: string; price: string };
type Plan = {
  name: "Free" | "Pro" | "Enterprise";
  price: string;
  subtitle: string;
  recommended: boolean;
  features: readonly string[];
};

const services: readonly DemoService[] = [
  { name: "Corte + Barba", duration: "45 min", price: "20 €" },
  { name: "Corte", duration: "30 min", price: "15 €" },
  { name: "Barba", duration: "20 min", price: "10 €" },
];

const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] as const;

const plans: readonly Plan[] = [
  {
    name: "Free",
    price: "0 €",
    subtitle: "Para começar",
    recommended: false,
    features: [
      "Agendamentos ilimitados",
      "Clientes e serviços ilimitados",
      "Reservas online + QR",
      "1 barbeiro / localização",
    ],
  },
  {
    name: "Pro",
    price: "9,90 €",
    subtitle: "Para crescer",
    recommended: true,
    features: [
      "Até 5 barbeiros",
      "CRM e estatísticas avançadas",
      "Campanhas e automações",
      "Fidelização e seguimentos",
    ],
  },
  {
    name: "Enterprise",
    price: "29,90 €",
    subtitle: "Para escalar",
    recommended: false,
    features: [
      "Barbeiros e localizações ilimitados",
      "Permissões e gestão global",
      "POS, stock e comissões",
      "Relatórios empresariais avançados",
    ],
  },
];

const features = [
  {
    icon: CalendarDays,
    label: "Operação",
    title: "Agenda que respeita a realidade",
    text: "Serviços, duração, profissionais, folgas, pausas, bloqueios e conflitos são considerados no fluxo de marcação.",
  },
  {
    icon: UsersRound,
    label: "Equipa",
    title: "Permissões sem confusão",
    text: "Owner, administradores e barbeiros partilham o plano da barbearia, enquanto cada membro recebe apenas o acesso autorizado.",
  },
  {
    icon: Store,
    label: "Presença",
    title: "Uma página pública para vender",
    text: "Serviços, equipa, avaliações e reservas ficam ligados numa página pública simples de partilhar.",
  },
  {
    icon: QrCode,
    label: "Aquisição",
    title: "QR pronto para o mundo real",
    text: "Cada barbearia tem um QR único para colocar no balcão, cartões, montras ou redes sociais.",
  },
  {
    icon: Gift,
    label: "Retenção",
    title: "Fidelização que dá uma razão para voltar",
    text: "Cria pontos e recompensas para transformar clientes ocasionais em clientes recorrentes.",
  },
  {
    icon: Megaphone,
    label: "Marketing",
    title: "Campanhas e automações",
    text: "Comunicação e tarefas repetitivas deixam de depender de trabalho manual todos os dias.",
  },
  {
    icon: BarChart3,
    label: "Decisão",
    title: "Estatísticas para gerir melhor",
    text: "A atividade da operação torna-se informação útil para acompanhar evolução e tomar decisões.",
  },
  {
    icon: BellRing,
    label: "Relacionamento",
    title: "Clientes acompanhados",
    text: "Marcações, lembretes, seguimentos e gestão por email mantêm o cliente ligado à barbearia.",
  },
  {
    icon: ShieldCheck,
    label: "Controlo",
    title: "Segurança no centro",
    text: "Isolamento por barbearia, permissões server-side e validações críticas protegem dados e operações.",
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">{text}</p>
    </div>
  );
}

export function SaaSHomepageV2() {
  const [selectedService, setSelectedService] = useState<ServiceName>(services[0].name);
  const [selectedSlot, setSelectedSlot] = useState<string | null>("10:00");
  const service = useMemo(() => services.find((item) => item.name === selectedService) ?? services[0], [selectedService]);
  const { isAuthenticated, loading: authLoading } = useSubscription();

  const pricingHref = isAuthenticated ? "/plans" : "/registo";
  const pricingLabel = isAuthenticated ? "Mudar para este plano" : "Criar conta para começar";

  return (
    <main className="relative mt-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300"><Sparkles className="size-3.5 text-emerald-300" />Software perfeito para as barbearias</div>
            <h1 className="mt-6 max-w-3xl text-[2.8rem] font-semibold leading-[0.97] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">A barbearia organizada para o cliente voltar.</h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-zinc-400 sm:text-lg">Reservas, agenda, equipa, clientes e crescimento no mesmo sistema. Simples para o cliente; poderoso para quem gere.</p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Criar barbearia grátis <ArrowRight className="size-4" /></Link>
              <Link href="/barbershops" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">Explorar barbearias</Link>
            </div>
            <div className="mt-6 grid gap-2 text-xs text-zinc-500 sm:flex sm:flex-wrap sm:gap-x-5">
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Plano Free disponível</span>
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Sem cartão para começar</span>
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Cliente pode reservar sem conta</span>
            </div>
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

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-18 sm:px-6 sm:pb-24 lg:grid-cols-2 lg:px-8">
        <article className="border border-white/10 bg-zinc-900/45 p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Depois da reserva</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">A relação não acaba no botão “confirmar”.</h2><div className="mt-7 space-y-3">{["O cliente consulta todas as marcações associadas ao mesmo email.","Pode cancelar dentro da janela definida pela barbearia.","Pode reagendar para horários que respeitam a operação real."].map((text) => <div key={text} className="flex gap-3 border border-white/8 bg-black/20 p-4 text-sm leading-6 text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{text}</div>)}</div><Link href="/my-bookings" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Gerir uma marcação <ArrowRight className="size-4" /></Link></article>
        <article className="border border-white/10 bg-zinc-900/45 p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Gestão</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">O plano pertence à barbearia. O acesso pertence às permissões.</h2><div className="mt-7 space-y-3">{["Todos os membros herdam as funcionalidades do plano do tenant.","Owner, admin e barbeiro podem ter acessos diferentes.","Barbeiros ligados à equipa contam corretamente para a quota do plano."].map((text) => <div key={text} className="flex gap-3 border border-white/8 bg-black/20 p-4 text-sm leading-6 text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{text}</div>)}</div><Link href="/plans" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Ver planos <ArrowRight className="size-4" /></Link></article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-18 sm:px-6 sm:pb-24 lg:px-8">
        <SectionHeading eyebrow="Planos" title="Começa simples e cresce sem trocar de sistema." text="O plano é definido pela barbearia e acompanha toda a equipa. Escolhe pela fase do negócio, não pela quantidade de logins." />
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {plans.map((plan) => <article key={plan.name} className={`relative border p-5 sm:p-6 ${plan.recommended ? "border-emerald-400/30 bg-emerald-400/[0.055]" : "border-white/10 bg-zinc-900/35"}`}>
            {plan.recommended ? <span className="absolute right-4 top-4 border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Mais escolhido</span> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{plan.subtitle}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{plan.name}</h3>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">{plan.price}<span className="text-sm font-normal text-zinc-500">{plan.name === "Free" ? "" : " / mês"}</span></p>
            {plan.name === "Pro" ? <p className="mt-2 text-xs font-semibold text-emerald-300/90">14 dias grátis para novos utilizadores.</p> : null}
            <ul className="mt-6 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{feature}</li>)}</ul>
            <Link href={pricingHref} aria-disabled={authLoading} className={`mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold ${plan.recommended ? "bg-white text-zinc-950" : "border border-white/10 bg-white/[0.04] text-white"} ${authLoading ? "pointer-events-none opacity-60" : ""}`}>
              {authLoading ? "A carregar…" : pricingLabel}<ArrowRight className="size-4" />
            </Link>
          </article>)}
        </div>
        <p className="mt-5 text-xs text-zinc-600">Os limites e funcionalidades completos estão disponíveis em <Link href="/plans" className="text-zinc-400 underline-offset-4 hover:underline">plans</Link>.</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8"><div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Pronto para começar?</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Organiza a operação antes que a operação te organize a ti.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Cria a barbearia, configura a equipa e começa a receber reservas. Os clientes podem reservar sem criar uma conta.</p></div><div className="grid gap-2 sm:flex lg:grid"><Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950">Criar barbearia grátis <ArrowRight className="size-4" /></Link><Link href="/my-bookings" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white">Gerir uma marcação</Link></div></div></div></section>
    </main>
  );
}
