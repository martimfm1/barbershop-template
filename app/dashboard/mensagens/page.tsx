"use client";

import { useState, useCallback, useEffect } from "react";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import Link from "next/link";
import { Client } from "@/types";
import { appointmentService } from "@/app/dashboard/_services/appointments.service";
import { ManualMessageForm } from "@/app/dashboard/_components/cards/ManualMessageFormCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function MensagensPage() {
  const { barbershopId, loading: isLoadingBarbershop } = useBarbershop();
  const [clients, setClients] = useState<Client[]>([]);
  const [reminderClientId, setReminderClientId] = useState("manual");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [manualMessage, setManualMessage] = useState({ phone: "", text: "" });
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!barbershopId) return;
    try {
      const res = await appointmentService.getClients(barbershopId);
      if (res.error) throw res.error;
      setClients(res.data ?? []);
    } catch (error) {
      console.error("❌ [Mensagens Sync Error]:", error);
      toast.error("Erro ao carregar os clientes.");
    }
  }, [barbershopId]);

  useEffect(() => {
    if (isLoadingBarbershop) return;
    if (barbershopId) {
      queueMicrotask(() => void fetchClients());
    }
  }, [barbershopId, fetchClients, isLoadingBarbershop]);

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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Mensagens
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Envia mensagens rápidas aos teus clientes.
          </p>
        </div>
        <Link href="/dashboard" className="flex-1 sm:flex-none">
          <Button
            variant="ghost"
            className="w-full sm:w-auto min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
          </Button>
        </Link>
      </header>

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
    </main>
  );
}