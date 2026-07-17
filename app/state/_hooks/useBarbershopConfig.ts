import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  barbershopService,
  BarbershopConfigPayload,
} from "@/app/dashboard/_services/barbershop.service";
import { getErrorMessage } from "@/app/dashboard/_lib/error-utils";

export function useBarbershopConfig(barbershopId: string | null) {
  const [loading, setLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<BarbershopConfigPayload | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!barbershopId) return;
    setLoading(true);
    try {
      const { data, error } = await barbershopService.getConfig(barbershopId);
      if (error) throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error("❌ [Fetch Barbershop Config Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  const handleUpdateConfig = async (
    fieldsToUpdate: Partial<BarbershopConfigPayload>,
    e?: React.SyntheticEvent,
  ) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) {
      toast.error("Identificador da barbearia em falta.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await barbershopService.updateConfig(
        barbershopId,
        fieldsToUpdate,
      );
      if (error) throw error;
      toast.success("Configurações guardadas!");
      await fetchConfig();
    } catch (error) {
      console.error("❌ [Update Barbershop Config Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleClosedDay = async (dayIndex: number) => {
    if (!config || !barbershopId) return;
    const currentDays = config.closed_days ? config.closed_days.split(",") : [];
    const dayStr = dayIndex.toString();

    let updatedDays: string[];
    if (currentDays.includes(dayStr)) {
      updatedDays = currentDays.filter((d) => d !== dayStr);
    } else {
      updatedDays = [...currentDays, dayStr].sort();
    }

    const newClosedDaysString = updatedDays.join(",");
    setLoading(true);
    try {
      const { error } = await barbershopService.updateConfig(barbershopId, {
        closed_days: newClosedDaysString,
      });
      if (error) throw error;
      setConfig({ ...config, closed_days: newClosedDaysString });
      toast.success("Dia de descanso atualizado.");
    } catch (error) {
      console.error("❌ [Toggle Closed Day Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barbershopId) {
      fetchConfig();
    }
  }, [barbershopId, fetchConfig]);

  return {
    config,
    setConfig,
    loading,
    fetchConfig,
    handleUpdateConfig,
    toggleClosedDay,
  };
}