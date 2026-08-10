"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Check,
  Trash2,
  User,
  Plus,
  CalendarOff,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export default function AgendaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
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
      console.error("[Agenda Sync Error]:", error);
      toast.error("Não foi possível atualizar a agenda. Tenta novamente.");
    } finally {
      setLoadingInitial(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) queueMicrotask(() => void fetchInitialData());
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

  const [formData, setFormData] = useState({
    clientId: undefined as string | undefined,
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

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter((appointment) => {
      const date = new Date(appointment.date_hour);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    });
  }, [appointments]);

  const orderedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime(),
      ),
    [appointments],
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              Agenda
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Vê o que está marcado, resolve o próximo passo e mantém o teu dia
            organizado.
          </p>
          {!loadingInitial && (
            <p className="mt-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-300">
                {todayAppointments.length}
              </span>{" "}
              {todayAppointments.length === 1
                ? "marcação hoje"
                : "marcações hoje"}{" "}
              ·{" "}
              <span className="font-medium text-zinc-300">
                {appointments.length}
              </span>{" "}
              no total
            </p>
          )}
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button
            variant="ghost"
            onClick={() => setShowAddForm((v) => !v)}
            className="min-h-[44px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs sm:text-sm gap-2 col-span-2 sm:col-span-1"
          >
            <Plus className="size-4" aria-hidden="true" />{" "}
            {showAddForm ? "Fechar marcação" : "Nova marcação"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowAddBlockForm((v) => !v)}
            className="min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
          >
            <CalendarOff className="size-4" aria-hidden="true" />{" "}
            {showAddBlockForm ? "Fechar bloqueio" : "Bloquear horário"}
          </Button>
          <Link href="/dashboard" className="flex-1 sm:flex-none">
            <Button
              variant="ghost"
              className="w-full min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
                Marcações
              </CardTitle>
              <p className="mt-1 text-xs text-zinc-500">
                As mais próximas aparecem primeiro para encontrares rapidamente
                o que exige atenção.
              </p>
            </div>
            {!loadingInitial && orderedAppointments.length > 0 && (
              <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                {orderedAppointments.length}{" "}
                {orderedAppointments.length === 1 ? "marcação" : "marcações"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loadingInitial ? (
            <div
              className="space-y-3 p-4 sm:p-0"
              role="status"
              aria-label="A carregar marcações"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:hidden"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32 bg-white/10" />
                    <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                  </div>
                  <Skeleton className="h-4 w-48 bg-white/10" />
                  <Skeleton className="h-9 w-full rounded-lg bg-white/10" />
                </div>
              ))}
              <div className="hidden overflow-hidden rounded-lg border border-white/5 md:block">
                <Table>
                  <TableBody>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i} className="border-white/5">
                        <TableCell>
                          <Skeleton className="h-4 w-32 bg-white/10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28 bg-white/10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24 bg-white/10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-8 w-24 rounded-md bg-white/10" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : orderedAppointments.length === 0 ? (
            <div className="mx-4 mb-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center sm:mx-0">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-zinc-100">
                A tua agenda está pronta para receber a primeira marcação.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Não precisas de configurar tudo antes de começar. Cria uma
                marcação agora e adiciona o resto à medida que precisares.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-5 min-h-[44px] bg-zinc-50 text-zinc-950 hover:bg-white"
              >
                <Plus className="mr-2 size-4" aria-hidden="true" /> Criar
                primeira marcação
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5 px-4 pb-4 md:hidden">
                {orderedAppointments.map((appointment) => (
                  <AppointmentMobileCard
                    key={appointment.id}
                    appointment={appointment}
                    finishingBookingId={finishingBookingId}
                    setFinishingBookingId={setFinishingBookingId}
                    valueProducts={valueProducts}
                    setValueProducts={setValueProducts}
                    descriptionProducts={descriptionProducts}
                    setDescriptionProducts={setDescriptionProducts}
                    confirmBooking={confirmBooking}
                    finalizeBooking={finalizeBooking}
                    handleDeleteBooking={handleDeleteBooking}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Cliente</TableHead>
                      <TableHead className="text-zinc-400">
                        Serviço / Profissional
                      </TableHead>
                      <TableHead className="text-zinc-400">
                        Data e hora
                      </TableHead>
                      <TableHead className="text-zinc-400">Estado</TableHead>
                      <TableHead className="text-right text-zinc-400">
                        Próxima ação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedAppointments.map((appointment) => {
                      const date = new Date(appointment.date_hour);
                      const phone =
                        appointment.users?.num_phone ||
                        appointment.manual_phone;
                      const name =
                        appointment.users?.name_complete ||
                        appointment.manual_name ||
                        "Cliente";
                      return (
                        <TableRow
                          key={appointment.id}
                          className="border-white/5 hover:bg-white/[0.02]"
                        >
                          <TableCell className="font-semibold text-zinc-100">
                            <div className="flex flex-col">
                              <span>{name}</span>
                              <span className="text-[11px] font-normal text-zinc-500">
                                {phone || "Sem telefone"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            <div className="flex flex-col">
                              <span>
                                {appointment.services?.name || "Serviço"}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <User className="size-3" aria-hidden="true" />
                                {appointment.professionals?.name ||
                                  "Sem barbeiro"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            {date.toLocaleDateString("pt-PT")}{" "}
                            <span className="ml-1.5 text-zinc-500">
                              {date.toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={appointment.status} />
                          </TableCell>
                          <TableCell>
                            <AppointmentActions
                              appointment={appointment}
                              finishingBookingId={finishingBookingId}
                              setFinishingBookingId={setFinishingBookingId}
                              valueProducts={valueProducts}
                              setValueProducts={setValueProducts}
                              descriptionProducts={descriptionProducts}
                              setDescriptionProducts={setDescriptionProducts}
                              confirmBooking={confirmBooking}
                              finalizeBooking={finalizeBooking}
                              handleDeleteBooking={handleDeleteBooking}
                              compact
                            />
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

function AppointmentMobileCard({ appointment, ...props }: any) {
  const date = new Date(appointment.date_hour);
  const phone = appointment.users?.num_phone || appointment.manual_phone;
  const name =
    appointment.users?.name_complete || appointment.manual_name || "Cliente";
  return (
    <article className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-100">
            {name}
          </h3>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-0.5 block text-xs text-zinc-400 hover:text-emerald-400"
            >
              {phone}
            </a>
          ) : (
            <span className="mt-0.5 block text-xs text-zinc-500">
              Sem telefone
            </span>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
            Serviço
          </span>
          <span className="font-medium text-zinc-200">
            {appointment.services?.name || "Serviço"}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
            <User className="size-3" aria-hidden="true" />
            {appointment.professionals?.name || "Sem barbeiro"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
            Data e hora
          </span>
          <span className="font-medium text-zinc-200">
            {date.toLocaleDateString("pt-PT")}
          </span>
          <span className="mt-0.5 block text-[11px] text-zinc-400">
            {date.toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
      <AppointmentActions appointment={appointment} {...props} />
    </article>
  );
}

function AppointmentActions({
  appointment,
  finishingBookingId,
  setFinishingBookingId,
  valueProducts,
  setValueProducts,
  descriptionProducts,
  setDescriptionProducts,
  confirmBooking,
  finalizeBooking,
  handleDeleteBooking,
  compact = false,
}: any) {
  const name =
    appointment.users?.name_complete || appointment.manual_name || "Cliente";
  return (
    <div
      className={
        compact ? "flex justify-end gap-1.5" : "flex items-center gap-2 pt-1"
      }
    >
      {appointment.status === "pending" && (
        <Button
          variant="ghost"
          onClick={() => confirmBooking(appointment.id)}
          className={`${compact ? "h-8 px-3" : "min-h-[44px] flex-1"} border border-blue-500/20 bg-blue-500/10 text-xs font-medium text-blue-400 hover:bg-blue-500/20`}
        >
          <Check className="mr-1.5 size-4" aria-hidden="true" /> Confirmar
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
              className={`${compact ? "h-8 px-3" : "min-h-[44px] flex-1"} border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20`}
            >
              <Check className="mr-1.5 size-4" aria-hidden="true" /> Concluir
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] max-w-[400px] rounded-xl border-white/10 bg-zinc-950 p-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-zinc-100">
                Concluir atendimento
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Finaliza o atendimento de{" "}
                <strong className="text-zinc-200">{name}</strong>. Podes
                registar uma venda extra antes do pagamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`prod-desc-${appointment.id}`}
                  className="text-xs font-medium text-zinc-300"
                >
                  Produto extra{" "}
                  <span className="text-zinc-500">(opcional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id={`prod-desc-${appointment.id}`}
                    type="text"
                    placeholder="Ex.: Pomada"
                    className="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={descriptionProducts}
                    onChange={(e) => setDescriptionProducts(e.target.value)}
                  />
                  <input
                    id={`prod-val-${appointment.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00 €"
                    aria-label="Valor do produto em euros"
                    className="min-h-[44px] w-24 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={valueProducts}
                    onChange={(e) =>
                      setValueProducts(
                        e.target.value === "0" ? "" : e.target.value,
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-300">
                  Como foi pago?
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => finalizeBooking(appointment.id, "cash")}
                    className="min-h-[44px] border border-white/10 bg-white/5 text-xs text-zinc-100 hover:bg-white/10"
                  >
                    Dinheiro
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => finalizeBooking(appointment.id, "mbway")}
                    className="min-h-[44px] border border-white/10 bg-white/5 text-xs text-zinc-100 hover:bg-white/10"
                  >
                    MB WAY
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => finalizeBooking(appointment.id, "card")}
                    className="min-h-[44px] border border-white/10 bg-white/5 text-xs text-zinc-100 hover:bg-white/10"
                  >
                    Cartão
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {(appointment.status === "scheduled" ||
        appointment.status === "pending") && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar agendamento de ${name}`}
              className={`${compact ? "h-8 w-8" : "min-h-[44px] min-w-[44px]"} rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[92vw] max-w-[400px] rounded-xl border-white/10 bg-zinc-950">
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar esta marcação?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2">
              <AlertDialogCancel className="m-0 min-h-[44px] flex-1 border-white/10 bg-transparent text-white">
                Manter
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteBooking(appointment.id)}
                className="m-0 min-h-[44px] flex-1 bg-red-600 text-white hover:bg-red-500"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
