"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckoutElementsProvider, BillingAddressElement, PaymentElement, TaxIdElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const PLAN_COPY = {
  pro: {
    name: "Barbers Pro",
    price: "9,90 € / mês",
    description: "Para barbearias que querem crescer com CRM, automações, campanhas e fidelização.",
    trial: "14 dias grátis para novos utilizadores elegíveis.",
  },
  enterprise: {
    name: "Barbers Enterprise",
    price: "A partir de 29,90 € / mês",
    description: "Para equipas maiores, várias localizações, POS, stock e gestão avançada.",
    trial: null,
  },
} as const;

type CheckoutFormProps = { plan: keyof typeof PLAN_COPY };

function CheckoutForm({ plan }: CheckoutFormProps) {
  const checkoutState = useCheckout();
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [promotionApplied, setPromotionApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const applyPromotion = async () => {
    setPromotionError(null);
    if (checkoutState.type !== "success" || !promotionCode.trim()) return;
    const response = await checkoutState.checkout.applyPromotionCode(promotionCode.trim());
    if (response.error) {
      setPromotionApplied(false);
      setPromotionError(response.error.message);
      return;
    }
    setPromotionApplied(true);
    setPromotionCode("");
  };

  const removePromotion = async () => {
    setPromotionError(null);
    if (checkoutState.type !== "success") return;
    const result = await checkoutState.checkout.removePromotionCode();
    if (result.error) {
      setPromotionError(result.error.message);
      return;
    }
    setPromotionApplied(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkoutState.type !== "success") return;
    setSubmitting(true);
    const result = await checkoutState.checkout.confirm();
    if (result.type === "error") {
      setPromotionError(result.error.message);
      setSubmitting(false);
    }
  };

  if (checkoutState.type === "loading") {
    return <div className="flex min-h-[520px] items-center justify-center text-sm text-zinc-500">A preparar o checkout seguro…</div>;
  }

  if (checkoutState.type === "error") {
    return <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-5 text-sm text-red-200">{checkoutState.error.message}</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-sm font-semibold text-white">Dados de faturação</p>
        <BillingAddressElement options={{ display: "auto" }} />
        <div className="mt-4 border-t border-white/8 pt-4">
          <TaxIdElement options={{}} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-sm font-semibold text-white">Pagamento</p>
        <PaymentElement options={{ layout: "accordion" }} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Código promocional</p>
            <p className="mt-1 text-xs text-zinc-500">Usa um Promotion Code criado no Stripe.</p>
          </div>
          {promotionApplied ? <span className="text-xs font-medium text-emerald-300">Aplicado</span> : null}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value)} placeholder="Ex.: SILENTRA20" className="min-h-11 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/40" disabled={promotionApplied} />
          {promotionApplied ? <button type="button" onClick={() => void removePromotion()} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200">Remover</button> : <button type="button" onClick={() => void applyPromotion()} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-100">Aplicar</button>}
        </div>
        {promotionError ? <p className="mt-2 text-xs text-red-300">{promotionError}</p> : null}
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs leading-5 text-zinc-500">Os dados de pagamento são processados diretamente pela Stripe. A Silentra não guarda os dados completos do cartão.</div>

      <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
        <LockKeyhole className="size-4" />
        {submitting ? "A confirmar…" : plan === "pro" ? "Começar com o Pro" : "Subscrever Enterprise"}
      </button>
    </form>
  );
}

export function CustomCheckout({ priceId, plan }: { priceId: string; plan: keyof typeof PLAN_COPY }) {
  const clientSecret = useMemo(() => fetch("/api/stripe/embedded-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId }) }).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Não foi possível iniciar o checkout.");
    if (!body.clientSecret) throw new Error("O Stripe não devolveu uma sessão de checkout válida.");
    return body.clientSecret as string;
  }), [priceId]);

  const copy = PLAN_COPY[plan];

  return (
    <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret, elementsOptions: { appearance: { theme: "night", variables: { colorPrimary: "#34d399", colorBackground: "#09090b", colorText: "#f4f4f5", colorTextSecondary: "#a1a1aa", colorDanger: "#f87171", borderRadius: "12px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" } } } }}>
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-7 lg:sticky lg:top-6 lg:h-fit">
          <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><Sparkles className="size-4" /></div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Checkout Silentra</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">{copy.name}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{copy.description}</p>
          <p className="mt-6 text-3xl font-semibold tracking-tight text-white">{copy.price}</p>
          {copy.trial ? <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-200"><Check className="mr-2 inline size-4" />{copy.trial}</div> : null}
          <div className="mt-6 space-y-3 border-t border-white/8 pt-5 text-sm text-zinc-300">
            <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />Pagamento protegido pela Stripe</p>
            <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />NIF e faturação suportados</p>
            <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />Código promocional disponível</p>
          </div>
          <Link href="/plans" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white"><ArrowLeft className="size-4" />Voltar aos planos</Link>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/8 pb-5"><div><p className="text-sm font-semibold text-white">Detalhes da subscrição</p><p className="mt-1 text-xs text-zinc-500">Preenche os dados e confirma com segurança.</p></div><span className="inline-flex items-center gap-1.5 text-xs text-zinc-500"><ShieldCheck className="size-4 text-emerald-300" />Stripe</span></div>
          <CheckoutForm plan={plan} />
        </section>
      </div>
    </CheckoutElementsProvider>
  );
}
