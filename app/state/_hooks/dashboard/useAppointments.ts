import { useState, useCallback } from "react";
import { toast } from "sonner";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { createScheduleBlock, deleteScheduleBlock } from "@/app/dashboard/_services/schedule-blocks.service";
import { combineDatetime } from "@/app/dashboard/_lib/date-utils";
import { getErrorMessage } from "@/app/dashboard/_lib/error-utils";
import type { BlockFormData } from "@/types";

export function useAppointments(
  barbershopId: string | null,
  onRefreshData: () => Promise<void>,
) {
  const [loadingAppointments, setLoading] = useState<boolean>(false);
  const [finishingBookingId, setFinishingBookingId] = useState<string | null>(null);
  const [addingClientAppointmentId, setAddingClientAppointmentId] = useState<string | null>(null);
  const [valueProducts, setValueProducts] = useState<string>("");
  const [descriptionProducts, setDescriptionProducts] = useState<string>("");

  const [bookingFormData, setBookingFormData] = useState({
    clientId: "",
    serviceId: "",
    professionalId: "",
    date: "",
    time: "",
    manualName: "",
    manualPhone: "",
  });

  const [blockFormData, setBlockFormData] = useState<BlockFormData>({
    professional_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });

  const handleCreateBooking = useCallback(async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) return;
    setLoading(true);
    try {
      const { clientId, serviceId, professionalId, date, time, manualName, manualPhone } = bookingFormData;
      if (!serviceId || !professionalId || !date || !time) {
        toast.error("Preenche o serviço, o profissional, a data e a hora.");
        return;
      }
      const datetime = combineDatetime(date, time);
      const { error } = await appointmentService.create({
        barbershop_id: barbershopId,
        date_hour: datetime,
        status: "pending",
        client_id: clientId || null,
        service_id: serviceId,
        professional_id: professionalId,
        manual_name: manualName || null,
        manual_phone: manualPhone || null,
      });
      if (error) throw error;
      toast.success("Marcação criada com sucesso.");
      setBookingFormData({ clientId: "", serviceId: "", professionalId: "", date: "", time: "", manualName: "", manualPhone: "" });
      await onRefreshData();
    } catch (error) {
      console.error("[Create Booking Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally { setLoading(false); }
  }, [barbershopId, bookingFormData, onRefreshData]);

  const confirmBooking = useCallback(async (appointmentId: string) => {
    setLoading(true);
    try {
      const { error } = await appointmentService.update(appointmentId, { status: "scheduled" });
      if (error) throw error;
      toast.success("Marcação confirmada com sucesso.");
      await onRefreshData();
    } catch (error) {
      console.error("[Confirm Booking Hook Error]:", error);
      toast.error("Erro ao confirmar a marcação.");
    } finally { setLoading(false); }
  }, [onRefreshData]);

  const finalizeBooking = useCallback(async (appointmentId: string, paymentMethod: string) => {
    setLoading(true);
    try {
      const parsedValue = valueProducts === "" ? 0 : Number(valueProducts);
      const { error } = await appointmentService.update(appointmentId, {
        status: "completed",
        payment_method: paymentMethod,
        value_products: parsedValue,
        description_products: descriptionProducts,
      });
      if (error) throw error;
      toast.success("Serviço concluído com sucesso.");
      setFinishingBookingId(null);
      setValueProducts("");
      setDescriptionProducts("");
      await onRefreshData();
    } catch (error) {
      console.error("[Finalize Booking Hook Error]:", error);
      toast.error("Erro ao concluir o serviço.");
    } finally { setLoading(false); }
  }, [valueProducts, descriptionProducts, onRefreshData]);

  const addCompletedAppointmentClient = useCallback(async (appointmentId: string) => {
    if (!barbershopId) return;
    setAddingClientAppointmentId(appointmentId);
    try {
      const result = await appointmentService.addClientFromCompletedAppointment(barbershopId, appointmentId);
      if (result.error) throw result.error;
      toast.success(result.alreadyExists ? "Este cliente já estava na tua lista." : "Cliente adicionado à lista.");
      await onRefreshData();
    } catch (error) {
      console.error("[Add Client From Appointment Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setAddingClientAppointmentId(null);
    }
  }, [barbershopId, onRefreshData]);

  const handleCreateBlock = useCallback(async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) return;
    const { professional_id, start_date, start_time, end_time, reason } = blockFormData;
    if (!professional_id || !start_date || !start_time || !end_time) {
      toast.error("Por favor, seleciona uma data válida para o bloqueio.");
      return;
    }
    setLoading(true);
    try {
      const payload = { professional_id, barbershop_id: barbershopId, date: start_date, start_time, end_time, reason: reason || "Bloqueio de Agenda" };
      const { error } = await createScheduleBlock(payload);
      if (error) throw error;
      toast.success("Bloqueio de horário criado com sucesso.");
      setBlockFormData({ professional_id: "", start_date: "", start_time: "", end_time: "", reason: "" });
      await onRefreshData();
    } catch (error) {
      console.error("[Create Block Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally { setLoading(false); }
  }, [barbershopId, blockFormData, onRefreshData]);

  const handleDeleteBlock = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await deleteScheduleBlock(id);
      if (error) throw error;
      toast.success("Bloqueio de horário removido.");
      await onRefreshData();
    } catch (error) {
      console.error("[Delete Block Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally { setLoading(false); }
  }, [onRefreshData]);

  const handleDeleteBooking = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await appointmentService.delete(id);
      if (error) throw error;
      toast.success("Marcação eliminada permanentemente.");
      await onRefreshData();
    } catch (error) {
      console.error("[Delete Booking Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally { setLoading(false); }
  }, [onRefreshData]);

  return {
    loadingAppointments,
    finishingBookingId,
    setFinishingBookingId,
    addingClientAppointmentId,
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
    addCompletedAppointmentClient,
    handleCreateBlock,
    handleDeleteBlock,
    handleDeleteBooking,
  };
}
