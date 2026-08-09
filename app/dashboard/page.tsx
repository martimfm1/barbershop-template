"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_METRIC_DESCRIPTORS,
  MetricKey,
  ColorKey,
  colorVariants,
} from "@/app/dashboard/_constants";
import { Appointment, Professional, Service, Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { servicesService } from "@/app/dashboard/_services/services.service";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { useAppointments } from "@/app/state/_hooks/dashboard/useAppointments";
import { useServices } from "@/app/state/_hooks/dashboard/useServices";
import { useProfessionals } from "@/app/state/_hooks/dashboard/useProfessionals";
import { useClients } from "@/app/state/_hooks/dashboard/useClients";
import { BookingForm } from "@/app/dashboard/_components/cards/BookingFormCard";
import { BlockScheduleForm } from "@/app/dashboard/_components/cards/BlockFormCard";
import { ClientsListCard } from "@/app/dashboard/_components/cards/ClientsListCard";
import { ServicesListCard } from "@/app/dashboard/_components/cards/ServicesListCard";
import { ProfessionalsListCard } from "@/app/dashboard/_components/cards/ProfessionalsListCard";
import { ManualMessageForm } from "@/app/dashboard/_components/cards/ManualMessageFormCard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteNavbar } from "@/components/site-navbar";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import {
  Plus,
  Check,
  Trash2,
  Users,
  Scissors,
  User,
  Briefcase,
  Settings,
  CalendarOff,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const { hasFeature } = useFeatureAccess();
  const canUseProfessionals = hasFeature("professionals");
  const canUseAnalytics = hasFeature("analytics");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [showProfessionalsList, setShowProfessionalsList] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showServicesList, setShowServicesList] = useState(false);
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false);

  const closeAllMenus = useCallback(() => {
    setShowAddForm(false);
    setShowAddBlockForm(false);
    setShowProfessionalsList(false);
    setShowClientsList(false);
    setShowServicesList(false);
    setShowCommunicationPanel(false);
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!barbershopId) {
      return;
    }
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
      console.error("❌ [Dashboard Sync Error]:", error);
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
    bookingFormData,
    setBookingFormData,
    blockFormData,
    setBlockFormData,
    handleCreateBooking,
    confirmBooking,
    finalizeBooking,
    handleCreateBlock,
    handleDeleteBlock,
    handleDeleteBooking,
  } = useAppointments(barbershopId, fetchInitialData);

  const {
    loadingService,
    editingService,
    setEditingService,
    newServiceData,
    setNewServiceData,
    handleCreateService,
    handleUpdateService,
    handleDeleteService,
  } = useServices(barbershopId, fetchInitialData);

  const {
    loadingClients,
    searchQuery,
    setSearchQuery,
    newClientData,
    setNewClientData,
    editingClient,
    setEditingClient,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    getFilteredClients,
  } = useClients(barbershopId, fetchInitialData);

  const {
    loadingProfessionals,
    newProfessionalName,
    setNewProfessionalName,
    newProfessionalCommission,
    setNewProfessionalCommission,
    editingProfessional,
    setEditingProfessional,
    handleCreateProfessional,
    handleUpdateProfessional,
    handleDeleteProfessional,
  } = useProfessionals(barbershopId, fetchInitialData);

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

  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [searchClientQuery, setSearchClientQuery] = useState("");

  const [showAddServiceForm, setShowAddServiceForm] = useState(false);

  const [showAddProfessionalForm, setShowAddProfessionalForm] = useState(false);

  const [reminderClientId, setReminderClientId] = useState("manual");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [manualMessage, setManualMessage] = useState({ phone: "", text: "" });
  const [sendingMessage, setSendingMessage] = useState(false);

  const applyMessageTemplate = useCallback(
    (clientId: string, template: string) => {
      const client = clients.find((item) => item.id === clientId);
      const phone = client?.num_phone ?? "";

      const templates: Record<string, string> = {
        custom: "",
        reminder_tomorrow: `Olá ${client?.name_complete ?? "cliente"}! Este é um lembrete de que o seu agendamento está marcado para amanhã. Obrigado!`,
        miss_you: `Olá ${client?.name_complete ?? "cliente"}! Esperamos voltar a vê-lo em breve.`,
      };

      setManualMessage((prev) => ({
        phone: clientId === "manual" ? prev.phone : phone,
        text: templates[template] ?? "",
      }));
    },
    [clients],
  );

  const handleSendManualMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Mensagem enviada com sucesso.");
      setManualMessage({ phone: "", text: "" });
      setReminderClientId("manual");
      setSelectedTemplate("custom");
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
      toast.error("Não foi possível enviar a mensagem.");
    } finally {
      setSendingMessage(false);
    }
  }, []);

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

  const chartConfig = {
    revenue: { label: "Revenue (€)", color: "hsl(var(--chart-1))" },
    bookings: { label: "Bookings", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  const dynamicChartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      revenue: appointments
        .filter(
          (a) =>
            a.status === "completed" &&
            new Date(a.date_hour).getDay() === days.indexOf(day),
        )
        .reduce((acc, a) => acc + Number(a.services?.price || 0), 0),
      bookings: appointments.filter(
        (a) => new Date(a.date_hour).getDay() === days.indexOf(day),
      ).length,
    }));
  }, [appointments]);

  const metrics = useMemo(() => {
    const totalRevenue = appointments
      .filter((a) => a.status === "completed")
      .reduce((acc, app) => acc + Number(app.services?.price || 0), 0);

    const activeBookingsCount = appointments.filter(
      (a) => a.status === "scheduled",
    ).length;

    const valuesMap: Record<MetricKey, string> = {
      revenue: `${totalRevenue.toFixed(2)}€`,
      appointments: String(activeBookingsCount),
      clients: String(clients.length),
      services: String(services.length),
    };

    return DASHBOARD_METRIC_DESCRIPTORS.map((descriptor) => ({
      ...descriptor,
      value: valuesMap[descriptor.key],
    }));
  }, [appointments, clients, services]);

  const iconVariants = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/20 text-blue-400",
    amber: "bg-amber-500/20 text-amber-400",
    purple: "bg-purple-500/20 text-purple-400",
    default: "bg-white/5 text-zinc-300",
  };

  const cardHoverVariants = {
    emerald: "hover:border-emerald-500/40 hover:bg-emerald-500/10",
    blue: "hover:border-blue-500/40 hover:bg-blue-500/10",
    amber: "hover:border-amber-500/40 hover:bg-amber-500/10",
    purple: "hover:border-purple-500/40 hover:bg-purple-500/10",
    default: "hover:border-zinc-500/40 hover:bg-zinc-500/10",
  };

  return (
    <TooltipProvider>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground pb-5 pt-22">
        <SiteNavbar />
        <BackgroundBeams className="opacity-35" />
        <Spotlight className="opacity-70" />

        <div className="relative px-3 pb-5 pt-8 text-foreground sm:px-5 md:px-8 md:pb-12">
          <>
            <section className="pb-5 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-7">
              {[
                {
                  state: showAddForm,
                  setter: setShowAddForm,
                  icon: Plus,
                  label: "New Booking",
                  color: "emerald" as ColorKey,
                },
                {
                  state: showAddBlockForm,
                  setter: setShowAddBlockForm,
                  icon: CalendarOff,
                  label: "Block Schedule",
                  color: "red" as ColorKey,
                },
                {
                  state: showProfessionalsList,
                  setter: setShowProfessionalsList,
                  icon: Briefcase,
                  label: "Professionals",
                  color: "purple" as ColorKey,
                  locked: !canUseProfessionals,
                },
                {
                  state: showClientsList,
                  setter: setShowClientsList,
                  icon: Users,
                  label: "Clients",
                  color: "blue" as ColorKey,
                },
                {
                  state: showServicesList,
                  setter: setShowServicesList,
                  icon: Scissors,
                  label: "Services",
                  color: "amber" as ColorKey,
                },
                {
                  state: showCommunicationPanel,
                  setter: setShowCommunicationPanel,
                  icon: MessageCircle,
                  label: "Messages",
                  color: "emerald" as ColorKey,
                },
                {
                  state: false,
                  setter: null,
                  icon: Settings,
                  label: "Settings",
                  color: "zinc" as ColorKey,
                  href: "/dashboard/settings",
                },
                {
                  state: false,
                  setter: null,
                  icon: TrendingUp,
                  label: "Stats",
                  color: "blue" as ColorKey,
                  href: "/dashboard/stats",
                  locked: !canUseAnalytics,
                },
              ].map((item, idx) => {
                const cardClasses = cn(
                  "group text-left rounded-2xl border p-3 md:p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 block w-full cursor-pointer",
                  item.state
                    ? colorVariants[item.color].active
                    : "border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/20",
                  item.locked && "opacity-60",
                );

                const innerContent = (
                  <>
                    <span
                      className={cn(
                        "mb-3 flex size-8 items-center justify-center rounded-full border transition-all duration-300",
                        item.state
                          ? colorVariants[item.color].icon
                          : "border-white/10 bg-white/5 text-zinc-300 group-hover:text-zinc-100 group-hover:bg-white/10",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 transition-transform duration-300",
                          item.href && "group-hover:rotate-45",
                        )}
                      />
                    </span>
                    <span className="block font-heading text-sm font-semibold text-zinc-50 tracking-tight">
                      {item.label}
                    </span>
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={idx}
                      href={item.locked ? "/dashboard/billing" : item.href}
                      className={cardClasses}
                    >
                      {innerContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      closeAllMenus();
                      if (item.locked) {
                        window.location.assign("/dashboard/billing");
                        return;
                      }
                      if (item.setter) item.setter(!item.state);
                    }}
                    className={cardClasses}
                  >
                    {innerContent}
                  </button>
                );
              })}
            </section>

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

            {showClientsList && (
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

            {showServicesList && (
              <ServicesListCard
                servicesCount={services.length}
                services={services}
                showAddServiceForm={showAddServiceForm}
                setShowAddServiceForm={setShowAddServiceForm}
                newServiceData={newServiceData}
                setNewServiceData={setNewServiceData}
                handleCreateService={handleCreateService}
                setEditingService={setEditingService}
                handleDeleteService={handleDeleteService}
                loading={loadingService}
              />
            )}

            {showProfessionalsList && (
              <ProfessionalsListCard
                professionalsCount={professionals.length}
                professionals={professionals}
                showAddProfessionalForm={showAddProfessionalForm}
                setShowAddProfessionalForm={setShowAddProfessionalForm}
                newProfessionalData={{
                  name: newProfessionalName,
                  commission_percentage: newProfessionalCommission,
                }}
                setNewProfessionalData={(value) => {
                  const nextValue =
                    typeof value === "function"
                      ? value({
                          name: newProfessionalName,
                          commission_percentage: newProfessionalCommission,
                        })
                      : value;
                  setNewProfessionalName(nextValue.name);
                  setNewProfessionalCommission(
                    nextValue.commission_percentage ?? 0,
                  );
                }}
                handleCreateProfessional={handleCreateProfessional}
                setEditingProfessional={setEditingProfessional}
                handleDeleteProfessional={handleDeleteProfessional}
                loading={loadingProfessionals}
              />
            )}

            {showCommunicationPanel && (
              <ManualMessageForm
                clients={clients}
                reminderClientId={reminderClientId}
                setReminderClientId={setReminderClientId}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                manualMessage={manualMessage}
                setManualMessage={setManualMessage}
                applyMessageTemplate={applyMessageTemplate}
                onSubmit={handleSendManualMessage}
                sendingMessage={sendingMessage}
              />
            )}

            <section className="pt-5 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <Link
                  key={metric.key}
                  href="/dashboard/stats"
                  className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                >
                  <Card
                    className={cn(
                      "border border-white/10 bg-white/[0.04]",
                      "cursor-pointer transition-all duration-200",
                      cardHoverVariants[metric.variant],
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                      <div className="space-y-1 min-w-0">
                        <CardDescription className="text-zinc-400 text-xs font-medium truncate">
                          {metric.label}
                        </CardDescription>
                        <CardTitle className="text-2xl text-zinc-50 font-bold tracking-tight truncate">
                          {metric.value}
                        </CardTitle>
                      </div>

                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full transition-colors shrink-0",
                          iconVariants[metric.variant],
                        )}
                      >
                        <metric.icon className="size-5" />
                      </span>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </section>

            <section className="pt-5 grid gap-3 md:gap-4 lg:grid-cols-[1fr_360px]">
              <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-zinc-100">
                    Weekly Evolution
                  </CardTitle>
                </CardHeader>

                <CardContent className="h-[250px] w-full pt-4">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={dynamicChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        {/* Preenchimento suave em gradiente branco */}
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ffffff"
                            stopOpacity={0.12}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ffffff"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="4 4"
                        stroke="rgba(255, 255, 255, 0.07)"
                      />

                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        dy={8}
                      />

                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={36}
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      />

                      <ChartTooltip content={<ChartTooltipContent />} />

                      {/* Receita: Linha Branca sólida com gradiente suave */}
                      <Area
                        dataKey="revenue"
                        type="monotone"
                        fill="url(#revenueGradient)"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#ffffff", strokeWidth: 0 }}
                        activeDot={{
                          r: 5,
                          fill: "#ffffff",
                          stroke: "#18181b",
                          strokeWidth: 2,
                        }}
                      />

                      {/* Reservas: Verde Esmeralda de alto contraste e sem brilho */}
                      <Line
                        dataKey="bookings"
                        type="monotone"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                        activeDot={{
                          r: 5,
                          fill: "#10b981",
                          stroke: "#18181b",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

<section className="pt-5 grid gap-3 md:gap-4 lg:grid-cols-1" aria-label="Gestão de Agendamentos Diários">
  <Card className="border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
    <CardHeader className="px-4 py-4 sm:px-6">
      <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
        Gestão de Agendamentos Diários
      </CardTitle>
    </CardHeader>

    <CardContent className="p-0 sm:p-6 sm:pt-0">
      {/* ------------------------------------------------------------- */}
      {/* 1. ESTADO DE CARREGAMENTO (SKELETONS)                          */}
      {/* ------------------------------------------------------------- */}
      {loadingInitial ? (
        <div className="p-4 sm:p-0 space-y-3" role="status" aria-label="A carregar agendamentos">
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
        /* ------------------------------------------------------------- */
        /* 2. ESTADO VAZIO                                                */
        /* ------------------------------------------------------------- */
        <div className="p-8 text-center text-zinc-400 text-sm">
          Sem agendamentos registados para este dia.
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* 3. VISTA MOBILE (CARDS ACCESSÍVEIS SEM SCROLL)               */}
          {/* ------------------------------------------------------------- */}
          <div className="block md:hidden divide-y divide-white/5 px-4 pb-4">
            {appointments.map((appointment) => {
              const dataObj = new Date(appointment.date_hour);
              const phoneStr = appointment.users?.num_phone || appointment.manual_phone;
              const nameStr = appointment.users?.name_complete || appointment.manual_name || "Cliente Manual";

              return (
                <article
                  key={appointment.id}
                  className="py-4 first:pt-0 last:pb-0 space-y-3"
                  aria-labelledby={`booking-client-${appointment.id}`}
                >
                  {/* Cabeçalho do Card: Cliente & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 id={`booking-client-${appointment.id}`} className="font-semibold text-zinc-100 text-base">
                        {nameStr}
                      </h3>
                      {phoneStr ? (
                        <a
                          href={`tel:${phoneStr}`}
                          className="text-xs text-zinc-400 hover:text-emerald-400 focus-visible:underline transition-colors mt-0.5"
                          aria-label={`Ligar para ${nameStr}: ${phoneStr}`}
                        >
                          {phoneStr}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500">Sem telefone</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={appointment.status} />
                      {appointment.payment_method && (
                        <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
                          💳 {appointment.payment_method.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes: Serviço, Profissional, Data/Hora */}
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

                  {Number(appointment.value_products) > 0 && (
                    <div className="text-xs text-zinc-400 flex justify-between items-center bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
                      <span>Produtos Extra:</span>
                      <span className="font-semibold text-emerald-400">+{appointment.value_products}€</span>
                    </div>
                  )}

                  {/* Ações (Alvo Touch Min. 44px) */}
                  <div className="flex items-center gap-2 pt-1">
                    {appointment.status === "pending" && (
                      <Button
                        variant="ghost"
                        onClick={() => confirmBooking(appointment.id)}
                        className="flex-1 min-h-[44px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Check className="size-4 mr-1.5" aria-hidden="true" />
                        Confirmar
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
                            className="flex-1 min-h-[44px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            <Check className="size-4 mr-1.5" aria-hidden="true" />
                            Concluir
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-zinc-950 border-white/10 w-[92vw] max-w-[400px] rounded-xl text-left text-white p-5">
                          <DialogHeader>
                            <DialogTitle className="text-zinc-100 text-lg font-semibold">
                              Concluir Atendimento
                            </DialogTitle>
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
                              <span className="text-xs font-medium text-zinc-300">
                                Método de Pagamento
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => finalizeBooking(appointment.id, "cash")}
                                  className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium"
                                >
                                  💵 Cash
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => finalizeBooking(appointment.id, "mbway")}
                                  className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium"
                                >
                                  📱 MBWay
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => finalizeBooking(appointment.id, "card")}
                                  className="min-h-[44px] bg-zinc-700 hover:bg-zinc-600 text-xs text-white font-medium"
                                >
                                  💳 Cartão
                                </Button>
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
                            <AlertDialogCancel className="flex-1 min-h-[44px] bg-transparent text-white border-white/10 m-0">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBooking(appointment.id)}
                              className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-500 text-white m-0"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. VISTA DESKTOP (TABELA SEMÂNTICA PADRÃO)                    */}
          {/* ------------------------------------------------------------- */}
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
                          <span className="text-[11px] text-zinc-500 font-normal">
                            {phoneStr || "N/A"}
                          </span>
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
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={appointment.status} />
                          {appointment.payment_method && (
                            <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
                              💳 {appointment.payment_method.toUpperCase()}
                            </span>
                          )}
                          {Number(appointment.value_products) > 0 && (
                            <span className="text-[10px] text-zinc-500">
                              +{appointment.value_products}€ (Prod)
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {appointment.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmBooking(appointment.id)}
                              className="h-8 px-3 text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <Check className="size-4 mr-1.5" aria-hidden="true" />
                              Confirmar
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
                                  size="sm"
                                  onClick={() => setFinishingBookingId(appointment.id)}
                                  className="h-8 px-3 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                  <Check className="size-4 mr-1.5" aria-hidden="true" />
                                  Concluir
                                </Button>
                              </DialogTrigger>

                              <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[400px] text-left text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-zinc-100 text-lg font-semibold">
                                    Concluir Atendimento
                                  </DialogTitle>
                                  <DialogDescription className="text-zinc-400 text-xs">
                                    Finalize o agendamento de {nameStr}.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-3">
                                  <div className="flex flex-col gap-2">
                                    <label htmlFor={`dt-prod-${appointment.id}`} className="text-xs font-medium text-zinc-300">
                                      Venda de Produto Extra (Opcional)
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        id={`dt-prod-${appointment.id}`}
                                        type="text"
                                        placeholder="Produto..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={descriptionProducts}
                                        onChange={(e) => setDescriptionProducts(e.target.value)}
                                      />
                                      <input
                                        id={`dt-val-${appointment.id}`}
                                        type="number"
                                        placeholder="€ Val"
                                        aria-label="Valor do produto em euros"
                                        className="w-24 bg-white/5 border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={valueProducts}
                                        onChange={(e) => setValueProducts(e.target.value === "0" ? "" : e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 mt-2">
                                    <span className="text-xs font-medium text-zinc-300">
                                      Selecione o Método de Pagamento
                                    </span>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => finalizeBooking(appointment.id, "cash")}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-9 text-xs text-white font-medium"
                                      >
                                        💵 Cash
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => finalizeBooking(appointment.id, "mbway")}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 h-9 text-xs text-white font-medium"
                                      >
                                        📱 MBWay
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => finalizeBooking(appointment.id, "card")}
                                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 h-9 text-xs text-white font-medium"
                                      >
                                        💳 Cartão
                                      </Button>
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
                                  className="h-8 w-8 text-red-400 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-950 border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar agendamento?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-transparent text-white border-white/10">
                                    Voltar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                    onClick={() => handleDeleteBooking(appointment.id)}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
</section>
          </>
        </div>
      </main>

      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      >
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleUpdateClient} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Name</label>
                <input
                  required
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
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
                <label className="text-xs text-zinc-400">Phone</label>
                <input
                  required
                  type="tel"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
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
                  variant="ghost"
                  className="bg-blue-600 text-white w-full"
                >
                  {loadingClients ? (
                    <Spinner className="size-4" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
      >
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={handleUpdateService} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Service Name</label>
                <input
                  required
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Price (€)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingService.price}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Duration (min)</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingService.duration ?? ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      duration: e.target.value,
                    })
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loadingService}
                  variant="ghost"
                  className="bg-amber-600 text-white w-full"
                >
                  Apply
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingProfessional}
        onOpenChange={(open) => !open && setEditingProfessional(null)}
      >
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Barber</DialogTitle>
          </DialogHeader>
          {editingProfessional && (
            <form
              onSubmit={handleUpdateProfessional}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Name</label>
                <input
                  required
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingProfessional.name}
                  onChange={(e) =>
                    setEditingProfessional({
                      ...editingProfessional,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400">Commission (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                  value={editingProfessional.commission_percentage ?? 0}
                  onChange={(e) =>
                    setEditingProfessional({
                      ...editingProfessional,
                      commission_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loadingProfessionals}
                  variant="ghost"
                  className="bg-purple-600 text-white w-full"
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
