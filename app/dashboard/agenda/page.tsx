'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CalendarOff, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useBarbershop } from '@/context/BarbershopContext';
import type { Appointment, Client, Professional, Service } from '@/types';
import { appointmentService } from '@/app/dashboard/_services/appointments.service';
import { servicesService } from '@/app/dashboard/_services/services.service';
import { professionalService } from '@/app/dashboard/_services/professionals.service';
import { useAppointments } from '@/app/state/_hooks/dashboard/useAppointments';
import { BookingForm } from '@/app/dashboard/_components/cards/BookingFormCard';
import { BlockScheduleForm } from '@/app/dashboard/_components/cards/BlockFormCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppointmentDetailDialog } from '@/components/dashboard/appointment-detail-dialog';
import { AppointmentMobileCard } from '@/components/dashboard/appointment-mobile-card';
import { AppointmentsTable } from '@/components/dashboard/appointments-table';

export default function AgendaPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

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
      console.error('[Agenda Sync Error]:', error);
      toast.error('Não foi possível atualizar a agenda. Tenta novamente.');
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
    name_complete: '',
    num_phone: '',
    email: '',
    service_id: '',
  });
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    setBookingFormData((prev) => {
      const next = {
        ...prev,
        clientId: formData.clientId || '',
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
    <main className="silentra-page-shell dashboard-page">
      <div className="silentra-page-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-[100rem] px-0 py-6 sm:py-8 lg:py-10">
        <header className="silentra-page-header">
          <div className="min-w-0">
            <p className="silentra-eyebrow">Operação diária</p>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
                <CalendarDays className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="silentra-page-title">Agenda</h1>
                <p className="silentra-page-description">
                  Vê o que está marcado, resolve o próximo passo e mantém o teu
                  dia organizado.
                </p>
              </div>
            </div>
            {!loadingInitial && (
              <p className="mt-3 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-200">
                  {todayAppointments.length}
                </span>{' '}
                {todayAppointments.length === 1
                  ? 'marcação hoje'
                  : 'marcações hoje'}{' '}
                ·{' '}
                <span className="font-semibold text-zinc-200">
                  {appointments.length}
                </span>{' '}
                no total
              </p>
            )}
          </div>

          <div className="silentra-page-actions w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowAddForm((value) => !value)}
              className="border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200 hover:border-emerald-400/30 hover:bg-emerald-400/[0.1]"
            >
              <Plus className="size-4" aria-hidden="true" />
              {showAddForm ? 'Fechar marcação' : 'Nova marcação'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddBlockForm((value) => !value)}
            >
              <CalendarOff className="size-4" aria-hidden="true" />
              {showAddBlockForm ? 'Fechar bloqueio' : 'Bloquear horário'}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Voltar</Link>
            </Button>
          </div>
        </header>

        <div className="space-y-4">
          {showAddForm && (
            <section className="silentra-section-block p-4 sm:p-6">
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
            </section>
          )}
          {showAddBlockForm && (
            <section className="silentra-section-block p-4 sm:p-6">
              <BlockScheduleForm
                professionals={professionals}
                loading={loadingAppointments}
                blockFormData={blockFormData}
                setBlockFormData={setBlockFormData}
                onSubmit={handleCreateBlock}
              />
            </section>
          )}

          <section
            className="silentra-section-block overflow-hidden"
            aria-labelledby="agenda-list-title"
          >
            <div className="flex flex-col gap-3 border-b border-white/[0.075] p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
              <div>
                <p className="silentra-eyebrow mb-0">Hoje e próximos</p>
                <h2
                  id="agenda-list-title"
                  className="mt-1 text-xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-2xl"
                >
                  Marcações
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  As mais próximas aparecem primeiro para encontrares
                  rapidamente o que exige atenção.
                </p>
              </div>
              {!loadingInitial && orderedAppointments.length > 0 && (
                <span className="silentra-pill w-fit border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-zinc-400">
                  {orderedAppointments.length}{' '}
                  {orderedAppointments.length === 1 ? 'marcação' : 'marcações'}
                </span>
              )}
            </div>

            {loadingInitial ? (
              <div
                className="space-y-3 p-4 sm:p-6"
                role="status"
                aria-label="A carregar marcações"
              >
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4"
                  >
                    <Skeleton className="h-4 w-32 bg-white/[0.07]" />
                    <Skeleton className="mt-3 h-4 w-48 bg-white/[0.07]" />
                    <Skeleton className="mt-4 h-9 w-full bg-white/[0.07]" />
                  </div>
                ))}
              </div>
            ) : orderedAppointments.length === 0 ? (
              <div className="m-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-12 text-center sm:m-6">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300">
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
                  className="mt-5 bg-zinc-50 text-zinc-950 hover:bg-white"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Criar primeira marcação
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/[0.055] px-4 pb-4 md:hidden">
                  {orderedAppointments.map((appointment) => (
                    <AppointmentMobileCard
                      key={appointment.id}
                      appointment={appointment}
                      onDetails={() => setSelectedAppointment(appointment)}
                      {...actionProps}
                    />
                  ))}
                </div>
                <div className="hidden md:block">
                  <AppointmentsTable
                    appointments={orderedAppointments}
                    onDetails={setSelectedAppointment}
                    {...actionProps}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
      />
    </main>
  );
}
