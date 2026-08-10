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

export default function EquipaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showAddProfessionalForm, setShowAddProfessionalForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchProfessionals = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try { const res = await professionalService.getAll(barbershopId); if (res.error) throw res.error; setProfessionals(res.data ?? []); }
    catch (error) { console.error("[Equipa Sync Error]:", error); toast.error("Erro ao carregar a equipa."); }
    finally { setLoadingInitial(false); }
  }, [barbershopId]);

  useEffect(() => { if (!isLoadingBarbershop && barbershopId) queueMicrotask(() => void fetchProfessionals()); }, [barbershopId, fetchProfessionals, isLoadingBarbershop]);

  const { loadingProfessionals, newProfessionalName, setNewProfessionalName, newProfessionalCommission, setNewProfessionalCommission, editingProfessional, setEditingProfessional, handleCreateProfessional, handleUpdateProfessional, handleDeleteProfessional } = useProfessionals(barbershopId, fetchProfessionals);

  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="dashboard-page-header border-b border-white/10 pb-5">
        <div className="min-w-0"><div className="flex items-center gap-2.5"><div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2 text-purple-400"><Briefcase className="size-5" aria-hidden="true" /></div><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">Equipa</h1></div><p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400 sm:text-sm">Gere barbeiros, colaboradores e as respetivas comissões com uma visão simples e rápida.</p></div>
        <Link href="/dashboard" className="w-full sm:w-auto"><Button variant="ghost" className="min-h-[44px] w-full border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 sm:w-auto"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar</Button></Link>
      </header>
      {loadingInitial ? <div role="status" aria-label="A carregar equipa" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]" />)}</div> : <ProfessionalsListCard professionalsCount={professionals.length} professionals={professionals} showAddProfessionalForm={showAddProfessionalForm} setShowAddProfessionalForm={setShowAddProfessionalForm} newProfessionalData={{ name: newProfessionalName, commission_percentage: newProfessionalCommission }} setNewProfessionalData={(value) => { const nextValue = typeof value === "function" ? value({ name: newProfessionalName, commission_percentage: newProfessionalCommission }) : value; setNewProfessionalName(nextValue.name); setNewProfessionalCommission(nextValue.commission_percentage ?? 0); }} handleCreateProfessional={handleCreateProfessional} setEditingProfessional={setEditingProfessional} handleDeleteProfessional={handleDeleteProfessional} loading={loadingProfessionals} />}
      <Dialog open={!!editingProfessional} onOpenChange={(open) => !open && setEditingProfessional(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-[425px]"><DialogHeader><DialogTitle>Editar barbeiro</DialogTitle></DialogHeader>
          {editingProfessional && <form onSubmit={handleUpdateProfessional} className="grid gap-4 py-4">
            <div className="grid gap-2"><label htmlFor="edit-professional-name" className="text-xs text-zinc-400">Nome</label><input id="edit-professional-name" required className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50" value={editingProfessional.name} onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })} /></div>
            <div className="grid gap-2"><label htmlFor="edit-professional-commission" className="text-xs text-zinc-400">Comissão (%)</label><input id="edit-professional-commission" required type="number" min="0" max="100" className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-purple-500/50" value={editingProfessional.commission_percentage ?? 0} onChange={(e) => setEditingProfessional({ ...editingProfessional, commission_percentage: Number(e.target.value) })} /></div>
            <DialogFooter><Button type="submit" disabled={loadingProfessionals} className="min-h-11 w-full bg-purple-600 text-white hover:bg-purple-500">{loadingProfessionals ? <Spinner className="size-4" /> : "Guardar alterações"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
