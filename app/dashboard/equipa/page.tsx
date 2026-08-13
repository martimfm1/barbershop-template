"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import { Professional } from "@/types";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useProfessionals } from "@/app/state/_hooks/dashboard/useProfessionals";
import { ProfessionalsListCard } from "@/app/dashboard/_components/cards/ProfessionalsListCard";
import { InviteCodeCard } from "@/app/dashboard/_components/team/InviteCodeCard";
import { TeamMembersManager } from "@/app/dashboard/_components/team/TeamMembersManager";
import { ManagementPageHeader } from "@/app/dashboard/_components/shared/ManagementPageHeader";
import { Spinner } from "@/components/ui/spinner";
import { Briefcase, UsersRound, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EquipaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const { plan, loading: isLoadingPlan } = useFeatureAccess();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showAddProfessionalForm, setShowAddProfessionalForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [activeTab, setActiveTab] = useState<"professionals" | "members" | "invite">("professionals");
  const isFreePlan = plan === "free";
  const freeLimitReached = isFreePlan && professionals.length >= 1;

  const fetchProfessionals = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try { const res = await professionalService.getAll(barbershopId); if (res.error) throw res.error; setProfessionals(res.data ?? []); }
    catch (error) { console.error("[Equipa Sync Error]:", error); toast.error("Não foi possível carregar a equipa. Tenta novamente."); }
    finally { setLoadingInitial(false); }
  }, [barbershopId]);

  useEffect(() => { if (!isLoadingBarbershop && barbershopId) queueMicrotask(() => void fetchProfessionals()); }, [barbershopId, fetchProfessionals, isLoadingBarbershop]);
  const { loadingProfessionals, newProfessionalName, setNewProfessionalName, newProfessionalCommission, setNewProfessionalCommission, editingProfessional, setEditingProfessional, handleCreateProfessional, handleUpdateProfessional, handleDeleteProfessional } = useProfessionals(barbershopId, fetchProfessionals, isFreePlan);

  if (isLoadingPlan) return <main className="min-h-screen bg-zinc-950" />;

  return <main className="min-h-screen bg-zinc-950 p-4 pt-16 text-zinc-100 sm:p-6 sm:pt-16 lg:p-8 lg:pt-16"><div className="mx-auto max-w-7xl space-y-6">
    <ManagementPageHeader icon={Briefcase} eyebrow="Equipa e permissões" title="Equipa" description="Gere os barbeiros, os membros que entraram por código e o acesso a cada área." accentClassName="border-purple-500/20 bg-purple-500/10 text-purple-400" actions={isFreePlan && freeLimitReached ? <Button asChild className="min-h-11"><Link href="/plans">Ver planos</Link></Button> : undefined} />

    {isFreePlan && <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"><p className="text-sm font-semibold text-zinc-100">Plano gratuito</p><p className="mt-1 text-xs leading-5 text-zinc-500">1 barbeiro incluído · comissão fixa de 100%. Podes começar já sem fazer upgrade.</p></section>}

    <nav className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 sm:grid-cols-3" aria-label="Secções da equipa">
      <button type="button" onClick={() => setActiveTab("professionals")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${activeTab === "professionals" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><Briefcase className="size-4" />Barbeiros</button>
      <button type="button" onClick={() => setActiveTab("members")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${activeTab === "members" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><UsersRound className="size-4" />Membros e permissões</button>
      <button type="button" onClick={() => setActiveTab("invite")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${activeTab === "invite" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><KeyRound className="size-4" />Código de entrada</button>
    </nav>

    {activeTab === "invite" && <InviteCodeCard />}
    {activeTab === "members" && <TeamMembersManager />}

    {activeTab === "professionals" && <>
      {loadingInitial ? <div role="status" aria-label="A carregar equipa" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]" />)}</div> : <ProfessionalsListCard professionalsCount={professionals.length} professionals={professionals} showAddProfessionalForm={showAddProfessionalForm} setShowAddProfessionalForm={setShowAddProfessionalForm} newProfessionalData={{ name: newProfessionalName, commission_percentage: isFreePlan ? 100 : newProfessionalCommission }} setNewProfessionalData={(value) => { const nextValue = typeof value === "function" ? value({ name: newProfessionalName, commission_percentage: newProfessionalCommission }) : value; setNewProfessionalName(nextValue.name); setNewProfessionalCommission(isFreePlan ? 100 : (nextValue.commission_percentage ?? 0)); }} handleCreateProfessional={handleCreateProfessional} setEditingProfessional={setEditingProfessional} handleDeleteProfessional={handleDeleteProfessional} loading={loadingProfessionals} isFreePlan={isFreePlan} freeLimitReached={freeLimitReached} />}
      <Dialog open={!!editingProfessional} onOpenChange={(open) => !open && setEditingProfessional(null)}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-[425px]"><DialogHeader><DialogTitle>Editar barbeiro</DialogTitle></DialogHeader>{editingProfessional && <form onSubmit={handleUpdateProfessional} className="grid gap-4 py-4"><div className="grid gap-2"><label htmlFor="edit-professional-name" className="text-xs text-zinc-400">Nome</label><input id="edit-professional-name" required className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50" value={editingProfessional.name} onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })} /></div><div className="grid gap-2"><label htmlFor="edit-professional-commission" className="text-xs text-zinc-400">Comissão (%)</label><input id="edit-professional-commission" required type="number" min="0" max="100" readOnly={isFreePlan} className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50 disabled:opacity-60" value={isFreePlan ? 100 : (editingProfessional.commission_percentage ?? 0)} onChange={(e) => !isFreePlan && setEditingProfessional({ ...editingProfessional, commission_percentage: Number(e.target.value) })} />{isFreePlan && <p className="text-xs text-zinc-500">No plano gratuito, a comissão é fixa em 100%.</p>}</div><DialogFooter><Button type="submit" disabled={loadingProfessionals} className="min-h-11 w-full bg-purple-600 text-white hover:bg-purple-500">{loadingProfessionals ? <Spinner className="size-4" /> : "Guardar alterações"}</Button></DialogFooter></form>}</DialogContent></Dialog>
    </>}
  </div></main>;
}
