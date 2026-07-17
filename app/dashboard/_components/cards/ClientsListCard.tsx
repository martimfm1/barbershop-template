"use client";

// utils
import { ClientsListCardProps } from "@/_types";

// UI
import { Users, UserPlus, Search, Phone, Mail, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ClientsListCard({
  clientsCount,
  filteredClients,
  searchClientQuery,
  setSearchClientQuery,
  showAddClientForm,
  setShowAddClientForm,
  newClientData,
  setNewClientData,
  handleCreateClient,
  // openMessageForClient,
  setEditingClient,
  handleDeleteClient,
  loading,
}: ClientsListCardProps) {
  return (
    <Card className="border border-zinc-500/20 bg-zinc-950/80 animate-in fade-in slide-in-from-top-4 duration-200">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex gap-4 items-center">
          <CardTitle className="text-xl flex gap-2 items-center text-blue-500">
            <Users className="size-5" /> Clientes ({clientsCount})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddClientForm(!showAddClientForm)}
            className="border border-white/10 text-zinc-300 cursor-pointer hover:bg-white/5"
          >
            <UserPlus className="size-4 mr-2" /> Novo Cliente
          </Button>
        </div>
        <div className="w-full sm:w-72">
          <InputGroup>
            <InputGroupAddon>
              <Search className="size-4 text-zinc-500" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Pesquisar nome ou telemóvel..."
              value={searchClientQuery}
              onChange={(e) => setSearchClientQuery(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white focus-visible:ring-blue-500"
            />
          </InputGroup>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Formulário de Criação de Cliente */}
        {showAddClientForm && (
          <form
            onSubmit={handleCreateClient}
            className="mb-6 grid gap-4 sm:grid-cols-4 items-end bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Nome Completo</label>
              <input
                required
                disabled={loading}
                placeholder="Ex: João Silva"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                value={newClientData.name_complete}
                onChange={(e) =>
                  setNewClientData({
                    ...newClientData,
                    name_complete: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Telemóvel</label>
              <input
                required
                disabled={loading}
                type="tel"
                placeholder="Ex: 912345678"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                value={newClientData.num_phone}
                onChange={(e) =>
                  setNewClientData({
                    ...newClientData,
                    num_phone: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Email (Opcional)</label>
              <input
                disabled={loading}
                type="email"
                placeholder="Ex: joao@email.com"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                value={newClientData.email}
                onChange={(e) =>
                  setNewClientData({
                    ...newClientData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="ghost"
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 cursor-pointer transition-colors"
            >
              {loading ? <Spinner className="size-4" /> : "Registar Cliente"}
            </Button>
          </form>
        )}

        {/* Lista de Clientes */}
        {filteredClients.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <Users className="size-8 text-zinc-600 mb-2 animate-pulse" />
            <p className="text-sm text-zinc-400 font-medium">Nenhum cliente encontrado</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Tenta ajustar o termo de pesquisa ou clica em &quot;Novo Cliente&quot; para registar um utilizador na tua agenda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-500/30 transition-colors duration-150"
              >
                <div>
                  <p className="font-semibold text-sm text-zinc-100 truncate">{client.name_complete}</p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1.5">
                    <Phone className="size-3 text-zinc-500" /> {client.num_phone}
                  </p>
                  {client.email && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1.5 truncate">
                      <Mail className="size-3 text-zinc-500" /> {client.email}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-1 justify-end pt-3 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    // onClick={() => openMessageForClient(client.num_phone, client.name_complete)}
                    className="h-7 w-7 text-green-400 hover:bg-green-500/10 cursor-pointer"
                    title="Enviar mensagem rápida"
                  >
                    <MessageCircle className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingClient(client)}
                    className="h-7 w-7 text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                    title="Editar dados"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-400 hover:bg-red-500/10 cursor-pointer"
                        title="Remover cliente"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-950 border border-white/10 max-w-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Eliminar Cliente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                          Esta ação é permanente. Se o cliente tiver marcações associadas, o sistema impedirá a remoção para manter o teu histórico seguro.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent text-zinc-300 border border-white/10 hover:bg-white/5 cursor-pointer">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}