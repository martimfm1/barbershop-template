"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeProvider } from "@/components/providers/StripeProvider";

function SubscriptionPaymentForm({ onPaid, onClose }: { onPaid: () => Promise<void>; onClose: () => void }) {
  const stripe = useStripe(); const elements = useElements();
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string>();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!stripe || !elements) return;
    setLoading(true); setError(undefined);
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) { setError(result.error.message ?? "Não foi possível confirmar o pagamento."); setLoading(false); return; }
    if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") await onPaid();
    setLoading(false);
  }
  return <form onSubmit={submit} className="space-y-5"><PaymentElement options={{ layout: "tabs" }} />{error && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={loading} className="rounded-full px-4 py-2 text-xs text-zinc-400">Cancelar</button><button disabled={loading || !stripe} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">{loading && <Loader2 className="size-3.5 animate-spin" />}Confirmar subscrição</button></div></form>;
}

export function CompleteSubscriptionModal({ open, onOpenChange, clientSecret, onPaid }: { open: boolean; onOpenChange: (open: boolean) => void; clientSecret: string | null; onPaid: () => Promise<void> }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg border border-white/10 bg-zinc-900 text-zinc-100"><DialogHeader><DialogTitle>Finalizar subscrição</DialogTitle><DialogDescription>Introduz o método de pagamento para ativar o plano escolhido.</DialogDescription></DialogHeader>{clientSecret ? <StripeProvider clientSecret={clientSecret}><SubscriptionPaymentForm onClose={() => onOpenChange(false)} onPaid={onPaid} /></StripeProvider> : <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-emerald-400" /></div>}</DialogContent></Dialog>;
}
