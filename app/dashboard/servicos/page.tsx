"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { Service } from "@/types";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { useServices } from "@/app/state/_hooks/dashboard/useServices";
import { ServicesListCard } from "@/app/dashboard/_components/cards/ServicesListCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Scissors } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ServicosPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try { const res = await servicesService.getAll(barbershopId); if (res.error) throw res.error; setServices(res.data ?? []); }
    catch (error) { console.error("[Serviços Sync Error]:", error); toast.error("Erro ao carregar os serviços."); }
    finally { setLoadingInitial(false); }
  }, [barbershopId]);

  useEffect(() => { if (!isLoadingBarbershop && barbershopId) queueMicrotask(() => void fetchServices()); }, [barbershopId, fetchServices, isLoadingBarbershop]);

  const { loadingService, editingService, setEditingService, newServiceData, setNewServiceData, handleCreateService, handleUpdateService, handleDeleteService } = useServices(barbershopId, fetchServices);

  return (
    <main className="dashboard-page min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="dashboard-page-header border-b border-white/10 pb-5">
        <div className="min-w-0"><div className="flex items-center gap-2.5"><div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-400"><Scissors className="size-5" aria-hidden="true" /></div><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">Serviços</h1></div><p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400 sm:text-sm">Organiza o menu, preços e duração dos serviços que aparecem nas marcações.</p></div>
        <Link href="/dashboard" className="w-full sm:w-auto"><Button variant="ghost" className="min-h-[44px] w-full border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 sm:w-auto"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar</Button></Link>
      </header>
      {loadingInitial ? <div role="status" aria-label="A carregar serviços" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]" />)}</div> : <ServicesListCard servicesCount={services.length} services={services} showAddServiceForm={showAddServiceForm} setShowAddServiceForm={setShowAddServiceForm} newServiceData={newServiceData} setNewServiceData={setNewServiceData} handleCreateService={handleCreateService} setEditingService={setEditingService} handleDeleteService={handleDeleteService} loading={loadingService} />}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-[425px]"><DialogHeader><DialogTitle>Editar serviço</DialogTitle></DialogHeader>
          {editingService && <form onSubmit={handleUpdateService} className="grid gap-4 py-4">
            <div className="grid gap-2"><label htmlFor="edit-service-name" className="text-xs text-zinc-400">Nome do serviço</label><input id="edit-service-name" required className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-amber-500/50" value={editingService.name} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} /></div>
            <div className="grid gap-2"><label htmlFor="edit-service-price" className="text-xs text-zinc-400">Preço (€)</label><input id="edit-service-price" required type="number" min="0" step="0.01" className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-amber-500/50" value={editingService.price} onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} /></div>
            <div className="grid gap-2"><label htmlFor="edit-service-duration" className="text-xs text-zinc-400">Duração (min)</label><input id="edit-service-duration" required type="number" min="1" className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-amber-500/50" value={editingService.duration ?? ""} onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })} /></div>
            <DialogFooter><Button type="submit" disabled={loadingService} className="min-h-11 w-full bg-amber-600 text-white hover:bg-amber-500">{loadingService ? <Spinner className="size-4" /> : "Guardar alterações"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
