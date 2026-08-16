"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionData } from "@/hooks/useSubscription";

export interface BillingInvoice { id: string; amount: number; currency: string; status: string | null; plan: string; date: string; invoice_pdf: string | null; }
export interface BillingPaymentMethod { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean; }
export interface BillingPrice { id: string; plan: "pro" | "enterprise" | null; name: string; unitAmount: number; currency: string; interval: "month" | "year" | null; }
export interface SubscriptionChangeResult { subscriptionId: string; clientSecret: string | null; action: "created" | "changed"; }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível processar o pedido de faturação.");
  return body as T;
}

export function useBillingPortal(subscription: SubscriptionData | null) {
  const queryClient = useQueryClient();
  const enabled = Boolean(subscription?.stripe_customer_id);
  const invoicesQuery = useQuery({ queryKey: ["billing-invoices"], enabled, queryFn: () => request<{ invoices: BillingInvoice[] }>("/api/stripe/invoices").then(({ invoices }) => invoices), refetchOnMount: "always", refetchOnWindowFocus: "always", refetchInterval: enabled ? 15_000 : false, refetchIntervalInBackground: false });
  const methodsQuery = useQuery({ queryKey: ["billing-payment-methods"], enabled, queryFn: () => request<{ paymentMethods: BillingPaymentMethod[] }>("/api/stripe/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(({ paymentMethods }) => paymentMethods) });
  const pricesQuery = useQuery({ queryKey: ["billing-prices"], queryFn: () => request<{ data: BillingPrice[] }>("/api/stripe/prices").then(({ data }) => data), staleTime: 1000 * 60 * 30 });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["billing-payment-methods"] });
  const createSetupIntent = useMutation({ mutationFn: () => request<{ clientSecret: string }>("/api/stripe/setup-intent", { method: "POST" }) });
  const createSubscription = useMutation({
    mutationFn: async (priceId: string): Promise<SubscriptionChangeResult> => {
      const selectedPrice = pricesQuery.data?.find((price) => price.id === priceId);
      const plan = selectedPrice?.plan === "enterprise" ? "enterprise" : "pro";
      window.location.assign(`/checkout?priceId=${encodeURIComponent(priceId)}&plan=${plan}`);
      return { subscriptionId: "pending", clientSecret: null, action: "created" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });
  const paymentMethod = useMutation({ mutationFn: ({ action, paymentMethodId }: { action: "set_default" | "remove"; paymentMethodId: string }) => request("/api/stripe/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, paymentMethodId }) }), onSuccess: invalidate });
  const changePlan = useMutation({
    mutationFn: (newPriceId: string) => request("/api/stripe/update-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPriceId }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-subscription"] }); queryClient.invalidateQueries({ queryKey: ["billing-invoices"] }); },
  });

  return {
    invoices: invoicesQuery.data ?? [], paymentMethods: methodsQuery.data ?? [], prices: pricesQuery.data ?? [], invoicesError: invoicesQuery.error, paymentMethodsError: methodsQuery.error,
    createSetupIntent: createSetupIntent.mutateAsync, createSubscription: createSubscription.mutateAsync, changePlan: changePlan.mutateAsync,
    setDefaultPaymentMethod: (paymentMethodId: string) => paymentMethod.mutateAsync({ action: "set_default", paymentMethodId }),
    removePaymentMethod: (paymentMethodId: string) => paymentMethod.mutateAsync({ action: "remove", paymentMethodId }), refreshPaymentMethods: invalidate,
    refreshInvoices: () => queryClient.invalidateQueries({ queryKey: ["billing-invoices"] }),
    loading: invoicesQuery.isLoading || methodsQuery.isLoading || createSetupIntent.isPending || createSubscription.isPending || paymentMethod.isPending || changePlan.isPending,
    pricesLoading: pricesQuery.isLoading, isChangingPlan: changePlan.isPending || createSubscription.isPending,
  };
}
