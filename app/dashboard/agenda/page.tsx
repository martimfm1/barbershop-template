"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { Appointment, Professional, Service, Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useAppointments } from "@/app/state/_hooks/dashboard/useAppointments";
import { BookingForm } from "@/app/dashboard/_components/cards/BookingFormCard";
import { BlockScheduleForm } from "@/app/dashboard/_components/cards/BlockFormCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/app/state/_components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Check, Trash2, User, Plus, CalendarOff } from "lucide-react";

export default function AgendaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try {
      const [appointmentsRes, servicesRes, professionalsRes, clientsRes] =
        await Promise.all([
          appointmentService.getAll(barbershopId),
          servicesService.getAll(barbershopId),
          professionalService.getAll(barbershopId),
          appointmentService.getClients(barbershopId),
        ]);
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      setAppointments(appointmentsRes.data ?? []);
      setServices(servicesRes.data ?? []);
      setProfessionals(professionalsRes.data ?? []);
      setClients(clientsRes.data ?? []);
    } catch (error) {
      console.error("❌ [Agenda Sync Error]:", error);
      toast.error("Erro ao sincronizar os dados com o servidor.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) {
      queueMicrotask(() => void fetchInitialData());
    }
  }, [barbershopId, fetchInitialData, isLoadingBarbershop]);

  const {
    loadingAppointments,
    finishingBookingId,
    setFinishingBookingId,
    valueProducts,
    setValueProducts,
    descriptionProducts,
    setDescriptionProducts,
    setBookingFormData,
    blockFormData,
    setBlockFormData,
    handleCreateBooking,
    confirmBooking,
    finalizeBooking,
    handleCreateBlock,
    handleDeleteBooking,
  } = useAppointments(barbershopId, fetchInitialData);

  const [formData, setFormData] = useState<{
    clientId?: string;
    name_complete: string;
    num_phone: string;
    email: string;
    service_id: string;
  }>({
    clientId: undefined,
    name_complete: "",
    num_phone: "",
    email: "",
    service_id: "",
  });

  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    setBookingFormData((prev) => {
      const next = {
        ...prev,
        clientId: formData.clientId || "",
        serviceId: formData.service_id,
        professionalId: selectedProfessionalId,
        date: selectedDate,
        time: selectedTime,
        manualName: formData.name_complete,
        manualPhone: formData.num_phone,
      };
      const changed =
        prev.clientId !== next.clientId ||
        prev.serviceId !== next.serviceId ||
        prev.professionalId !== next.professionalId ||
        prev.date !== next.date ||
        prev.time !== next.time ||
        prev.manualName !== next.manualName ||
        prev.manualPhone !== next.manualPhone;
      return changed ? next : prev;
    });
  }, [
    formData.clientId,
    formData.name_complete,
    formData.num_phone,
    formData.service_id,
    selectedProfessionalId,
    selectedDate,
    selectedTime,
    setBookingFormData,
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <CalendarOff className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Agenda
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Marcações, bloqueios de agenda e gestão diária.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={() => setShowAddForm((v) => !v)}
            className="min-h-[44px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs sm:text-sm gap-2"
          >
            <Plus className="size-4" aria-hidden="true" /> Nova marcação
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowAddBlockForm((v) => !v)}
            className="min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
          >
            <CalendarOff className="size-4" aria-hidden="true" /> Bloquear
          </Button>
          <Link href="/dashboard" className="flex-1 sm:flex-none">
            <Button
              variant="ghost"
              className="w-full sm:w-auto min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      {showAddForm && (
        <BookingForm
          clients={clients}
          services={services}
          professionals={professionals}
          loading={loadingAppointments}
          formData={formData}
          setFormData={setFormData}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          onSubmit={handleCreateBooking}
        />
      )}

      {showAddBlockForm && (
        <BlockScheduleForm
          professionals={professionals}
          loading={loadingAppointments}
          blockFormData={blockFormData}
          setBlockFormData={setBlockFormData}
          onSubmit={handleCreateBlock}
        />
      )}

      <Card className="border border-white/10 bg-zinc-900/60 shadow-xl">
        <CardHeader className="px-4 py-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Marcações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loadingInitial ? (
            <div className="p-4 sm:p-0 space-y-3" role="status" aria-label="A carregar marcações">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 md:hidden">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 bg-white/10" />
                    <Skeleton className="h-6 w-20 bg-white/10 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48 bg-white/10" />
                  <Skeleton className="h-9 w-full bg-white/10 rounded-lg" />
                </div>
              ))}
              <div className="hidden md:block border border-white/5 rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i} className="border-white/5">
                        <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 bg-white/10 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto bg-white/10 rounded-md" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">
              Sem marcações registadas.
            </div>
          ) : (
            <>
              <div className="block md:hidden divide-y divide-white/5 px-4 pb-4">
                {appointments.map((appointment) => {
                  const dataObj = new Date(appointment.date_hour);
                  const phoneStr = appointment.users?.num_phone || appointment.manual_phone;
                  const nameStr = appointment.users?.name_complete || appointment.manual_name || "Cliente Manual";
                  return (
                    <article key={appointment.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-zinc-100 text-base">{nameStr}</h3>
                          {phoneStr ? (
                            <a href={`tel:${phoneStr}`} className="text-xs text-zinc-400 hover:text-emerald-400 mt-0.5">
                              {phoneStr}
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-500">Sem telefone</span>
                          )}
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase">Serviço</span>
                          <span className="font-medium text-zinc-200">{appointment.services?.name}</span>
                          <span className="text-zinc-400 flex items-center gap-1 mt-0.5 text-[11px]">
                            <User className="size-3" aria-hidden="true" />
                            {appointment.professionals?.name || "Sem barbeiro"}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase">Data & Hora</span>
                          <span className="font-medium text-zinc-200">{dataObj.toLocaleDateString("pt-PT")}</span>
                          <span className="text-zinc-400 block mt-0.5 text-[11px]">
                            {dataObj.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {appointment.status === "pending" && (
                          <Button
                            variant="ghost"
                            onClick={() => confirmBooking(appointment.id)}
                            className="flex-1 min-h-[44px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-medium"
                          >
                            <Check className="size-4 mr-1.5" aria-hidden="true" /> Confirmar
                          </Button>
                        )}
                        {appointment.status === "scheduled" && (
                          <Dialog
                            open={finishingBookingId === appointment.id}
                            onOpenChange={(open) => !open && setFinishingBookingId(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => setFinishingBookingId(appointment.id)}
                                className="flex-1 min-h-[44px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium"
                              >
                                <Check className="size-4 mr-1.5" aria-hidden="true" /> Concluir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 w-[92vw] max-w-[400px] rounded-xl text-left text-white p-5">
                              <DialogHeader>
                                <DialogTitle className="text-zinc-100 text-lg font-semibold">Concluir Atendimento</DialogTitle>
                                <DialogDescription className="text-zinc-400 text-xs">
                                  Finalize o agendamento de <strong className="text-zinc-200">{nameStr}</strong>.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-3">
                                <div className="flex flex-col gap-1.5">
                                  <label htmlFor={`prod-desc-${appointment.id}`} className="text-xs font-medium text-zinc-300">
                                    Venda de Produto Extra (Opcional)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      id={`prod-desc-${appointment.id}`}
                                      type="text"
                                      placeholder="Produto..."
                                      className="flex-1 min-h-[44px] bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      value={descriptionProducts}
                                      onChange={(e) => setDescriptionProducts(e.target.value)}
                                    />
                                    <input
                                      id={`prod-val-${appointment.id}`}
                                      type="number"
                                      placeholder="€ Val"
                                      aria-label="Valor do produto em euros"
                                      className="w-24 min-h-[44px] bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      value={valueProducts}
                                      onChange={(e) => setValueProducts(e.target.value === "0" ? "" : e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs font-medium text-zinc-300">Método de Pagamento</span>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button variant="ghost" onClick={() => finalizeBooking(appointment.id, "cash")} className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium">💵 Cash</Button>
                                    <Button variant="ghost" onClick={() => finalizeBooking(appointment.id, "mbway")} className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium">📱 MBWay</Button>
                                    <Button variant="ghost" onClick={() => finalizeBooking(appointment.id, "card")} className="min-h-[44px] bg-zinc-700 hover:bg-zinc-600 text-xs text-white font-medium">💳 Cartão</Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {(appointment.status === "scheduled" || appointment.status === "pending") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Eliminar agendamento de ${nameStr}`}
                                className="min-h-[44px] min-w-[44px] text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-950 border-white/10 w-[92vw] max-w-[400px] rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar agendamento?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 justify-end">
                                <AlertDialogCancel className="flex-1 min-h-[44px] bg-transparent text-white border-white/10 m-0">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBooking(appointment.id)} className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-500 text-white m-0">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Cliente</TableHead>
                      <TableHead className="text-zinc-400">Serviço / Profissional</TableHead>
                      <TableHead className="text-zinc-400">Data & Hora</TableHead>
                      <TableHead className="text-zinc-400">Estado</TableHead>
                      <TableHead className="text-right text-zinc-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => {
                      const dataObj = new Date(appointment.date_hour);
                      const phoneStr = appointment.users?.num_phone || appointment.manual_phone;
                      const nameStr = appointment.users?.name_complete || appointment.manual_name || "Cliente Manual";
                      return (
                        <TableRow key={appointment.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="font-semibold text-zinc-100">
                            <div className="flex flex-col">
                              <span>{nameStr}</span>
                              <span className="text-[11px] text-zinc-500 font-normal">{phoneStr || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            <div className="flex flex-col">
                              <span>{appointment.services?.name}</span>
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <User className="size-3" aria-hidden="true" />
                                {appointment.professionals?.name || "Sem barbeiro"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            {dataObj.toLocaleDateString("pt-PT")}
                            <span className="text-zinc-500 ml-1.5">
                              {dataObj.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={appointment.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {appointment.status === "pending" && (
                                <Button variant="ghost" size="sm" onClick={() => confirmBooking(appointment.id)} className="h-8 px-3 text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 whitespace-nowrap">
                                  <Check className="size-4 mr-1.5" aria-hidden="true" /> Confirmar
                                </Button>
                              )}
                              {appointment.status === "scheduled" && (
                                <Button variant="ghost" size="sm" onClick={() => setFinishingBookingId(appointment.id)} className="h-8 px-3 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                                  <Check className="size-4 mr-1.5" aria-hidden="true" /> Concluir
                                </Button>
                              )}
                              {(appointment.status === "scheduled" || appointment.status === "pending") && (
                                <Button variant="ghost" size="icon" aria-label={`Eliminar agendamento de ${nameStr}`} onClick={() => handleDeleteBooking(appointment.id)} className="h-8 w-8 text-red-400 hover:bg-red-500/10">
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}