"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Gift,
  KeyRound,
  Megaphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

const services = [
  { name: "Corte + Barba", duration: "45 min", price: "20 €" },
  { name: "Corte de cabelo", duration: "30 min", price: "15 €" },
  { name: "Barba", duration: "20 min", price: "10 €" },
];

const slots = ["09:00", "09:30", "10:00", "11:00", "11:30", "13:30"];

const featureCards = [
  { icon: CalendarDays, title: "Agenda e marcações", text: "Disponibilidade, duração dos serviços, profissionais, folgas e bloqueios tratados no próprio fluxo de reserva." },
  { icon: UsersRound, title: "Equipa e permissões", text: "Cada membro usa o plano da barbearia, com permissões individuais para controlar o que pode gerir." },
  { icon: QrCode, title: "QR e página pública", text: "Cada barbearia pode partilhar uma entrada direta para a página pública e para as reservas." },
  { icon: Gift, title: "Fidelização", text: "Cria regras de pontos e recompensas para aumentar a frequência e dar um motivo para voltar." },
  { icon: Megaphone, title: "Campanhas e automações", text: "Comunicação centralizada com campanhas e automações para reduzir tarefas repetitivas." },
  { icon: BarChart3, title: "Estatísticas", text: "Transforma a atividade da operação em informação útil para decisões do dia a dia." },
] as const;

const workflow = [
  { number: "01", title: "Configura a barbearia", text: "Serviços, horários, profissionais, identidade e regras de marcação." },
  { number: "02", title: "Partilha o teu link", text: "Página pública, QR code e canais onde os teus clientes já estão." },
  { number: "03", title: "Centraliza a operação", text: "Marcações, equipa, clientes, campanhas e crescimento no mesmo espaço." },
] as const;

const plans = [
  { name: "Free", price: "0 €", note: "Para começar", features: ["Agendamentos ilimitados", "Clientes e serviços ilimitados", "Reservas online + QR", "1 barbeiro / localização"], highlighted: false },
  { name: "Pro", price: "9,90 €", note: "Para crescer", features: ["Até 5 barbeiros", "CRM e estatísticas avançadas", "Campanhas e automações", "Fidelização e seguimentos"], highlighted: true },
  { name: "Enterprise", price: "A partir de 29,90 €", note: "Para escalar", features: ["Barbeiros e localizações ilimitados", "Permissões e gestão global", "POS, stock e comissões", "Relatórios empresariais avançados"], highlighted: false },
] as const;

