import { useState, useCallback } from "react";
import { toast } from "sonner";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { createScheduleBlock, deleteScheduleBlock } from "@/app/dashboard/_services/schedule-blocks.service";
import { combineDatetime } from "@/app/dashboard/_lib/date-utils";
import { getErrorMessage } from "@/app/dashboard/_lib/error-utils";

export function useAppointments(
  barbershopId: string | null,
  onRefreshData: () => Promise<void>,
) {
  const [loadingAppointments, setLoading] = useState<boolean>(false);
  const [finishingBookingId, setFinishingBookingId] = useState<string | null>(null);
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

  const [blockFormData, setBlockFormData] = useState({
    professionalId: "",
    date: "",
    startTime: "",
    endTime: "",
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

      toast.success("Booking created successfully.");
      setBookingFormData({
        clientId: "",
        serviceId: "",
        professionalId: "",
        date: "",
        time: "",
        manualName: "",
        manualPhone: "",
      });
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Create Booking Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [barbershopId, bookingFormData, onRefreshData]);

  const confirmBooking = useCallback(async (appointmentId: string) => {
    setLoading(true);
    try {
      const { error } = await appointmentService.update(appointmentId, {
        status: "scheduled",
      });

      if (error) throw error;

      toast.success("Booking confirmed successfully.");
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Confirm Booking Hook Error]:", error);
      toast.error("Error confirming booking.");
    } finally {
      setLoading(false);
    }
  }, [onRefreshData]);

  const finalizeBooking = useCallback(
    async (appointmentId: string, paymentMethod: string) => {
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

        toast.success("Booking completed successfully.");
        setFinishingBookingId(null);
        setValueProducts("");
        setDescriptionProducts("");
        await onRefreshData();
      } catch (error) {
        console.error("❌ [Finalize Booking Hook Error]:", error);
        toast.error("Error completing booking.");
      } finally {
        setLoading(false);
      }
    },
    [valueProducts, descriptionProducts, onRefreshData],
  );

  const handleCreateBlock = useCallback(async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) return;

    // 1. Validação preventiva no Frontend
    const { professionalId, date, startTime, endTime, reason } = blockFormData;
    if (!date || date.trim() === "") {
      toast.error("Por favor, seleciona uma data válida para o bloqueio.");
      return;
    }

    setLoading(true);
    try {
      // 2. Transforma strings vazias ("") em null para evitar o erro 22007 do Postgres
      const payload = {
        professional_id: professionalId || null,
        barbershop_id: barbershopId,
        date: date || null, // Se ainda assim passar vazio, vai como null
        start_time: startTime || null,
        end_time: endTime || null,
        reason: reason || "Bloqueio de Agenda",
      };

      console.log("[Create Block Payload]", payload);

      const { error } = await createScheduleBlock(payload);

      if (error) throw error;

      toast.success("Schedule block created successfully.");
      setBlockFormData({ professionalId: "", date: "", startTime: "", endTime: "", reason: "" });
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Create Block Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [barbershopId, blockFormData, onRefreshData]);

  const handleDeleteBlock = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await deleteScheduleBlock(id);
      if (error) throw error;
      toast.success("Schedule block removed successfully.");
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Delete Block Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [onRefreshData]);

  const handleDeleteBooking = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await appointmentService.delete(id);
      if (error) throw error;
      toast.success("Booking permanently deleted.");
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Delete Booking Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [onRefreshData]);

  return {
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
  };
}