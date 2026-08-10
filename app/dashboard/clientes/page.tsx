"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import { Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { useClients } from "@/app/state/_hooks/dashboard/useClients";
import { ClientsListCard } from "@/app/dashboard/_components/cards/ClientsListCard";
import { ManagementPageHeader } from "@/app/dashboard/_components/shared/ManagementPageHeader";
import { Spinner } from "@/components/ui/spinner";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      console.error("[Clientes Sync Error]:", error);
      toast.error("Não foi possível carregar os clientes. Tenta novamente.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (!isLoadingBarbershop && barbershopId)
      queueMicrotask(() => void fetchClients());
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
          c.name_complete
            ?.toLowerCase()
            .includes(searchClientQuery.toLowerCase()) ||
          c.num_phone?.includes(searchClientQuery),
      ),
    [clients, searchClientQuery],
  );

  return (
    <main className="min-h-screen bg-zinc-950 p-4 pt-16 text-zinc-100 sm:p-6 sm:pt-16 lg:p-8 lg:pt-16">
      <div className="mx-auto max-w-7xl space-y-6">
        <ManagementPageHeader
          icon={Users}
          eyebrow="Clientes e contactos"
          title="Clientes"
          description="Mantém os contactos essenciais organizados. O histórico cresce com as marcações, sem te obrigar a preencher tudo à partida."
          accentClassName="text-blue-400 bg-blue-500/10 border-blue-500/20"
        />
        {loadingInitial ? (
          <div
            role="status"
            aria-label="A carregar clientes"
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]"
              />
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
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
            </DialogHeader>
            {editingClient && (
              <form onSubmit={handleUpdateClient} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="edit-client-name"
                    className="text-xs text-zinc-400"
                  >
                    Nome
                  </label>
                  <input
                    id="edit-client-name"
                    required
                    className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-emerald-500/50"
                    value={editingClient.name_complete}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        name_complete: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="edit-client-phone"
                    className="text-xs text-zinc-400"
                  >
                    Telefone
                  </label>
                  <input
                    id="edit-client-phone"
                    required
                    type="tel"
                    className="min-h-11 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-emerald-500/50"
                    value={editingClient.num_phone}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        num_phone: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={loadingClients}
                    className="min-h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    {loadingClients ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Guardar alterações"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
