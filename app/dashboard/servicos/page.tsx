"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import { Service } from "@/types";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { useServices } from "@/app/state/_hooks/dashboard/useServices";
import { ServicesListCard } from "@/app/dashboard/_components/cards/ServicesListCard";
import { ManagementPageHeader } from "@/app/dashboard/_components/shared/ManagementPageHeader";
import { Spinner } from "@/components/ui/spinner";
import { Scissors } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ServicosPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try { const res = await servicesService.getAll(barbershopId); if (res.error) throw res.error; setServices(res.data ?? []); }
    catch (error) { console.error("[Serviços Sync Error]:", error); toast.error("Não foi possível carregar os serviços. Tenta novamente."); }
    finally { setLoadingInitial(false); }
  }, [barbershopId]);

  useEffect(() => { if (!isLoadingBarbershop && barbershopId) queueMicrotask(() => void fetchServices()); }, [barbershopId, fetchServices, isLoadingBarbershop]);

  const { loadingService, editingService, setEditingService, newServiceData, setNewServiceData, handleCreateService, handleUpdateService, handleDeleteService } = useServices(barbershopId, fetchServices);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 pt-16 text-zinc-100 sm:p-6 sm:pt-16 lg:p-8 lg:pt-16">
      <div className="mx-auto max-w-7xl space-y-6">
        <ManagementPageHeader icon={Scissors} eyebrow="Menu e preços" title="Serviços" description="Define os serviços que os clientes podem escolher. Começa pelo essencial e ajusta o menu quando precisares." accentClassName="border-amber-500/20 bg-amber-500/10 text-amber-400" />
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
      </div>
    </main>
  );
}
