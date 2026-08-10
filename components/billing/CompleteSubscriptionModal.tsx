"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeProvider } from "@/components/providers/StripeProvider";

function SubscriptionPaymentForm({ onPaid, onClose }: { onPaid: () => Promise<void>; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(undefined);

    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) {
      setError(result.error.message ?? "Não foi possível confirmar o pagamento.");
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") {
      await onPaid();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col gap-5">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 p-3 sm:p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-5 text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="min-h-11 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {loading ? "A processar…" : "Confirmar subscrição"}
        </button>
      </div>
    </form>
  );
}

export function CompleteSubscriptionModal({
  open,
  onOpenChange,
  clientSecret,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string | null;
  onPaid: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto border border-white/10 bg-zinc-900 p-4 text-zinc-100 sm:max-w-lg sm:rounded-2xl sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl sm:text-2xl">Finalizar subscrição</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-zinc-400">
            Introduz o método de pagamento para ativar o plano escolhido. O pagamento é processado de forma segura pela Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5 text-xs text-zinc-400">
          <ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>Os dados do cartão são introduzidos diretamente no formulário seguro da Stripe.</span>
        </div>

        {clientSecret ? (
          <StripeProvider clientSecret={clientSecret}>
            <SubscriptionPaymentForm onClose={() => onOpenChange(false)} onPaid={onPaid} />
          </StripeProvider>
        ) : (
          <div className="flex min-h-48 items-center justify-center" aria-label="A carregar pagamento" aria-live="polite">
            <Loader2 className="size-6 animate-spin text-emerald-400" aria-hidden="true" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
