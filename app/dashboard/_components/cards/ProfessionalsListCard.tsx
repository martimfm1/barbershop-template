"use client";

import { type ProfessionalsListCardProps } from "@/types";
import { Briefcase, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type EquipaCardProps = ProfessionalsListCardProps & {
  isFreePlan: boolean;
  freeLimitReached: boolean;
};

export function ProfessionalsListCard({
  professionalsCount,
  professionals,
  showAddProfessionalForm,
  setShowAddProfessionalForm,
  newProfessionalData,
  setNewProfessionalData,
  handleCreateProfessional,
  setEditingProfessional,
  handleDeleteProfessional,
  loading,
  isFreePlan,
  freeLimitReached,
}: EquipaCardProps) {
  const canAddProfessional = !freeLimitReached;

  return (
    <Card className="animate-in fade-in slide-in-from-top-4 border border-purple-500/20 bg-zinc-950/80 duration-200">
      <CardHeader className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <CardTitle className="flex gap-2 text-xl text-purple-400">
            <Briefcase className="size-6 text-purple-400" />
            Barbeiros ({professionalsCount})
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canAddProfessional}
          onClick={() => setShowAddProfessionalForm(!showAddProfessionalForm)}
          className="min-h-10 border border-white/10 text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          title={freeLimitReached ? "O plano gratuito permite 1 barbeiro" : undefined}
        >
          {freeLimitReached ? <Lock className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
          {freeLimitReached ? "Limite atingido" : "Novo barbeiro"}
        </Button>
      </CardHeader>

      <CardContent>
        {showAddProfessionalForm && canAddProfessional && (
          <form onSubmit={handleCreateProfessional} className="mb-6 grid items-end gap-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <label htmlFor="new-professional-name" className="text-xs text-zinc-400">Nome do barbeiro</label>
              <input
                id="new-professional-name"
                required
                autoFocus
                placeholder="Ex.: João Silva"
                className="min-h-11 rounded-lg border border-white/10 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-purple-500/50"
                value={newProfessionalData.name}
                onChange={(e) => setNewProfessionalData({ ...newProfessionalData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="new-professional-commission" className="text-xs text-zinc-400">Comissão (%)</label>
              {isFreePlan ? (
                <div className="flex min-h-11 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300" aria-label="Comissão fixa de 100 por cento">100%</div>
              ) : (
                <input
                  id="new-professional-commission"
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  className="min-h-11 rounded-lg border border-white/10 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-purple-500/50"
                  value={newProfessionalData.commission_percentage}
                  onChange={(e) => setNewProfessionalData({ ...newProfessionalData, commission_percentage: Number(e.target.value) })}
                />
              )}
              {isFreePlan && <p className="text-[11px] text-zinc-500">Fixa no plano gratuito.</p>}
            </div>

            <Button type="submit" disabled={loading} className="min-h-11 bg-purple-600 text-white hover:bg-purple-500">
              {loading ? <Spinner className="size-4" /> : "Adicionar barbeiro"}
            </Button>
          </form>
        )}

        {freeLimitReached && (
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">Já tens o barbeiro incluído no plano gratuito.</p>
            <p className="mt-1 text-xs leading-5">Para adicionar outra pessoa à equipa ou usar comissões personalizadas, precisas de um plano superior.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <div key={professional.id} className="flex flex-col justify-between rounded-xl border border-white/5 bg-black/40 p-4 transition-colors hover:border-purple-500/30">
              <div>
                <p className="text-sm font-semibold text-zinc-100">{professional.name}</p>
                <p className="mt-1 text-xs text-purple-300">Comissão: {professional.commission_percentage ?? 100}%</p>
              </div>
              <div className="mt-3 flex justify-end gap-1 border-t border-white/5 pt-3">
                <Button variant="ghost" size="icon" onClick={() => setEditingProfessional(professional)} className="size-8 text-blue-400 hover:bg-blue-500/10" aria-label={`Editar ${professional.name}`}><Pencil className="size-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-red-400 hover:bg-red-500/10" aria-label={`Eliminar ${professional.name}`}><Trash2 className="size-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-zinc-950">
                    <AlertDialogHeader><AlertDialogTitle>Eliminar este barbeiro?</AlertDialogTitle><AlertDialogDescription>Esta ação pode não ser possível se existirem marcações ou histórico associado.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel className="border-white/10 bg-transparent text-white">Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 text-white" onClick={() => handleDeleteProfessional(professional.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
