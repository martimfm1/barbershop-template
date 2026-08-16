import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hasActivePaidSubscription } from "@/lib/billing/plan-access";

export interface SubscriptionData {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";
  cancel_at_period_end: boolean;
  current_period_start?: string | null;
  current_period_end: string | null;
  plan: "free" | "pro" | "enterprise";
}

interface SubscriptionQueryResult {
  subscription: SubscriptionData | null;
  plan: "free" | "pro" | "enterprise";
  planSource: "free" | "admin" | "subscription_override" | "stripe";
  isAuthenticated: boolean;
}

async function fetchSubscription(): Promise<SubscriptionQueryResult> {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const checkoutSessionId = searchParams?.get("session_id")?.trim();
  const endpoint = checkoutSessionId
    ? `/api/stripe/subscription?session_id=${encodeURIComponent(checkoutSessionId)}`
    : "/api/stripe/subscription";

  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return { subscription: null, plan: "free", planSource: "free", isAuthenticated: false };
    throw new Error("Failed to fetch subscription data.");
  }
  const json = await res.json();
  return {
    subscription: json.subscription ?? null,
    plan: json.plan ?? "free",
    planSource: json.planSource ?? "free",
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
  const planSource = data?.planSource ?? "free";
  const subscription = data?.subscription ? { ...data.subscription, plan } : null;

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

  const isAdministrativePlan = planSource === "admin";
  const isPro = plan === "pro" && (isAdministrativePlan || hasActivePaidSubscription(subscription));
  const isBusiness = plan === "enterprise" && (isAdministrativePlan || hasActivePaidSubscription(subscription));
  const isTrial = subscription?.status === "trialing";
  const loading = isLoading || cancelMutation.isPending || resumeMutation.isPending;

  return {
    subscription,
    isAuthenticated,
    plan,
    planSource,
    isAdministrativePlan,
    isPro,
    isBusiness,
    isTrial,
    loading,
    cancel: cancelMutation.mutateAsync,
    resume: resumeMutation.mutateAsync,
    upgrade: async () => { window.location.assign("/dashboard/billing"); },
    checkout: async ({ priceId, plan: requestedPlan = "pro" }: { priceId: string; plan?: "pro" | "enterprise" }) => {
      window.location.assign(`/checkout?priceId=${encodeURIComponent(priceId)}&plan=${requestedPlan}`);
    },
  };
}
