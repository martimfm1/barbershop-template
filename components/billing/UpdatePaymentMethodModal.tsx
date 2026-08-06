"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircle, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeProvider } from "@/components/providers/StripeProvider";

function SetupForm({ onDone, onClose }: { onDone: (paymentMethodId: string) => Promise<void>; onClose: () => void }) {
  const stripe = useStripe(); const elements = useElements();
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string>();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!stripe || !elements) return;
    setLoading(true); setError(undefined);
    const result = await stripe.confirmSetup({ elements, redirect: "if_required" });
    if (result.error) { setError(result.error.message ?? "Não foi possível guardar o cartão."); setLoading(false); return; }
    try {
      if (result.setupIntent?.payment_method) await onDone(typeof result.setupIntent.payment_method === "string" ? result.setupIntent.payment_method : result.setupIntent.payment_method.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível definir este cartão como método principal.");
      setLoading(false);
      return;
    }
    setLoading(false);
  }
  return <form onSubmit={submit} className="space-y-6" aria-busy={loading}>
    <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5">
      <PaymentElement options={{ layout: "tabs" }} />
    </div>
    <p className="flex items-center gap-2 text-xs leading-5 text-zinc-500"><ShieldCheck className="size-4 shrink-0 text-emerald-400" />Os dados do cartão são tratados diretamente pela Stripe e nunca passam pelos nossos servidores.</p>
    <div aria-live="polite" aria-atomic="true">{loading && <p className="flex items-center gap-2 text-xs text-emerald-300"><Loader2 className="size-3.5 animate-spin" />A guardar o método de pagamento…</p>}{error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}</div>
    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={loading} className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50">Cancelar</button><button type="submit" disabled={loading || !stripe} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50">{loading && <Loader2 className="size-4 animate-spin" />}Guardar cartão</button></div>
  </form>;
}

export function UpdatePaymentMethodModal({ open, onOpenChange, clientSecret, onComplete }: { open: boolean; onOpenChange: (open: boolean) => void; clientSecret: string | null; onComplete: (paymentMethodId: string) => Promise<void> }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] max-w-2xl gap-5 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 p-6 text-zinc-100 sm:p-8"><DialogHeader className="pr-9"><div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><CreditCard className="size-5" /></div><DialogTitle className="text-xl">Atualizar método de pagamento</DialogTitle><DialogDescription className="max-w-xl leading-6">Adiciona um cartão para futuras cobranças. Não será efetuado qualquer pagamento neste momento.</DialogDescription></DialogHeader>{clientSecret ? <StripeProvider clientSecret={clientSecret}><SetupForm onClose={() => onOpenChange(false)} onDone={onComplete} /></StripeProvider> : <div className="flex flex-col items-center justify-center gap-3 py-14" role="status" aria-live="polite"><Loader2 className="size-6 animate-spin text-emerald-400" /><span className="text-sm text-zinc-400">A preparar formulário seguro…</span></div>}</DialogContent></Dialog>;
}
