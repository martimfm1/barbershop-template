"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Wifi,
  WifiOff,
  Terminal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock, // Adicionado para o estado restrito
} from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type BotStatus = "CONNECTED" | "qr" | "INITIALIZING" | "ERROR" | "DISCONNECTED" | "NOT_INITIALIZED";

interface WhatsAppBotState {
  status: BotStatus;
  connected: boolean;
  logs: string[];
  qrCodeUrl: string | null;
}

interface WhatsAppBotCardProps {
  barbershopId: string | null;
  botStatus: Partial<WhatsAppBotState> | null;
  loadingWhatsapp: boolean;
}

export function WhatsAppBotCard({
  barbershopId,
  botStatus,
  loadingWhatsapp,
}: WhatsAppBotCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  
  const [state, setState] = useState<WhatsAppBotState>({
    status: "NOT_INITIALIZED",
    connected: false,
    logs: [],
    qrCodeUrl: null,
  });

  // const prevStatusRef = useRef<BotStatus | null>(null);
  // const lastPropStatusRef = useRef<BotStatus | undefined>(undefined);

  const isConnected = state.status === "CONNECTED";
  const isWaitingQR = state.status === "qr";
  const hasError = state.status === "ERROR";

  // const botStatusStatus = botStatus?.status;
  // const botStatusConnected = botStatus?.connected;
  // const botStatusQrCodeUrl = botStatus?.qrCodeUrl;
  // const botStatusLogsLength = botStatus?.logs?.length ?? 0;

  // const fetchStatus = async () => {
  //   if (!barbershopId) return;
  //   try {
  //     const res = await fetch(`/api/barbershops/${barbershopId}/whatsapp/status`);
  //     if (res.ok) {
  //       const data = await res.json();
  //       console.log("📥 [WhatsApp Polling Response]:", data);
        
  //       setState((prev) => ({
  //         ...prev,
  //         status: data.status,
  //         qrCodeUrl: data.qrCodeUrl,
  //         connected: data.status === "CONNECTED",
  //       }));
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch WhatsApp sync status", error);
  //   }
  // };

  // useEffect(() => {
  //   if (botStatusStatus !== lastPropStatusRef.current) {
  //     lastPropStatusRef.current = botStatusStatus;

  //     setState((prev) => {
  //       if ((prev.status === "INITIALIZING" || prev.status === "qr") && 
  //           (botStatusStatus === "NOT_INITIALIZED" || botStatusStatus === "INITIALIZING" || botStatusStatus === "DISCONNECTED")) {
  //         return prev;
  //       }
  //       return {
  //         ...prev,
  //         status: botStatusStatus ?? prev.status,
  //         connected: botStatusConnected ?? prev.connected,
  //         qrCodeUrl: botStatusQrCodeUrl ?? prev.qrCodeUrl,
  //       };
  //     });
  //   }
  // }, [botStatusStatus, botStatusConnected, botStatusQrCodeUrl]);

  // useEffect(() => {
  //   if (botStatus?.logs) {
  //     setState((prev) => ({ ...prev, logs: botStatus.logs ?? [] }));
  //   }
  // }, [botStatusLogsLength]);

  // useEffect(() => {
  //   if (!barbershopId) return;
  //   fetchStatus();
  // }, [barbershopId]);

  // useEffect(() => {
  //   if (!barbershopId) return;
  //   if (state.status !== "INITIALIZING" && state.status !== "qr") return;

  //   const interval = setInterval(() => {
  //     fetchStatus();
  //   }, 4000);

  //   return () => clearInterval(interval);
  // }, [barbershopId, state.status]);

  // useEffect(() => {
  //   if (!barbershopId) return;

  //   const supabase = createClient();
  //   if (!supabase) {
  //     console.error("❌ [WhatsApp Engine]: Analytics infrastructure missing environment variables.");
  //     return;
  //   }

  //   const channel = supabase
  //     .channel(`rt_whatsapp_${barbershopId}`)
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "barbershops",
  //         filter: `id=eq.${barbershopId}`,
  //       },
  //       (payload) => {
  //         const newStatus = payload.new?.whatsapp_status as BotStatus | undefined;
  //         if (newStatus) {
  //           console.log(`ℹ️ [WhatsApp Engine Realtime]: Mutating status payload to '${newStatus}'`);
  //           setState((prev) => ({ ...prev, status: newStatus }));
  //           fetchStatus();
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [barbershopId]);

  // useEffect(() => {
  //   if (prevStatusRef.current !== state.status && prevStatusRef.current !== null) {
  //     const toastId = "whatsapp-engine-status";
  //     switch (state.status) {
  //       case "CONNECTED":
  //         toast.success("WhatsApp Bot: Conectado e operacional!", { id: toastId });
  //         break;
  //       case "qr":
  //         toast.warning("WhatsApp Bot: Código QR gerado. Pronto para emparelhar.", { id: toastId });
  //         break;
  //       case "ERROR":
  //         toast.error("WhatsApp Bot: Erro crítico na ligação com o gateway.", { id: toastId });
  //         break;
  //       case "DISCONNECTED":
  //         toast.info("WhatsApp Bot: O serviço foi desligado.", { id: toastId });
  //         break;
  //     }
  //   }
  //   prevStatusRef.current = state.status;
  // }, [state.status]);

  const uiMap: Record<BotStatus, { badge: string; borderBag: string; label: string; title: string; desc: string }> = {
    CONNECTED: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      borderBag: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
      label: "LIGADO",
      title: "Assistente Virtual Ativo",
      desc: "O bot da tua barbearia está online. Os teus clientes vão receber confirmações e lembretes automaticamente.",
    },
    qr: {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      borderBag: "border-amber-500/20 bg-amber-500/5 text-amber-300",
      label: "CÓDIGO PRONTO",
      title: "Falta Conectar o Telemóvel",
      desc: "O código de ligação foi gerado com sucesso. Clica em 'Ler Código QR' abaixo para ativar o serviço.",
    },
    INITIALIZING: {
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      borderBag: "border-blue-500/20 bg-blue-500/5 text-blue-300",
      label: "A LIGAR...",
      title: "Mecanismo a Inicializar",
      desc: "A alocar canais de comunicação seguros com os contentores locais da Evolution API. Aguarda...",
    },
    ERROR: {
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      borderBag: "border-rose-500/20 bg-rose-500/5 text-rose-300",
      label: "ERRO",
      title: "Problema na Ligação",
      desc: "Ocorreu uma falha de comunicação com a instância local. Tenta redefinir o assistente.",
    },
    DISCONNECTED: {
      badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
      borderBag: "border-white/10 bg-black/40 text-zinc-300",
      label: "DESLIGADO",
      title: "Assistente Desligado",
      desc: "O serviço de envio está desativado. Liga o bot para que os teus clientes voltem a receber avisos.",
    },
    NOT_INITIALIZED: {
      badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
      borderBag: "border-white/10 bg-black/40 text-zinc-300",
      label: "DESLIGADO",
      title: "Assistente Desligado",
      desc: "O serviço de envio está desativado. Liga o bot para que os teus clientes voltem a receber avisos.",
    },
  };

  const currentUi = uiMap[state.status] || uiMap.NOT_INITIALIZED;

  const computedLogs = useMemo(() => {
    if (state.logs && state.logs.length > 0) return state.logs;

    const ts = new Date().toLocaleTimeString();
    if (isConnected) return [`[${ts}] [INFO] Service operating normally. Ready to process booking notifications.`];
    if (state.status === "INITIALIZING") return [`[${ts}] [SYSTEM] Connecting to Evolution API Gateway. Allocating secure channels...`];
    if (state.status === "qr") return [`[${ts}] [SYSTEM] QR Code successfully generated. Awaiting device authentication pairing...`];
    if (hasError) return [`[${ts}] [ERROR] Core router connection failure. Check container status.`];
    return [`[${ts}] [SYSTEM] Service pipeline stands idle. Awaiting authorization token.`];
  }, [state.logs, state.status, isConnected, hasError]);

  // const handleTogglePower = async () => {
  //   if (!barbershopId) return;

  //   setActionLoading(true);
  //   const endpoint = isConnected ? "/api/whatsapp/stop" : "/api/whatsapp/start";
  //   const actionName = isConnected ? "Desligar" : "Inicializar";

  //   if (!isConnected) {
  //     setState((prev) => ({ ...prev, status: "INITIALIZING" }));
  //   }

  //   try {
  //     const response = await fetch(endpoint, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ barbershopId }),
  //     });

  //     if (!response.ok) throw new Error(`HTTP network error received with status ${response.status}`);
  //     toast.success(`Comando de ${actionName} executado com sucesso!`);
      
  //     await fetchStatus();
  //   } catch (error) {
  //     console.error(`❌ [WhatsApp Action Runtime Error]: Failure during ${actionName} transaction`, error);
  //     toast.error(`Erro ao tentar ${actionName.toLowerCase()} o assistente.`);
  //     await fetchStatus();
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  return (
    <Card className="relative overflow-hidden border border-white/10 bg-white/[0.04] flex flex-col transition-all duration-300">
      
      {/* OVERLAY DE ACESSO RESTRITO / PAUSADO */}
      <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-6 z-50">
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-full mb-3 shadow-xl">
          <Lock className="size-6 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">Módulo Indisponível</h3>
        <p className="text-xs text-zinc-400 max-w-[240px] mt-1.5 leading-relaxed">
          Esta integração está desativada temporariamente. O sistema está a usar notificações por Email.
        </p>
      </div>

      <CardHeader>
        <CardTitle className="text-2xl text-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>WhatsApp Bot</span>
            {(loadingWhatsapp || state.status === "INITIALIZING") && (
              <RefreshCw className="size-4 animate-spin text-zinc-500" />
            )}
          </div>
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold border", currentUi.badge)}>
            {currentUi.label}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div className={cn("rounded-xl border p-4 transition-all duration-300", currentUi.borderBag)}>
          <div className="flex items-start gap-3">
            {isConnected ? (
              <CheckCircle2 className="size-5 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className={cn("size-5 mt-0.5 shrink-0", isWaitingQR && "text-amber-400 animate-pulse", hasError && "text-rose-400")} />
            )}
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-semibold text-zinc-100">{currentUi.title}</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{currentUi.desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            disabled={true}
            // onClick={handleTogglePower}
            className={cn(
              "text-white h-10 transition-colors cursor-not-allowed pointer-events-none border border-transparent",
              isConnected 
                ? "bg-rose-600/90 hover:bg-rose-600 text-white" 
                : "bg-emerald-600/90 hover:bg-emerald-600 text-white"
            )}
          >
            {actionLoading ? (
              <RefreshCw className="size-4 mr-2 animate-spin" />
            ) : isConnected ? (
              <WifiOff className="size-4 mr-2" />
            ) : (
              <Wifi className="size-4 mr-2" />
            )}
            {isConnected ? "Desligar Bot" : "Ligar Bot"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={true} variant="ghost" className="h-10 text-white border border-white/10 bg-transparent hover:bg-white/5 cursor-not-allowed">
                <Terminal className="size-4 mr-2" /> Ver Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[500px] bg-zinc-950 border-white/10 font-mono text-[11px] rounded-xl text-white">
              <DialogHeader>
                <DialogTitle className="text-zinc-500 text-[10px] uppercase flex items-center gap-3 pr-12">
                  <span>Relatório de Diagnóstico (Suporte)</span>
                  <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-sans tracking-normal normal-case font-medium border", currentUi.badge)}>
                    <span className={cn("size-1.5 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                    {currentUi.label}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="h-64 overflow-y-auto space-y-0.5 p-2 bg-black rounded border border-white/5 scrollbar-thin text-zinc-400">
                {computedLogs.map((log, i) => (
                  <div key={i} className="border-l-2 border-white/5 pl-2 py-0.5 break-all">
                    {log}
                  </div>
                ))}
              </div>
              <DialogDescription className="text-xs text-zinc-500 mt-2">
                Este é o relatório de diagnóstico para suporte técnico.
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={true}
              className={cn(
                "w-full h-10 transition-all cursor-not-allowed border border-white/5",
                isWaitingQR 
                  ? "bg-amber-600 text-white font-medium shadow-lg shadow-amber-600/10" 
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              )}
            >
              <QrCode className="size-4 mr-2" />
              {isConnected ? "Dispositivo Conectado" : "Ler Código QR"}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Vincular WhatsApp da Barbearia</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6 gap-4">
              {isWaitingQR && state.qrCodeUrl ? (
                <div className="space-y-4 text-center">
                  <div className="p-3 bg-white rounded-xl inline-block shadow-2xl">
                    <img 
                      src={state.qrCodeUrl.startsWith("data:") ? state.qrCodeUrl : `data:image/png;base64,${state.qrCodeUrl}`} 
                      alt="WhatsApp QR Code" 
                      className="size-48 object-contain" 
                    />
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Abre o WhatsApp no teu telemóvel, vai a <b>Definições &gt; Dispositivos Associados</b> e aponta a câmara para este código.
                  </p>
                </div>
              ) : (
                <div className="size-48 bg-zinc-900 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 text-center p-6 rounded-xl">
                  {isConnected ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="size-8 text-emerald-500" />
                      <p className="text-xs text-emerald-400 font-medium px-2">Dispositivo emparelhado com sucesso!</p>
                    </div>
                  ) : state.status === "INITIALIZING" || (isWaitingQR && !state.qrCodeUrl) ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="size-6 text-blue-400 animate-spin" />
                      <p className="text-xs text-blue-400 font-medium">A extrair fluxo de emparelhamento...</p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">O bot está offline. Clica em &aposLigar Bot&apos para inicializar.</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}