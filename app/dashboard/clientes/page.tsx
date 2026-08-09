"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { useClients } from "@/app/state/_hooks/dashboard/useClients";
import { ClientsListCard } from "@/app/dashboard/_components/cards/ClientsListCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClientesPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchClientQuery, setSearchClientQuery] = useState("");
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try {
      const res = await appointmentService.getClients(barbershopId);
      if (res.error) throw res.error;
      setClients(res.data ?? []);
    } catch (error) {
      console.error("❌ [Clientes Sync Error]:", error);
      toast.error("Erro ao carregar os clientes.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) {
      queueMicrotask(() => void fetchClients());
    }
  }, [barbershopId, fetchClients, isLoadingBarbershop]);

  const {
    loadingClients,
    newClientData,
    setNewClientData,
    editingClient,
    setEditingClient,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
  } = useClients(barbershopId, fetchClients);

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name_complete?.toLowerCase().includes(searchClientQuery.toLowerCase()) ||
          c.num_phone?.includes(searchClientQuery),
      ),
    [clients, searchClientQuery],
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <Users className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Clientes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Regista e gere os clientes da tua barbearia.
          </p>
        </div>
        <Link href="/dashboard" className="flex-1 sm:flex-none">
          <Button
            variant="ghost"
            className="w-full sm:w-auto min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
          </Button>
        </Link>
      </header>

      {loadingInitial ? (
        <div role="status" aria-label="A carregar clientes" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <ClientsListCard
          clientsCount={clients.length}
          filteredClients={filteredClients}
          searchClientQuery={searchClientQuery}
          setSearchClientQuery={setSearchClientQuery}
          showAddClientForm={showAddClientForm}
          setShowAddClientForm={setShowAddClientForm}
          newClientData={newClientData}
          setNewClientData={setNewClientData}
          handleCreateClient={handleCreateClient}
          setEditingClient={setEditingClient}
          handleDeleteClient={handleDeleteClient}
          loading={loadingClients}
        />
      )}

      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      >
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleUpdateClient} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Nome</label>
                <input
                  required
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingClient.name_complete}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, name_complete: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Telefone</label>
                <input
                  required
                  type="tel"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingClient.num_phone}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, num_phone: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loadingClients} variant="ghost" className="bg-blue-600 text-white w-full">
                  {loadingClients ? <Spinner className="size-4" /> : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}