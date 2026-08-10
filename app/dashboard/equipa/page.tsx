"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { Professional } from "@/types";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useProfessionals } from "@/app/state/_hooks/dashboard/useProfessionals";
import { ProfessionalsListCard } from "@/app/dashboard/_components/cards/ProfessionalsListCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { PLAN_NAMES } from "@/lib/billing/plan-features";

export default function EquipaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const { plan, loading: isLoadingPlan } = useFeatureAccess();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showAddProfessionalForm, setShowAddProfessionalForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const isFreePlan = plan === "free";
  const freeLimitReached = isFreePlan && professionals.length >= 1;

  const fetchProfessionals = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try {
      const res = await professionalService.getAll(barbershopId);
      if (res.error) throw res.error;
      setProfessionals(res.data ?? []);
    } catch (error) {
      console.error("[Equipa Sync Error]:", error);
      toast.error("Não foi possível carregar a equipa. Tenta novamente.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (!isLoadingBarbershop && barbershopId) queueMicrotask(() => void fetchProfessionals());
  }, [barbershopId, fetchProfessionals, isLoadingBarbershop]);

  const {
    loadingProfessionals,
    newProfessionalName,
    setNewProfessionalName,
    newProfessionalCommission,
    setNewProfessionalCommission,
    editingProfessional,
    setEditingProfessional,
    handleCreateProfessional,
    handleUpdateProfessional,
    handleDeleteProfessional,
  } = useProfessionals(barbershopId, fetchProfessionals, isFreePlan);

  if (isLoadingPlan) {
    return <main className="min-h-screen bg-zinc-950" />;
  }

  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="dashboard-page-header flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2 text-purple-400"><Briefcase className="size-5" aria-hidden="true" /></div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">Equipa</h1>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400 sm:text-sm">A equipa está disponível em todos os planos. No plano {PLAN_NAMES.free}, podes começar com um barbeiro e 100% de comissão.</p>
          </div>
          <Link href="/dashboard" className="w-full sm:w-auto"><Button variant="ghost" className="min-h-[44px] w-full border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 sm:w-auto"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar</Button></Link>
        </header>

        {isFreePlan && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 sm:p-5" aria-label="Limites do plano gratuito">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Plano gratuito</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">1 barbeiro · comissão fixa de 100%. Para adicionar mais profissionais ou definir comissões diferentes, passa para um plano superior.</p>
              </div>
              {freeLimitReached && <Button asChild variant="outline" className="shrink-0 border-white/10"><Link href="/plans">Ver planos</Link></Button>}
            </div>
          </section>
        )}

        {loadingInitial ? (
          <div role="status" aria-label="A carregar equipa" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]" />)}</div>
        ) : (
          <ProfessionalsListCard
            professionalsCount={professionals.length}
            professionals={professionals}
            showAddProfessionalForm={showAddProfessionalForm}
            setShowAddProfessionalForm={setShowAddProfessionalForm}
            newProfessionalData={{ name: newProfessionalName, commission_percentage: isFreePlan ? 100 : newProfessionalCommission }}
            setNewProfessionalData={(value) => {
              const nextValue = typeof value === "function" ? value({ name: newProfessionalName, commission_percentage: newProfessionalCommission }) : value;
              setNewProfessionalName(nextValue.name);
              setNewProfessionalCommission(isFreePlan ? 100 : (nextValue.commission_percentage ?? 0));
            }}
            handleCreateProfessional={handleCreateProfessional}
            setEditingProfessional={setEditingProfessional}
            handleDeleteProfessional={handleDeleteProfessional}
            loading={loadingProfessionals}
            isFreePlan={isFreePlan}
            freeLimitReached={freeLimitReached}
          />
        )}

        <Dialog open={!!editingProfessional} onOpenChange={(open) => !open && setEditingProfessional(null)}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Editar barbeiro</DialogTitle></DialogHeader>
            {editingProfessional && <form onSubmit={handleUpdateProfessional} className="grid gap-4 py-4">
              <div className="grid gap-2"><label htmlFor="edit-professional-name" className="text-xs text-zinc-400">Nome</label><input id="edit-professional-name" required className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50" value={editingProfessional.name} onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })} /></div>
              <div className="grid gap-2"><label htmlFor="edit-professional-commission" className="text-xs text-zinc-400">Comissão (%)</label><input id="edit-professional-commission" required type="number" min="0" max="100" readOnly={isFreePlan} className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50 disabled:opacity-60" value={isFreePlan ? 100 : (editingProfessional.commission_percentage ?? 0)} onChange={(e) => !isFreePlan && setEditingProfessional({ ...editingProfessional, commission_percentage: Number(e.target.value) })} />{isFreePlan && <p className="text-xs text-zinc-500">No plano gratuito, a comissão é fixa em 100%.</p>}</div>
              <DialogFooter><Button type="submit" disabled={loadingProfessionals} className="min-h-11 w-full bg-purple-600 text-white hover:bg-purple-500">{loadingProfessionals ? <Spinner className="size-4" /> : "Guardar alterações"}</Button></DialogFooter>
            </form>}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
