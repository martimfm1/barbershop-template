import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hasActivePaidSubscription } from "@/lib/billing/plan-access";

export interface SubscriptionData {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  plan: "free" | "pro" | "enterprise";
}

interface SubscriptionQueryResult {
  subscription: SubscriptionData | null;
  plan: "free" | "pro" | "enterprise";
  isAuthenticated: boolean;
}

async function fetchSubscription(): Promise<SubscriptionQueryResult> {
  const res = await fetch("/api/stripe/subscription", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return { subscription: null, plan: "free", isAuthenticated: false };
    throw new Error("Failed to fetch subscription data.");
  }
  const json = await res.json();
  return {
    subscription: json.subscription ?? null,
    plan: json.plan ?? "free",
    isAuthenticated: true,
  };
}

export function useSubscription() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<SubscriptionQueryResult>({
    queryKey: ["user-subscription"],
    queryFn: fetchSubscription,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const isAuthenticated = data?.isAuthenticated ?? false;
  const plan = data?.plan ?? "free";

  // /api/stripe/subscription resolves the effective plan from Stripe. Keep that
  // value as the single source of truth for every billing UI consumer instead
  // of allowing a stale local subscriptions.plan value to leak into the UI.
  const subscription = data?.subscription
    ? { ...data.subscription, plan }
    : null;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || "Failed to cancel subscription."); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-subscription"] }); },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/resume", { method: "POST" });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || "Failed to resume subscription."); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-subscription"] }); },
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, successUrl, cancelUrl }: { priceId: string; successUrl?: string; cancelUrl?: string }) => {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId, successUrl, cancelUrl }) });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || "Failed to initiate checkout."); }
      const data: { url: string } = await res.json();
      if (data.url) window.location.href = data.url;
      return data;
    },
  });

  const isPro = plan === "pro" && hasActivePaidSubscription(subscription);
  const isBusiness = plan === "enterprise" && hasActivePaidSubscription(subscription);
  const isTrial = subscription?.status === "trialing";
  const loading = isLoading || cancelMutation.isPending || resumeMutation.isPending || checkoutMutation.isPending;

  return {
    subscription,
    isAuthenticated,
    plan,
    isPro,
    isBusiness,
    isTrial,
    loading,
    cancel: cancelMutation.mutateAsync,
    resume: resumeMutation.mutateAsync,
    upgrade: async () => { window.location.assign("/dashboard/billing"); },
    checkout: checkoutMutation.mutateAsync,
  };
}
