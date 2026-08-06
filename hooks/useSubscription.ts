import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  isAuthenticated: boolean;
}

async function fetchSubscription(): Promise<SubscriptionQueryResult> {
  const res = await fetch("/api/stripe/subscription");
  if (!res.ok) {
    if (res.status === 401) return { subscription: null, isAuthenticated: false };
    throw new Error("Failed to fetch subscription data.");
  }
  const json = await res.json();
  return { subscription: json.subscription ?? null, isAuthenticated: true };
}

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SubscriptionQueryResult>({
    queryKey: ["user-subscription"],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
  const subscription = data?.subscription ?? null;
  const isAuthenticated = data?.isAuthenticated ?? false;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel subscription.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/resume", { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to resume subscription.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({
      priceId,
      successUrl,
      cancelUrl,
    }: {
      priceId: string;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to initiate checkout.");
      }

      const data: { url: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
      return data;
    },
  });

  const plan = subscription?.stripe_price_id ?? "free";
  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const isBusiness = subscription?.plan === "enterprise" && subscription?.status === "active";
  const isTrial = subscription?.status === "trialing";

  const loading =
    isLoading ||
    cancelMutation.isPending ||
    resumeMutation.isPending ||
    checkoutMutation.isPending;

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
    upgrade: async () => {
      window.location.assign("/dashboard/billing");
    },
    checkout: checkoutMutation.mutateAsync,
  };
}
