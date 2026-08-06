"use client";

// utils
import { ServicesListCardProps } from "@/types";

// UI
import { Scissors, Plus, Clock, DollarSign, Pencil, Trash2 } from "lucide-react";
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

export function ServicesListCard({
  servicesCount,
  services,
  showAddServiceForm,
  setShowAddServiceForm,
  newServiceData,
  setNewServiceData,
  handleCreateService,
  setEditingService,
  handleDeleteService,
  loading,
}: ServicesListCardProps) {
  return (
    <Card className="border border-amber-500/20 bg-zinc-950/80 animate-in fade-in slide-in-from-top-4 duration-200">
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="flex gap-4 items-center">
          <CardTitle className="text-xl flex gap-2 text-amber-500">
            <Scissors className="size-5" /> Services ({servicesCount})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddServiceForm(!showAddServiceForm)}
            className="border border-white/10 text-zinc-300 cursor-pointer"
          >
            <Plus className="size-4 mr-2" /> New Service
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddServiceForm && (
          <form
            onSubmit={handleCreateService}
            className="mb-6 grid gap-4 sm:grid-cols-4 items-end bg-amber-500/5 p-4 rounded-xl border border-amber-500/20"
          >
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400">Service Name</label>
              <input
                required
                placeholder="Enter name"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                value={newServiceData.name}
                onChange={(e) =>
                  setNewServiceData({
                    ...newServiceData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400">Price (€)</label>
              <input
                required
                type="number"
                placeholder="Enter price"
                step="0.01"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                value={newServiceData.price || ""}
                onChange={(e) =>
                  setNewServiceData({
                    ...newServiceData,
                    price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-zinc-400">Duration (min)</label>
              <input
                required
                type="number"
                placeholder="Enter duration"
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                value={newServiceData.duration || ""}
                onChange={(e) =>
                  setNewServiceData({
                    ...newServiceData,
                    duration: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="ghost"
              className="bg-amber-600 hover:bg-amber-500 text-white h-9 cursor-pointer"
            >
              {loading ? <Spinner className="size-4" /> : "Create Service"}
            </Button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm text-zinc-100">{service.name}</p>
                <div className="flex gap-4 mt-2">
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <DollarSign className="size-3 text-green-400" /> {service.price}€
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="size-3 text-blue-400" /> {service.duration ?? (service as any).min_duration ?? "—"} min
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-1 justify-end pt-3 border-t border-white/5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingService(service)}
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
                      <AlertDialogTitle>Delete Service permanently?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent text-white border-white/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 text-white"
                        onClick={() => handleDeleteService(service.id)}
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