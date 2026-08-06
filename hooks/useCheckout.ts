import { useMutation } from "@tanstack/react-query";

export interface UseCheckoutParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function useCheckout() {
  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, successUrl, cancelUrl }: UseCheckoutParams) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session.");
      }

      const data: { url: string } = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }

      return data;
    },
  });

  return {
    checkout: checkoutMutation.mutateAsync,
    loading: checkoutMutation.isPending,
    error: checkoutMutation.error ? (checkoutMutation.error as Error).message : null,
  };
}