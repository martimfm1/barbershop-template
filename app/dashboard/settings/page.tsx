"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBarbershop } from "@/context/BarbershopContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

// SERVICES
import { barbershopService } from "@/app/dashboard/_services/barbershop.service"; 
import { authService } from "@/app/dashboard/_services/auth.service"; 

// ICONS
import { 
  Settings, 
  ArrowLeft, 
  Store, 
  Clock, 
  CalendarOff, 
  Globe, 
  Bell, 
  Save, 
  LogOut 
} from "lucide-react";

interface BarbershopConfig {
  name: string;
  phone: string;
  address: string;
  opening_time: string;
  closing_time: string;
  closed_days: string; 
  allow_online_bookings: boolean;
  auto_reminders: boolean;
}

const DAYS_OF_WEEK = [
  { eng: "Monday", pt: "Segunda" },
  { eng: "Tuesday", pt: "Terça" },
  { eng: "Wednesday", pt: "Quarta" },
  { eng: "Thursday", pt: "Quinta" },
  { eng: "Friday", pt: "Sexta" },
  { eng: "Saturday", pt: "Sábado" },
  { eng: "Sunday", pt: "Domingo" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { barbershopId } = useBarbershop();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [barbershopConfig, setBarbershopConfig] = useState<BarbershopConfig>({
    name: "",
    phone: "",
    address: "",
    opening_time: "09:00",
    closing_time: "19:00",
    closed_days: "None",
    allow_online_bookings: true,
    auto_reminders: false,
  });

  // 1. FETCH DOS DADOS DE CONFIGURAÇÃO ATUAIS
  const fetchSettings = useCallback(async () => {
    if (!barbershopId) return;
    try {
      setLoading(true);
      const res = await barbershopService.getConfig(barbershopId);
      if (res.error) throw res.error;
      if (res.data) {
        setBarbershopConfig({
          ...res.data,
          auto_reminders: false,
        });
      }
    } catch (error: typeof Error | unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar as configurações do negócio.");
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (barbershopId) {
      void fetchSettings();
    }
  }, [barbershopId, fetchSettings]);

  const currentClosedDays = useMemo(() => {
    if (!barbershopConfig.closed_days || barbershopConfig.closed_days === "None") return [];
    return barbershopConfig.closed_days.split(",").map(d => d.trim());
  }, [barbershopConfig.closed_days]);

  const toggleClosedDay = (dayEng: string) => {
    let updatedDays = [...currentClosedDays];
    
    if (updatedDays.includes(dayEng)) {
      updatedDays = updatedDays.filter((d) => d !== dayEng);
    } else {
      updatedDays.push(dayEng);
    }
    
    const closedDaysString = updatedDays.length === 0 ? "None" : updatedDays.join(",");
    
    setBarbershopConfig(prev => ({
      ...prev,
      closed_days: closedDaysString
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barbershopId) {
      return;
    }

    if (!barbershopConfig?.phone || barbershopConfig.phone.trim() === "") {
      toast.error("❌ O Telefone Oficial é obrigatório!");
      return;
    }

    if (!barbershopConfig?.address   || barbershopConfig.address.trim() === "") {
      toast.error("❌ A Rua/Morada é obrigatória!");
      return;
    }

    try {
      setSubmitting(true);

      const finalPayload = {
        ...barbershopConfig,
        auto_reminders: false,
      };

      const response = await barbershopService.updateConfig(barbershopId, finalPayload);
      if (response?.error) {
        throw response.error;
      }
      
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: typeof Error | unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao gravar alterações.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSubmitting(true);
      await authService.logout();
      toast.success("Sessão terminada.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("❌ [Logout Error]:", error);
      toast.error("Erro ao efetuar logout.");
      setSubmitting(false);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white">
  //       <Spinner className="h-6 w-6 border-emerald-500 mb-2" />
  //       <p className="text-xs text-zinc-400 font-medium">A carregar configurações de produção...</p>
  //     </div>
  //   );
  // }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-6 relative z-10">
      {/* HEADER DE OPERAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
          <Settings className="text-zinc-400 size-8" /> Business Settings
        </h1>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10 cursor-pointer text-xs"
          >
            <ArrowLeft className="size-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* FORMULÁRIO DE ATUALIZAÇÃO */}
      <form onSubmit={handleSaveSettings} className="grid gap-6 md:grid-cols-2">
        
        {/* DETALHES PÚBLICOS */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-100">
              <Store className="size-4 text-emerald-400" /> Public Details
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Informações visíveis na página de agendamento do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs text-zinc-400 font-medium">Barbershop Name</label>
              <input
                type="text"
                required
                className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={barbershopConfig.name ?? ""}
                onChange={(e) => setBarbershopConfig({ ...barbershopConfig, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-zinc-400 font-medium">Official Phone</label>
              <input
                type="tel"
                className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={barbershopConfig.phone ?? ""}
                onChange={(e) => setBarbershopConfig({ ...barbershopConfig, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-zinc-400 font-medium">Address</label>
              <input
                type="text"
                className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={barbershopConfig.address ?? ""}
                onChange={(e) => setBarbershopConfig({ ...barbershopConfig, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* HORÁRIOS E AGENDAMENTO */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-100">
              <Clock className="size-4 text-blue-400" /> Schedule Configuration
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Define os limites de funcionamento e folgas da equipa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400 font-medium">Opening Time</label>
                <input
                  type="time"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark focus:outline-none focus:border-blue-500/50"
                  value={barbershopConfig.opening_time ?? "09:00"}
                  onChange={(e) => setBarbershopConfig({ ...barbershopConfig, opening_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-zinc-400 font-medium">Closing Time</label>
                <input
                  type="time"
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark focus:outline-none focus:border-blue-500/50"
                  value={barbershopConfig.closing_time ?? "19:00"}
                  onChange={(e) => setBarbershopConfig({ ...barbershopConfig, closing_time: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                <CalendarOff className="size-3.5 text-red-400" /> Dias de Folga (Encerrado)
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isClosed = currentClosedDays.includes(day.eng);
                  return (
                    <button
                      key={day.eng}
                      type="button"
                      onClick={() => toggleClosedDay(day.eng)}
                      className={cn(
                        "cursor-pointer px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex-1 min-w-[72px] text-center",
                        isClosed
                          ? "bg-red-500/20 text-red-400 border-red-500/40 font-semibold shadow-[0_0_12px_rgba(239,68,68,0.05)]"
                          : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      {day.pt}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Atualmente: <span className="text-zinc-400 font-mono font-medium">{barbershopConfig.closed_days === "None" ? "Aberto todos os dias" : barbershopConfig.closed_days}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FUNCIONALIDADES ONLINE & WHATSAPP */}
        <Card className="bg-black/40 border-white/10 md:col-span-2 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-100">
              <Globe className="size-4 text-purple-400" /> Online Platform & Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div>
                <p className="font-semibold text-zinc-100 text-sm">Accept Online Bookings</p>
                <p className="text-xs text-zinc-400 mt-0.5">Permite que clientes façam marcações autonomamente na página pública.</p>
              </div>
              <Switch
                className="cursor-pointer"
                checked={barbershopConfig.allow_online_bookings}
                onCheckedChange={(v) => setBarbershopConfig(p => ({ ...p, allow_online_bookings: v }))}
              />
            </div>
            
            {/* WHATSAPP REMINDERS - DESATIVADO */}
            <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-xl opacity-60">
              <div>
                <p className="font-semibold text-zinc-400 text-sm flex items-center gap-2">
                  <Bell className="size-3.5 text-zinc-500" /> WhatsApp Reminders 
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium border border-red-500/20">
                    Pausado
                  </span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Esta funcionalidade encontra-se temporariamente desativada.
                </p>
              </div>
              <Switch
                className="cursor-not-allowed"
                checked={false}
                disabled={true}
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer text-xs px-5 h-10 transition-colors"
              >
                {submitting ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
                Save Configurations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ZONA DE PERIGO (LOGOUT) */}
        <div className="md:col-span-2 pt-2">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <LogOut className="size-4" /> Terminar Sessão
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                Desconectar o painel administrativo. Será necessário introduzir as credenciais de acesso novamente para gerir os agendamentos.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleLogout}
              disabled={submitting}
              className="cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-4 h-9 whitespace-nowrap self-start sm:self-center transition-colors"
            >
              Sair da Conta (Logout)
            </Button>
          </div>
        </div>

      </form>
    </main>
  );
}