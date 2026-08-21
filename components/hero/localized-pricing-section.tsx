"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Plan = {
  name: string;
  price: string;
  description: string;
  featured?: boolean;
  features: string[];
};

export function LocalizedPricingSection() {
  const { locale } = useLanguage();
  const pt = locale === "pt";

  const plans: Plan[] = pt
    ? [
        {
          name: "Barbers Free",
          price: "0 €",
          description: "O essencial para começar a receber reservas e organizar a operação.",
          features: [
            "Agendamentos ilimitados",
            "Clientes e serviços ilimitados",
            "Página pública da barbearia",
            "Reservas online",
            "Código QR da barbearia",
            "Agenda e disponibilidade",
            "Gestão básica de equipa",
          ],
        },
        {
          name: "Barbers Pro",
          price: "9,90 € / mês",
          description: "Para barbearias que querem crescer, fidelizar clientes e automatizar o dia a dia.",
          featured: true,
          features: [
            "Tudo do Free",
            "Até 5 barbeiros",
            "CRM e gestão de clientes",
            "Estatísticas avançadas",
            "Fidelização com pontos e recompensas",
            "Campanhas e automações",
            "Mensagens e emails automáticos",
            "Aniversários automáticos",
            "Seguimentos automáticos",
          ],
        },
        {
          name: "Barbers Enterprise",
          price: "29,99 € / mês",
          description: "Para operações maiores, várias localizações e controlo operacional avançado.",
          features: [
            "Tudo do Pro",
            "Barbeiros ilimitados",
            "Localizações ilimitadas",
            "POS, stock e comissões",
            "Permissões e gestão global",
            "Relatórios empresariais avançados",
            "Operação multi-localização",
            "Controlo centralizado",
          ],
        },
      ]
    : [
        {
          name: "Barbers Free",
          price: "€0",
          description: "Everything you need to start taking bookings and organize your operation.",
          features: [
            "Unlimited bookings",
            "Unlimited customers and services",
            "Public barbershop page",
            "Online bookings",
            "Barbershop QR code",
            "Schedule and availability",
            "Basic team management",
          ],
        },
        {
          name: "Barbers Pro",
          price: "€9.90 / month",
          description: "For barbershops ready to grow, retain customers and automate daily operations.",
          featured: true,
          features: [
            "Everything in Free",
            "Up to 5 barbers",
            "CRM and customer management",
            "Advanced analytics",
            "Points and rewards loyalty",
            "Campaigns and automations",
            "Automated messages and emails",
            "Birthday automations",
            "Automated follow-ups",
          ],
        },
        {
          name: "Barbers Enterprise",
          price: "€29.99 / month",
          description: "For larger operations, multiple locations and advanced operational control.",
          features: [
            "Everything in Pro",
            "Unlimited barbers",
            "Unlimited locations",
            "POS, stock and commissions",
            "Global permissions and management",
            "Advanced business reports",
            "Multi-location operations",
            "Centralized control",
          ],
        },
      ];

  const eyebrow = pt ? "Planos" : "Plans";
  const title = pt ? "Escolhe o plano certo para a tua operação." : "Choose the plan that fits your operation.";
  const subtitle = pt
    ? "Começa grátis. Faz upgrade quando a tua barbearia precisar de mais controlo, automação e escala."
    : "Start free. Upgrade when your barbershop needs more control, automation and scale.";
  const trial = pt ? "1 mês de Pro com TRIALPRO para novos utilizadores elegíveis" : "1 month of Pro with TRIALPRO for eligible new users";
  const compare = pt ? "Comparar planos em detalhe" : "Compare plans in detail";
  const cta = pt ? "Começar grátis" : "Start for free";
  const included = pt ? "Incluído" : "Included";

  return (
    <section id="planos" className="border-y border-white/8 bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">{subtitle}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-200">
            <Sparkles className="size-3.5" />{trial}
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex h-full flex-col rounded-2xl border p-6 transition ${plan.featured ? "border-emerald-400/30 bg-emerald-400/[0.045] shadow-[0_30px_90px_rgba(16,185,129,0.08)]" : "border-white/10 bg-white/[0.025]"}`}>
              {plan.featured && <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200"><Crown className="size-3" />{pt ? "Mais escolhido" : "Most popular"}</div>}
              <div>
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{plan.price}</p>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">{plan.description}</p>
              </div>
              <ul className="mt-6 flex-1 space-y-3 border-t border-white/8 pt-6">
                {plan.features.map((feature, index) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <Check className={`mt-0.5 size-4 shrink-0 ${index === 0 && plan.featured ? "text-emerald-300" : "text-zinc-500"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/registo" className={`mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${plan.featured ? "bg-white text-zinc-950 hover:bg-zinc-100" : "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.07]"}`}>
                {cta}<ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">{pt ? "Para começar" : "Start simple"}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{pt ? "O Free cobre a operação essencial sem cartão e sem obrigar a upgrade." : "Free covers the essential operation with no card and no forced upgrade."}</p>
          </div>
          <Link href="/plans" className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.03]">
            <p className="flex items-center justify-between text-sm font-semibold text-white">{compare}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{pt ? "Vê limites, funcionalidades e detalhes de cada nível antes do checkout." : "See limits, features and full plan details before checkout."}</p>
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">{included}: {pt ? "preços mensais apresentados para comparação. O checkout mostra sempre o preço configurado na Stripe." : "monthly pricing shown for comparison. Checkout always uses the price configured in Stripe."}</p>
      </div>
    </section>
  );
}
