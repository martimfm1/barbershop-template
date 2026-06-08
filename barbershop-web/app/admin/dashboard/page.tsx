"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { SiteNavbar } from "@/components/site-navbar";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  MessageCircle,
  Plus,
  Check,
  X,
  QrCode,
  Trash2,
  XCircle,
  Users,
  UserPlus,
  Wifi,
  WifiOff,
  Search,
  Phone,
  Sparkles,
  Mail,
} from "lucide-react";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const chartConfig = {
  bookings: { label: "Bookings", color: "rgba(250,250,250,0.9)" },
  revenue: { label: "Revenue", color: "rgba(161,161,170,0.65)" },
} satisfies ChartConfig;

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pendente: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    agendado: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    concluido: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    cancelado: "border-red-400/20 bg-red-400/10 text-red-200",
  } as const;

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        styles[status as keyof typeof styles] ??
          "border-white/15 bg-white/5 text-zinc-300",
      )}
    >
      {displayStatus}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [botStatus, setBotStatus] = useState("loading");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [barbeariaId, setBarbeariaId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Controladores de visibilidade
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManualMessageForm, setShowManualMessageForm] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showAddClientForm, setShowAddClientForm] = useState(false);

  // Estado para a pesquisa ativa de clientes
  const [searchClientQuery, setSearchClientQuery] = useState("");

  // Estados dos formulários de Agendamento
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [formData, setFormData] = useState({
    nome_completo: "",
    num_telemovel: "",
    email: "",
    servico_id: "",
    status: "agendado",
  });

  // Estado do formulário de criação rápida de Clientes (🔥 Adicionado campo email)
  const [newClientData, setNewClientData] = useState({
    nome_completo: "",
    num_telemovel: "",
    email: "",
  });

  // Estados do formulário de Lembretes Avançados
  const [reminderClienteId, setReminderClienteId] = useState<string>("manual");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [manualMessage, setManualMessage] = useState({
    telemovel: "",
    texto: "",
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  const AVERAGE_TICKET_PRICE = 20;

  // 1. Monitorizar Estado do Bot do WhatsApp
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp");
        const data = await res.json();
        setBotStatus(data.status);
      } catch (error) {
        setBotStatus("offline");
      }
    };

    checkBotStatus();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Procurar Dados Iniciais no Supabase
  const fetchInitialData = async () => {
    const { data: appData, error: appError } = await supabase
      .from("agendamentos")
      .select(
        `
        *,
        clientes_perfis (nome_completo, num_telemovel),
        servicos (nome, preco)
      `,
      )
      .order("data_hora", { ascending: false });

    if (appData) setAppointments(appData);
    if (appError) console.error("Erro a buscar agendamentos:", appError);

    const { data: servData } = await supabase
      .from("servicos")
      .select("id, nome, preco, duracao_minutos")
      .order("nome", { ascending: true });

    if (servData) setServicos(servData);

    const { data: clientData, error: clientError } = await supabase
      .from("clientes_perfis")
      .select("id, nome_completo, num_telemovel, email")
      .order("nome_completo", { ascending: true });

    if (clientData) setClientes(clientData);
    if (clientError) console.error("Erro a buscar clientes:", clientError);

    const { data: barbData } = await supabase
      .from("barbearias")
      .select("id")
      .limit(1);
    if (barbData && barbData.length > 0) {
      setBarbeariaId(barbData[0].id);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtragem reativa de clientes
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const query = searchClientQuery.toLowerCase();
      const nome = (c.nome_completo || "").toLowerCase();
      const tel = c.num_telemovel || "";
      const mail = (c.email || "").toLowerCase();
      return (
        nome.includes(query) || tel.includes(query) || mail.includes(query)
      );
    });
  }, [clientes, searchClientQuery]);

  // Aplicar Template de Mensagem
  const aplicarTemplateMensagem = (clientId: string, templateKey: string) => {
    let tlm = "";
    let nome = "Cliente";

    if (clientId !== "manual") {
      const client = clientes.find((c) => c.id === clientId);
      if (client) {
        tlm = client.num_telemovel || "";
        nome = client.nome_completo.split(" ")[0];
      }
    } else {
      tlm = manualMessage.telemovel;
    }

    let textoResultante = "";
    if (templateKey === "reminder_tomorrow") {
      textoResultante = `Olá ${nome}! 👋 Passamos para lembrar que tens um corte agendado connosco amanhã. Confirmas a tua presença? Até já! 💈`;
    } else if (templateKey === "miss_you") {
      textoResultante = `Olá ${nome}! 🔥 Já sentimos a falta desse corte alinhado por cá. Que tal agendarmos uma hora para esta semana? Abraço da equipa! ✂️`;
    }

    setManualMessage({ telemovel: tlm, texto: textoResultante });
  };

  // Criar Novo Utilizador/Cliente no Sistema (🔥 Corrigido para incluir o campo email)
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (
      !newClientData.nome_completo ||
      !newClientData.num_telemovel ||
      !newClientData.email
    ) {
      alert("Preenche o nome, o telemóvel e o e-mail do cliente.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("clientes_perfis")
        .insert([
          {
            nome_completo: newClientData.nome_completo.trim(),
            num_telemovel: newClientData.num_telemovel.trim(),
            email: newClientData.email.trim().toLowerCase(),
            barbearia_id: barbeariaId || null,
          },
        ])
        .select();

      if (error) throw error;

      alert("Cliente adicionado com sucesso!");
      setNewClientData({ nome_completo: "", num_telemovel: "", email: "" });
      setShowAddClientForm(false);

      await fetchInitialData();
    } catch (error: any) {
      alert(`Erro ao registar cliente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar Status de Agendamento
  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app,
        ),
      );
    }
  };

  // Remover Agendamento
  const deleteAppointment = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar este agendamento?"))
      return;
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (!error) setAppointments((prev) => prev.filter((app) => app.id !== id));
  };

  // Criar Agendamento Manual
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (
      !formData.nome_completo ||
      !formData.num_telemovel ||
      !formData.servico_id ||
      !selectedDate
    ) {
      alert("Preenche todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      const { data: clienteExistente } = await supabase
        .from("clientes_perfis")
        .select("id, barbearia_id")
        .eq("num_telemovel", formData.num_telemovel.trim())
        .maybeSingle();

      const finalBarbeariaId = clienteExistente?.barbearia_id || barbeariaId;

      const payload = {
        barbearia_id: finalBarbeariaId,
        cliente_id: clienteExistente ? clienteExistente.id : null,
        servico_id: formData.servico_id,
        data_hora: combinedDateTime.toISOString(),
        status: formData.status,
      };

      const { data, error } = await supabase
        .from("agendamentos")
        .insert([payload]).select(`
          *,
          clientes_perfis (nome_completo, num_telemovel),
          servicos (nome, preco)
        `);

      if (error) throw error;

      if (data) {
        setAppointments((prev) => [data[0], ...prev]);
        setShowAddForm(false);
        setFormData({
          nome_completo: "",
          num_telemovel: "",
          email: "",
          servico_id: "",
          status: "agendado",
        });
        setSelectedDate("");
        setSelectedTime("09:00");
        alert("Agendamento criado!");
        fetchInitialData();
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Disparar Mensagem via Bot API
  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemovel: manualMessage.telemovel,
          mensagem: manualMessage.texto,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Lembrete enviado!");
        setManualMessage({ telemovel: "", texto: "" });
        setShowManualMessageForm(false);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      alert("Erro ao conectar com a API.");
    } finally {
      setSendingMessage(false);
    }
  };

  const abrirMensagemParaCliente = (telemovel: string, nome: string) => {
    setReminderClienteId("manual");
    setSelectedTemplate("custom");
    setManualMessage({
      telemovel: telemovel,
      texto: `Olá ${nome.split(" ")[0]}! 👋 Passava por cá para alinhar contigo o teu próximo corte. Quando tiveres disponibilidade, avisa! 💈`,
    });
    setShowManualMessageForm(true);
    setShowAddForm(false);
    setShowClientsList(false);
    setShowAddClientForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const botConnected = botStatus === "connected";

  // Métricas Dinâmicas
  const todayCuts = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter(
      (app) =>
        new Date(app.data_hora).toDateString() === today &&
        app.status !== "cancelado",
    );
  }, [appointments]);

  const pendingCount = appointments.filter(
    (a) => a.status === "agendado" || a.status === "pendente",
  ).length;

  const totalRevenue = useMemo(() => {
    return appointments
      .filter((a) => a.status === "concluido")
      .reduce(
        (acc, app) =>
          acc + (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE),
        0,
      );
  }, [appointments]);

  const totalBookings = appointments.length;

  const dynamicChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayApps = appointments.filter(
        (a) => new Date(a.data_hora).toDateString() === d.toDateString(),
      );
      const dayRevenue = dayApps
        .filter((a) => a.status === "concluido")
        .reduce(
          (acc, app) =>
            acc + (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE),
          0,
        );

      data.push({
        day: dayName,
        bookings: dayApps.length,
        revenue: dayRevenue,
      });
    }
    return data;
  }, [appointments]);

  const metrics = [
    {
      label: "Total Revenue",
      value: `${totalRevenue.toFixed(2)} EUR`,
      change: "Cortes concluídos",
      icon: CircleDollarSign,
    },
    {
      label: "Total Bookings",
      value: totalBookings.toString(),
      change: "Histórico total",
      icon: CalendarCheck,
    },
    {
      label: "Pending Cuts",
      value: pendingCount.toString(),
      change: "Aguardam atenção",
      icon: Activity,
    },
    {
      label: "Today's Cuts",
      value: todayCuts.length.toString(),
      change: "Agendados para hoje",
      icon: Users,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteNavbar />
      <BackgroundBeams className="opacity-35" />
      <Spotlight className="opacity-70" />

      <div className="relative px-3 pb-8 pt-8 text-foreground sm:px-5 md:px-8 md:pb-12">
        <div className="relative mx-auto grid w-full max-w-7xl gap-8">
          {/* Quick Actions */}
          <section className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowManualMessageForm(false);
                setShowClientsList(false);
                setShowAddClientForm(false);
              }}
              type="button"
              className={cn(
                "interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-5 text-left transition-colors",
                showAddForm
                  ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
              )}
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                <Plus className="size-4" />
              </span>
              <span className="block font-heading text-sm md:text-xl font-semibold text-zinc-50">
                Novo Agendamento
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Marcar hora de balcão
              </span>
            </button>

            <button
              onClick={() => {
                setShowAddClientForm(!showAddClientForm);
                setShowAddForm(false);
                setShowManualMessageForm(false);
                setShowClientsList(false);
              }}
              type="button"
              className={cn(
                "interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-5 text-left transition-colors",
                showAddClientForm
                  ? "border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/30"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
              )}
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                <UserPlus className="size-4" />
              </span>
              <span className="block font-heading text-sm md:text-xl font-semibold text-zinc-50">
                Criar Cliente
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Adicionar novo à base
              </span>
            </button>

            <button
              onClick={() => {
                setShowManualMessageForm(!showManualMessageForm);
                setShowAddForm(false);
                setShowClientsList(false);
                setShowAddClientForm(false);
              }}
              type="button"
              className={cn(
                "interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-5 text-left transition-colors",
                showManualMessageForm
                  ? "border-green-500/40 bg-green-500/10 ring-1 ring-green-500/30"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
              )}
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                <MessageCircle className="size-4" />
              </span>
              <span className="block font-heading text-sm md:text-xl font-semibold text-zinc-50">
                Lembretes WP
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Templates via WhatsApp
              </span>
            </button>

            <button
              onClick={() => {
                setShowClientsList(!showClientsList);
                setShowAddForm(false);
                setShowManualMessageForm(false);
                setShowAddClientForm(false);
              }}
              type="button"
              className={cn(
                "interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-5 text-left transition-colors",
                showClientsList
                  ? "border-zinc-500/40 bg-white/10 ring-1 ring-zinc-500/30"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
              )}
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                <Users className="size-4" />
              </span>
              <span className="block font-heading text-sm md:text-xl font-semibold text-zinc-50">
                Ver Lista
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Histórico de clientes
              </span>
            </button>
          </section>

          {/* FORMULÁRIO ATUALIZADO: CRIAR CLIENTE (Com Espaço para E-mail) */}
          {showAddClientForm && (
            <Card className="border border-blue-500/20 bg-black/40 backdrop-blur-md shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <UserPlus className="size-5" /> Registar Novo Cliente no
                  Sistema
                </CardTitle>
                <CardDescription>
                  Cria o perfil completo do utilizador incluindo o e-mail
                  obrigatório.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateClient}
                  className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end"
                >
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Antunes"
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500"
                      value={newClientData.nome_completo}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          nome_completo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Número de Telemóvel
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 919999999"
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500"
                      value={newClientData.num_telemovel}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          num_telemovel: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/* 🔥 NOVO CAMPO: EMAIL */}
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      E-mail do Cliente
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: carlos@email.com"
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500"
                      value={newClientData.email}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white hover:bg-blue-500 h-10 px-4"
                    >
                      {loading ? "A processar..." : "Adicionar Cliente"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* FORMULÁRIO DE NOVO AGENDAMENTO */}
          {showAddForm && (
            <Card className="border border-emerald-500/20 bg-black/40 backdrop-blur-md shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <Plus className="size-5" /> Novo Agendamento Manual
                </CardTitle>
                <CardDescription>
                  Insira os dados. Se o telemóvel corresponder a um cliente
                  existente, o sistema associa-o automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateBooking}
                  className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end"
                >
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Preenchimento Rápido (Opcional)
                    </label>
                    <select
                      className="bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-300 color-scheme-dark"
                      onChange={(e) => {
                        const cl = clientes.find(
                          (c) => c.id === e.target.value,
                        );
                        if (cl)
                          setFormData({
                            ...formData,
                            nome_completo: cl.nome_completo,
                            num_telemovel: cl.num_telemovel,
                            email: cl.email || "",
                          });
                      }}
                    >
                      <option value="">-- Escolher da lista --</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                      value={formData.nome_completo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nome_completo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Telemóvel
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 912345678"
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                      value={formData.num_telemovel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          num_telemovel: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Serviço Pretendido
                    </label>
                    <select
                      required
                      className="bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                      value={formData.servico_id}
                      onChange={(e) =>
                        setFormData({ ...formData, servico_id: e.target.value })
                      }
                    >
                      <option value="" disabled>
                        -- Escolha um serviço --
                      </option>
                      {servicos.map((serv) => (
                        <option
                          key={serv.id}
                          value={serv.id}
                          className="text-white bg-zinc-950"
                        >
                          {serv.nome} ({Number(serv.preco).toFixed(2)}€)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Data do Corte
                    </label>
                    <input
                      type="date"
                      required
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium">
                      Hora do Corte
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        required
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 h-10 px-4 shrink-0"
                      >
                        {loading ? "..." : "Gravar"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* FORMULÁRIO DE LEMBRETES MANUAIS */}
          {showManualMessageForm && (
            <Card className="border border-green-500/20 bg-zinc-950/80 backdrop-blur-md shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2 text-xl">
                  <MessageCircle className="size-5" /> Enviar Lembrete
                  Inteligente via WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendManualMessage} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="grid gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        Destinatário
                      </label>
                      <select
                        className="h-10 bg-zinc-900 border border-white/10 rounded-lg px-3 text-sm text-white color-scheme-dark"
                        value={reminderClienteId}
                        onChange={(e) => {
                          setReminderClienteId(e.target.value);
                          aplicarTemplateMensagem(
                            e.target.value,
                            selectedTemplate,
                          );
                        }}
                      >
                        <option value="manual">
                          ⚡ Número Manual / Não Registado
                        </option>
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        Template
                      </label>
                      <select
                        className="h-10 bg-zinc-900 border border-white/10 rounded-lg px-3 text-sm text-green-400 font-medium color-scheme-dark"
                        value={selectedTemplate}
                        onChange={(e) => {
                          setSelectedTemplate(e.target.value);
                          aplicarTemplateMensagem(
                            reminderClienteId,
                            e.target.value,
                          );
                        }}
                      >
                        <option value="custom">
                          ✍️ Mensagem Personalizada / Livre
                        </option>
                        <option value="reminder_tomorrow">
                          ⏰ Lembrete de Agendamento (Amanhã)
                        </option>
                        <option value="miss_you">
                          ✂️ Reativação de Cliente Ausente
                        </option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        Telemóvel Destino
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 912345678"
                        disabled={reminderClienteId !== "manual"}
                        className="h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white disabled:opacity-50"
                        value={manualMessage.telemovel}
                        onChange={(e) =>
                          setManualMessage({
                            ...manualMessage,
                            telemovel: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="size-3 text-green-400" /> Conteúdo da
                      Mensagem
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none resize-none"
                      value={manualMessage.texto}
                      onChange={(e) =>
                        setManualMessage({
                          ...manualMessage,
                          texto: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowManualMessageForm(false)}
                      className="border-white/10 text-zinc-400"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={sendingMessage || !botConnected}
                      className="bg-green-600 text-white hover:bg-green-500 px-6"
                    >
                      {sendingMessage ? "A enviar..." : "Disparar Mensagem"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* LISTA DE CLIENTES REGISTADOS */}
          {showClientsList && (
            <Card className="border border-zinc-500/20 bg-zinc-950/80 backdrop-blur-md shadow-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <CardTitle className="text-zinc-300 flex items-center gap-2 text-xl">
                    <Users className="size-5" /> Base de Dados de Clientes (
                    {clientes.length})
                  </CardTitle>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Procurar por nome, telefone ou email..."
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 text-xs text-white outline-none"
                    value={searchClientQuery}
                    onChange={(e) => setSearchClientQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredClientes.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Nenhum cliente encontrado.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-[300px] overflow-y-auto pr-1">
                    {filteredClientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm text-zinc-100">
                            {cliente.nome_completo}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                            <Phone className="size-3 text-zinc-600" />{" "}
                            {cliente.num_telemovel}
                          </p>
                          {cliente.email && (
                            <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5 truncate">
                              <Mail className="size-3 text-zinc-600" />{" "}
                              {cliente.email}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              abrirMensagemParaCliente(
                                cliente.num_telemovel,
                                cliente.nome_completo,
                              )
                            }
                            className="h-7 px-2.5 text-xs text-green-400 hover:bg-green-500/10"
                          >
                            <MessageCircle className="size-3 mr-1" /> Mensagem
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas e Gráficos */}
          <section className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="interactive-card border border-white/10 bg-white/[0.04] shadow-none"
              >
                <CardHeader className="flex-row items-start justify-between p-3 md:p-4">
                  <div>
                    <CardDescription className="text-xs md:text-sm">
                      {metric.label}
                    </CardDescription>
                    <CardTitle className="mt-2 md:mt-3 font-heading text-xl md:text-2xl lg:text-4xl text-zinc-50">
                      {metric.value}
                    </CardTitle>
                  </div>
                  <span className="flex size-8 md:size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200">
                    <metric.icon className="size-4 md:size-5" />
                  </span>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <p className="text-xs md:text-sm text-zinc-400">
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Progressão Semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4">
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full"
                >
                  <AreaChart data={dynamicChartData}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="var(--color-revenue)"
                      fillOpacity={0.12}
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                    <Line
                      dataKey="bookings"
                      type="monotone"
                      stroke="var(--color-bookings)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none flex flex-col">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Cortes de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 grid gap-2 overflow-y-auto max-h-[250px]">
                {todayCuts.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">
                    Nenhum corte agendado para hoje.
                  </p>
                ) : (
                  todayCuts.map((cut) => (
                    <div
                      key={cut.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-2.5 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-xs text-zinc-100">
                          {cut.clientes_perfis?.nome_completo ||
                            cut.nome_manual ||
                            "Manual"}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {cut.servicos?.nome}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {new Date(cut.data_hora).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Gestão de Reservas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs md:text-sm">
                  <thead className="text-zinc-500 border-b border-white/10 uppercase text-[11px]">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Cliente</th>
                      <th className="py-2 pr-4 font-medium">Telemóvel</th>
                      <th className="py-2 pr-4 font-medium">Serviço</th>
                      <th className="py-2 pr-4 font-medium">Data & Hora</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => {
                      const dataObj = new Date(appointment.data_hora);
                      const status = appointment.status;
                      const telemovel =
                        appointment.clientes_perfis?.num_telemovel ||
                        appointment.telemovel_manual;
                      const nome =
                        appointment.clientes_perfis?.nome_completo ||
                        appointment.nome_manual ||
                        "Cliente Manual";

                      return (
                        <tr
                          key={appointment.id}
                          className="border-b border-white/5 hover:bg-white/[0.01]"
                        >
                          <td className="py-3 pr-4 font-semibold text-zinc-100">
                            {nome}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {telemovel || "N/A"}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {appointment.servicos?.nome}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {dataObj.toLocaleDateString("pt-PT")}{" "}
                            <span className="text-zinc-500 ml-1">
                              {dataObj.toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={status} />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {telemovel && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    abrirMensagemParaCliente(telemovel, nome)
                                  }
                                  className="h-7 px-2 text-green-400 hover:bg-green-500/10"
                                >
                                  <MessageCircle className="size-3.5" />
                                </Button>
                              )}
                              {status === "agendado" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateAppointmentStatus(
                                      appointment.id,
                                      "concluido",
                                    )
                                  }
                                  className="h-7 px-2 bg-emerald-400/10 text-emerald-200"
                                >
                                  <Check className="size-3.5" />
                                </Button>
                              )}
                              {(status === "agendado" ||
                                status === "pendente") && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateAppointmentStatus(
                                      appointment.id,
                                      "cancelado",
                                    )
                                  }
                                  className="h-7 px-2 bg-red-400/10 text-red-200"
                                >
                                  <XCircle className="size-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  deleteAppointment(appointment.id)
                                }
                                className="h-7 px-2 text-zinc-500 hover:text-red-400"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="interactive-card border border-white/10 bg-white/4 shadow-none flex flex-col">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  WhatsApp Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 flex-1 flex flex-col gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 rounded-full animate-pulse",
                          botStatus === "connected"
                            ? "bg-emerald-400"
                            : "bg-red-400",
                        )}
                      />
                      <p className="font-semibold text-xs text-zinc-100">
                        {botStatus === "connected"
                          ? "WhatsApp Ativo"
                          : `Status: ${botStatus}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-auto grid gap-2">
                  <Button
                    onClick={async () => {
                      await fetch("/api/whatsapp/start", { method: "POST" });
                      alert("Inicializado!");
                    }}
                    className="h-9 rounded-full bg-emerald-600 text-white text-xs"
                  >
                    <Wifi className="size-4 mr-2" /> Iniciar Bot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
