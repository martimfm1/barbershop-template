import { useState } from "react";
import { toast } from "sonner";
import { professionalService } from "@/app/dashboard/_services/professionals.service";
import { getErrorMessage } from "@/app/dashboard/_lib/error-utils";
import { Professional } from "@/types";

export function useProfessionals(
  barbershopId: string | null,
  onRefreshData: () => Promise<void>,
) {
  const [loadingProfessionals, setLoading] = useState<boolean>(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [newProfessionalName, setNewProfessionalName] = useState<string>("");
  const [newProfessionalCommission, setNewProfessionalCommission] = useState<number>(100);

  const handleCreateProfessional = async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!barbershopId) return;

    if (!newProfessionalName.trim()) {
      toast.error("Introduz o nome do barbeiro/colaborador.");
      return;
    }

    if (newProfessionalCommission === null || newProfessionalCommission < 0 || newProfessionalCommission > 100) {
      toast.error("A comissão deve estar entre 0 e 100.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await professionalService.create({
        name: newProfessionalName.trim(),
        commission_percentage: newProfessionalCommission,
        active: true,
        barbershop_id: barbershopId,
      });

      if (error) throw error;

      toast.success("Barbeiro registado na equipa!");
      setNewProfessionalName("");
      setNewProfessionalCommission(0);
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Create Professional Hook Error]:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfessional = async (e?: React.SyntheticEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (!editingProfessional) return;

    setLoading(true);
    try {
      const { error } = await professionalService.update(editingProfessional.id, {
        name: editingProfessional.name.trim(),
        active: editingProfessional.active,
        commission_percentage: editingProfessional.commission_percentage,
      });

      if (error) throw error;

      toast.success("Perfil do profissional atualizado.");
      setEditingProfessional(null);
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Update Professional Hook Error]:", error);
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
      toast.success("Profissional removido.");
      await onRefreshData();
    } catch (error) {
      console.error("❌ [Delete Professional Hook Error]:", error);
      toast.error("Erro. O barbeiro possui histórico ou marcações na agenda.");
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