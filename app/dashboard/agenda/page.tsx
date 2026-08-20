"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarOff, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/context/BarbershopContext";
import type { Appointment, Client, Professional, Service } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useAppointments } from "@/app/state/_hooks/dashboard/useAppointments";
import { BookingForm } from "@/app/dashboard/_components/cards/BookingFormCard";
import { BlockScheduleForm } from "@/app/dashboard/_components/cards/BlockFormCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentDetailDialog } from "@/components/dashboard/appointment-detail-dialog";
import { AppointmentActions } from "@/components/dashboard/appointment-actions";
import { AppointmentMobileCard } from "@/components/dashboard/appointment-mobile-card";
import { AppointmentsTable } from "@/components/dashboard/appointments-table";

export default function AgendaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!barbershopId) return;
    setLoadingInitial(true);
    try {
      const [appointmentsRes, servicesRes, professionalsRes, clientsRes] = await Promise.all([
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
    addingClientAppointmentId,
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
    addCompletedAppointmentClient,
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
  }, [formData.clientId, formData.name_complete, formData.num_phone, formData.service_id, selectedProfessionalId, selectedDate, selectedTime, setBookingFormData]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter((appointment) => {
      const date = new Date(appointment.date_hour);
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    });
  }, [appointments]);

  const orderedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime()),
    [appointments],
  );

  const actionProps = {
    finishingBookingId,
    setFinishingBookingId,
    valueProducts,
    setValueProducts,
    descriptionProducts,
    setDescriptionProducts,
    confirmBooking,
    finalizeBooking,
    addCompletedAppointmentClient,
    addingClientAppointmentId,
    handleDeleteBooking,
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400"><CalendarDays className="size-5" aria-hidden="true" /></div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">Agenda</h1>
            </div>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">Vê o que está marcado, resolve o próximo passo e mantém o teu dia organizado.</p>
            {!loadingInitial && <p className="mt-2 text-xs text-zinc-500"><span className="font-medium text-zinc-300">{todayAppointments.length}</span>{" "}{todayAppointments.length === 1 ? "marcação hoje" : "marcações hoje"} · <span className="font-medium text-zinc-300">{appointments.length}</span> no total</p>}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button variant="ghost" onClick={() => setShowAddForm((value) => !value)} className="col-span-2 min-h-[44px] gap-2 border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 hover:bg-emerald-500/20 sm:col-span-1 sm:text-sm">
              <Plus className="size-4" aria-hidden="true" />{showAddForm ? "Fechar marcação" : "Nova marcação"}
            </Button>
            <Button variant="ghost" onClick={() => setShowAddBlockForm((value) => !value)} className="min-h-[44px] gap-2 border border-white/10 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 sm:text-sm">
              <CalendarOff className="size-4" aria-hidden="true" />{showAddBlockForm ? "Fechar bloqueio" : "Bloquear horário"}
            </Button>
            <Link href="/dashboard" className="flex-1 sm:flex-none"><Button variant="ghost" className="min-h-[44px] w-full border border-white/10 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 sm:text-sm">Voltar</Button></Link>
          </div>
        </header>

        {showAddForm && <BookingForm clients={clients} services={services} professionals={professionals} loading={loadingAppointments} formData={formData} setFormData={setFormData} selectedProfessionalId={selectedProfessionalId} setSelectedProfessionalId={setSelectedProfessionalId} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} onSubmit={handleCreateBooking} />}
        {showAddBlockForm && <BlockScheduleForm professionals={professionals} loading={loadingAppointments} blockFormData={blockFormData} setBlockFormData={setBlockFormData} onSubmit={handleCreateBlock} />}

        <Card className="border border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader className="px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Marcações</CardTitle>
                <p className="mt-1 text-xs text-zinc-500">As mais próximas aparecem primeiro para encontrares rapidamente o que exige atenção.</p>
              </div>
              {!loadingInitial && orderedAppointments.length > 0 && <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">{orderedAppointments.length} {orderedAppointments.length === 1 ? "marcação" : "marcações"}</span>}
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {loadingInitial ? (
              <div className="space-y-3 p-4 sm:p-0" role="status" aria-label="A carregar marcações">
                {[...Array(4)].map((_, index) => <div key={index} className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"><div className="h-5 w-32 rounded bg-white/10" /><div className="h-4 w-48 rounded bg-white/10" /><div className="h-9 w-full rounded-lg bg-white/10" /></div>)}
              </div>
            ) : orderedAppointments.length === 0 ? (
              <div className="mx-4 mb-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center sm:mx-0">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><Sparkles className="size-5" aria-hidden="true" /></div>
                <h2 className="mt-4 text-base font-semibold text-zinc-100">A tua agenda está pronta para receber a primeira marcação.</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Não precisas de configurar tudo antes de começar. Cria uma marcação agora e adiciona o resto à medida que precisares.</p>
                <Button onClick={() => setShowAddForm(true)} className="mt-5 min-h-[44px] bg-zinc-50 text-zinc-950 hover:bg-white"><Plus className="mr-2 size-4" aria-hidden="true" />Criar primeira marcação</Button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5 px-4 pb-4 md:hidden">
                  {orderedAppointments.map((appointment) => <AppointmentMobileCard key={appointment.id} appointment={appointment} onDetails={() => setSelectedAppointment(appointment)} {...actionProps} />)}
                </div>
                <div className="hidden md:block">
                  <AppointmentsTable appointments={orderedAppointments} onDetails={setSelectedAppointment} {...actionProps} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AppointmentDetailDialog appointment={selectedAppointment} open={Boolean(selectedAppointment)} onOpenChange={(open) => { if (!open) setSelectedAppointment(null); }} />
    </main>
  );
}
