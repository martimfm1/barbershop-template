"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  CreditCard,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export function SubscriptionManagementCard() {
  const {
    subscription,
    planSource,
    isAdministrativePlan,
    isPro,
    isBusiness,
    isTrial,
    loading,
    cancel,
    resume,
    upgrade,
  } = useSubscription();

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const formatPeriodEnd = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPlanName = () => {
    if (isBusiness) return "Business";
    if (isPro) return "Pro";
    return "Gratuito";
  };

  const handlePortalRedirect = async () => {
    try {
      await upgrade();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir o portal de faturacao.",
      );
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      setIsConfirmingCancel(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async () => {
    try {
      await resume();
    } catch (e) {
      console.error(e);
    }
  };

  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id);
  const displaySource = isAdministrativePlan
    ? "Plano atribuído pela administração da Silentra"
    : planSource === "subscription_override"
      ? "Plano administrativo da subscrição"
      : hasStripeSubscription
        ? "Subscrição Stripe"
        : "Plano gratuito";

  return (
    <div className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="size-3.5" />
                Plano {getPlanName()}
              </span>

              {isAdministrativePlan && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs text-sky-300">
                  <ShieldCheck className="size-3" /> Atribuído pela Silentra
                </span>
              )}

              {isTrial && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400">
                  <Zap className="size-3" /> Período de Teste
                </span>
              )}

              {hasStripeSubscription && subscription?.cancel_at_period_end && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400">
                  <AlertTriangle className="size-3" /> Cancela em breve
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-50">
              Gestão da Subscrição
            </h2>
            <p className="text-xs text-zinc-400">
              {isAdministrativePlan
                ? "Este plano foi atribuído pela administração da Silentra e aplica-se a todos os membros da barbearia."
                : subscription?.cancel_at_period_end
                ? `A tua subscrição será cancelada a ${formatPeriodEnd(subscription.current_period_end)}.`
                : subscription?.current_period_end
                ? `Próxima renovação a ${formatPeriodEnd(subscription.current_period_end)}.`
                : "Estás a utilizar a versão gratuita sem cobranças associadas."}
            </p>
            <p className="text-[11px] text-zinc-600">Origem: {displaySource}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasStripeSubscription ? (
              <button
                type="button"
                onClick={handlePortalRedirect}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-medium text-zinc-100 transition-all hover:bg-white/20 hover:border-white/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="size-3.5" />
                    <span>Gerir faturação</span>
                  </>
                )}
              </button>
            ) : (
              <a
                href="#prices"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-medium text-zinc-950 transition-all hover:bg-emerald-400"
              >
                <Zap className="size-3.5" />
                <span>Ver planos</span>
              </a>
            )}
          </div>
        </div>

        {hasStripeSubscription && (
          <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CreditCard className="size-4 text-emerald-400" />
                <span>Método de Pagamento</span>
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">
                Gerido com segurança via Stripe Portal
              </p>
              <button
                type="button"
                onClick={handlePortalRedirect}
                disabled={loading}
                className="mt-3 text-xs text-emerald-400 hover:underline"
              >
                Atualizar cartão →
              </button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <FileText className="size-4 text-emerald-400" />
                <span>Faturas e Recibos</span>
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">
                Histórico completo para download
              </p>
              <button
                type="button"
                onClick={handlePortalRedirect}
                disabled={loading}
                className="mt-3 text-xs text-emerald-400 hover:underline"
              >
                Descarregar faturas →
              </button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <RefreshCw className="size-4 text-emerald-400" />
                <span>Alteração de Plano</span>
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">
                Upgrade, downgrade ou cancelamento
              </p>
              <button
                type="button"
                onClick={handlePortalRedirect}
                disabled={loading}
                className="mt-3 text-xs text-emerald-400 hover:underline"
              >
                Alterar plano →
              </button>
            </div>
          </div>
        )}

        {hasStripeSubscription && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-400">
              {subscription?.cancel_at_period_end ? (
                <span className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="size-4" />
                  Podes reativar a subscrição a qualquer momento antes do término do período.
                </span>
              ) : (
                <span>Preferes gerir diretamente no painel interno?</span>
              )}
            </div>

            <div>
              {subscription?.cancel_at_period_end ? (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Retomar Subscrição
                </button>
              ) : isConfirmingCancel ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingCancel(false)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="size-3 animate-spin" />}
                    Confirmar Cancelamento
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(true)}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Cancelar subscrição
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
