import { useState } from "react";
import { toast } from "sonner";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { getErrorMessage } from "@/app/dashboard/_lib/error-utils";
import { Professional } from "@/types";

export function useProfessionals(
  barbershopId: string | null,
  onRefreshData: () => Promise<void>,
  isFreePlan = false,
) {
  const [loadingProfessionals, setLoading] = useState<boolean>(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [newProfessionalName, setNewProfessionalName] = useState<string>("");
  const [newProfessionalCommission, setNewProfessionalCommission] =
    useState<number>(isFreePlan ? 100 : 100);

  const handleCreateProfessional = async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) return;

    if (!newProfessionalName.trim()) {
      toast.error("Introduz o nome do barbeiro.");
      return;
    }

    const commission = isFreePlan ? 100 : newProfessionalCommission;
    if (commission < 0 || commission > 100) {
      toast.error("A comissão deve estar entre 0 e 100.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await professionalService.create({
        name: newProfessionalName.trim(),
        commission_percentage: commission,
        active: true,
        barbershop_id: barbershopId,
      });

      if (error) throw error;

      toast.success("Barbeiro adicionado à equipa.");
      setNewProfessionalName("");
      setNewProfessionalCommission(isFreePlan ? 100 : 100);
      await onRefreshData();
    } catch (error) {
      console.error("[Create Professional Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfessional = async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!editingProfessional) return;

    const commission = isFreePlan
      ? 100
      : editingProfessional.commission_percentage;

    setLoading(true);
    try {
      const { error } = await professionalService.update(
        editingProfessional.id,
        {
          name: editingProfessional.name.trim(),
          active: editingProfessional.active,
          commission_percentage: commission,
        },
      );

      if (error) throw error;

      toast.success("Perfil do barbeiro atualizado.");
      setEditingProfessional(null);
      await onRefreshData();
    } catch (error) {
      console.error("[Update Professional Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await professionalService.delete(id);
      if (error) throw error;
      toast.success("Barbeiro removido.");
      await onRefreshData();
    } catch (error) {
      console.error("[Delete Professional Hook Error]:", error);
      toast.error(
        "Não foi possível remover o barbeiro. Pode ter histórico ou marcações na agenda.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
