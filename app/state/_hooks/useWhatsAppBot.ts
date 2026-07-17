import { useState, useEffect, useCallback } from "react";

export type BotStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

export interface UseWhatsAppBotReturn {
  botStatus: BotStatus;
  loadingWhatsapp: boolean;
  sendingMessage: boolean;
  sendManualMessage: (phone: string, text: string) => Promise<void>;
}

export function useWhatsAppBot(barbershopId: string): UseWhatsAppBotReturn {
  const [botStatus, setBotStatus] = useState<BotStatus>("DISCONNECTED");
  const [loadingWhatsapp, setLoadingWhatsapp] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  const fetchBotStatus = useCallback(async () => {
    if (!barbershopId) return;

    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/whatsapp/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP status error: ${response.status}`);
      }

      const data = await response.json();
      setBotStatus(data.status || "DISCONNECTED");
    } catch (error) {
      console.error("❌ [WhatsApp Bot Hook Status Fetch Failed]:", error);
      setBotStatus("DISCONNECTED");
    } finally {
      setLoadingWhatsapp(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    fetchBotStatus();

    const statusInterval = setInterval(() => {
      void fetchBotStatus();
    }, 20000);

    return () => clearInterval(statusInterval);
  }, [fetchBotStatus]);

  const sendManualMessage = useCallback(async (phone: string, text: string) => {
    if (!barbershopId || !phone || !text) {
      throw new Error("Missing missing required parameters for sending message");
    }

    setSendingMessage(true);

    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/whatsapp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP status error: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ [WhatsApp Bot Hook Send Message Failed]:", error);
      throw error;
    } finally {
      setSendingMessage(false);
    }
  }, [barbershopId]);

  return {
    botStatus,
    loadingWhatsapp,
    sendingMessage,
    sendManualMessage,
  };
}