export function SaaSHomepage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative pt-8 sm:pt-12 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              <Sparkles className="size-3.5 text-emerald-300" />
              Software para barbearias
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-[5.8rem] lg:leading-[0.95]">
              Menos gestão.
              <span className="block text-zinc-400">Mais tempo para o cliente.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              O Silentra junta reservas online, agenda, equipa, clientes e crescimento numa operação simples o suficiente para uma barbearia pequena e preparada para crescer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Começar grátis
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/barbershops" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
                Explorar barbearias
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Sem cartão para começar</span>
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Plano Free disponível</span>
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />Clientes sem conta</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-12 bg-emerald-400/[0.04] blur-3xl" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative border border-white/10 bg-zinc-900/75 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-4">
              <div className="border border-white/10 bg-black/30 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Demo de reserva</p>
                    <p className="mt-1 text-base font-semibold text-white">Barbearia Silentra</p>
                  </div>
                  <span className="inline-flex items-center gap-2 border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] text-emerald-200"><CircleCheck className="size-3.5" />Disponível</span>
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between"><span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Serviço</span><span className="text-xs text-zinc-500">Duração + preço</span></div>
                    <div className="grid gap-2">
                      {services.map((service, index) => (
                        <div key={service.name} className={`flex items-center justify-between border px-3.5 py-3 ${index === 0 ? "border-white/20 bg-white/[0.06]" : "border-white/8 bg-white/[0.025]"}`}>
                          <div><p className="text-sm font-medium text-zinc-100">{service.name}</p><p className="mt-0.5 text-xs text-zinc-500">{service.duration}</p></div>
                          <span className="text-sm font-semibold text-zinc-200">{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between"><span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Horários</span><span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Clock3 className="size-3.5" />Hoje</span></div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {slots.map((slot, index) => <div key={slot} className={`flex min-h-10 items-center justify-center border text-xs font-medium ${index === 2 ? "border-emerald-400/25 bg-emerald-400/[0.09] text-emerald-200" : "border-white/8 bg-white/[0.025] text-zinc-300"}`}>{slot}</div>)}
                    </div>
                  </div>

                  <div className="grid gap-2 border-t border-white/8 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><p className="text-xs text-zinc-500">Passo seguinte</p><p className="mt-0.5 text-sm text-zinc-200">Introduzir dados e confirmar</p></div>
                    <div className="inline-flex min-h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950"><KeyRound className="size-4" />Reservar</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 p-1 pt-3 sm:grid-cols-3">
                {["Serviço", "Horário", "Confirmação"].map((item, index) => <div key={item} className="flex items-center gap-2 border border-white/8 bg-white/[0.02] px-3 py-2.5 text-xs text-zinc-400"><span className="flex size-5 items-center justify-center border border-white/10 text-[10px] text-zinc-500">{index + 1}</span>{item}</div>)}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mt-20 border-y border-white/8 py-8 sm:mt-28">
        <div className="grid gap-8 sm:grid-cols-3">
          <div><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Para o cliente</p><p className="mt-2 text-sm text-zinc-300">Reserva online, gestão de marcações por email e acesso rápido à página da barbearia.</p></div>
          <div><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Para a equipa</p><p className="mt-2 text-sm text-zinc-300">Agenda, profissionais, clientes e permissões alinhados com a barbearia.</p></div>
          <div><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Para o negócio</p><p className="mt-2 text-sm text-zinc-300">Fidelização, campanhas, automações e estatísticas para transformar operação em crescimento.</p></div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Tudo ligado</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Uma operação. Um lugar para gerir tudo.</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">Em vez de juntar ferramentas desconectadas, o Silentra organiza o fluxo inteiro à volta da barbearia.</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, text }, index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.45, delay: index * 0.03 }} className="group border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] sm:p-6">
              <div className="flex size-10 items-center justify-center border border-white/10 bg-white/[0.04] text-emerald-200"><Icon className="size-4" /></div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-300">Ver como funciona <ChevronRight className="size-3.5" /></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-10 border border-white/10 bg-zinc-900/50 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Fluxo recomendado</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Começa simples. Expande só quando fizer sentido.</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-400">A experiência deve parecer fácil no primeiro dia e continuar útil quando a equipa crescer.</p>
          <Link href="/registo" className="mt-7 inline-flex min-h-11 items-center gap-2 bg-white px-4 text-sm font-semibold text-zinc-950">Criar barbearia <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-3">
          {workflow.map((item) => (
            <div key={item.number} className="grid gap-4 border border-white/8 bg-black/20 p-5 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="text-xs font-semibold tracking-[0.2em] text-emerald-300">{item.number}</div>
              <div><h3 className="text-base font-semibold text-white">{item.title}</h3><p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-400">{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Planos</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Começa sem risco. Cresce sem trocar de sistema.</h2><p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">O plano pertence à barbearia e as funcionalidades disponíveis acompanham toda a equipa desse tenant.</p></div>
          <Link href="/plans" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-white">Ver todos os detalhes <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative border p-6 sm:p-7 ${plan.highlighted ? "border-emerald-400/25 bg-emerald-400/[0.055]" : "border-white/10 bg-white/[0.025]"}`}>
              {plan.highlighted && <div className="absolute right-4 top-4 border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Recomendado</div>}
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{plan.note}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Barbers {plan.name}</h3>
              <div className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white">{plan.price}</div>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => <div key={feature} className="flex gap-2.5 text-sm text-zinc-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{feature}</div>)}
              </div>
              <Link href={plan.name === "Free" ? "/registo" : "/plans"} className={`mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold ${plan.highlighted ? "bg-white text-zinc-950" : "border border-white/10 bg-white/[0.04] text-white"}`}>{plan.name === "Free" ? "Começar grátis" : "Ver plano"}<ArrowRight className="size-4" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border border-white/10 bg-white/[0.04] p-6 sm:p-10 lg:p-14">
        <div className="absolute right-0 top-0 size-72 translate-x-1/3 -translate-y-1/3 bg-emerald-300/[0.08] blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Próximo passo</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Transforma a tua barbearia numa operação mais simples.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Começa com reservas e agenda. Depois adiciona equipa, fidelização, campanhas e automações à medida que precisares.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Link href="/registo" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950">Começar grátis <ArrowRight className="size-4" /></Link>
            <Link href="/my-bookings" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-black/20 px-5 text-sm font-semibold text-white">Gerir uma marcação</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 py-12 text-xs text-zinc-500 sm:grid-cols-3">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-400" /><span>Permissões e ações críticas são validadas no servidor.</span></div>
        <div className="flex items-start gap-3"><BellRing className="mt-0.5 size-4 shrink-0 text-zinc-400" /><span>O cliente pode gerir marcações por email sem criar uma conta.</span></div>
        <div className="flex items-start gap-3"><Store className="mt-0.5 size-4 shrink-0 text-zinc-400" /><span>Cada barbearia tem o seu próprio contexto, plano e equipa.</span></div>
      </section>
    </div>
  );
}
