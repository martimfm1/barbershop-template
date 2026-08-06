"use client";

// utils
import { type ProfessionalsListCardProps } from "@/types";

// UI
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
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
}: ProfessionalsListCardProps) {
  return (
    <Card className="border border-purple-500/20 bg-zinc-950/80 animate-in fade-in slide-in-from-top-4 duration-200">
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="flex gap-4 items-center">
          <CardTitle className="text-xl flex gap-2 text-purple-400">
            <Briefcase className="size-6 text-purple-400" /> Barbers ({professionalsCount})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddProfessionalForm(!showAddProfessionalForm)}
            className="border border-white/10 text-zinc-300 cursor-pointer"
          >
            <Plus className="size-4 mr-2" /> New Barber
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddProfessionalForm && (
          <form
            onSubmit={handleCreateProfessional}
            className="mb-6 grid gap-4 sm:grid-cols-3 items-end bg-purple-500/5 p-4 rounded-xl border border-purple-500/20"
          >
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400">Barber Name</label>
              <input
                required
                placeholder="Enter barber name"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-sm text-white"
                value={newProfessionalData.name}
                onChange={(e) =>
                  setNewProfessionalData({
                    ...newProfessionalData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400">Commission (%)</label>
              <input
                required
                type="number"
                min="0"
                max="100"
                placeholder="0"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-sm text-white"
                value={newProfessionalData.commission_percentage ?? 0}
                onChange={(e) =>
                  setNewProfessionalData({
                    ...newProfessionalData,
                    commission_percentage: Number(e.target.value),
                  })
                }
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="ghost"
              className="bg-purple-600 hover:bg-purple-500 text-white h-9 cursor-pointer"
            >
              {loading ? <Spinner className="size-4" /> : "Add Barber"}
            </Button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm text-zinc-100">{professional.name}</p>
                <p className="mt-1 text-xs text-purple-300">
                  Comissão: {professional.commission_percentage ?? 0}%
                </p>
              </div>
              <div className="mt-3 flex gap-1 justify-end pt-3 border-t border-white/5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingProfessional(professional)}
                  className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Barber permanently?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent text-white border-white/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 text-white"
                        onClick={() => handleDeleteProfessional(professional.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
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