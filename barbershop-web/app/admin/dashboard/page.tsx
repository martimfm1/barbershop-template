"use client";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from "recharts";
import { SiteNavbar } from "@/components/site-navbar";
import {
  Activity,
  CalendarCheck,
  CircleDollarSign,
  MessageCircle,
  Plus,
  Check,
  Trash2,
  Users,
  UserPlus,
  Wifi,
  Search,
  Phone,
  Sparkles,
  Mail,
  Scissors,
  User,
  Briefcase,
  ArrowLeft,
  TrendingUp,
  Settings,
  Store,
  Clock,
  Bell,
  Globe,
  Save,
  CalendarOff,
  QrCode,
  Euro,
  Pencil,
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
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const chartConfig = {
  bookings: { label: "Marcações", color: "rgba(250,250,250,0.9)" },
  revenue: { label: "Faturação", color: "rgba(161,161,170,0.65)" },
} satisfies ChartConfig;

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pendente: "text-amber-200 bg-amber-500/10 hover:bg-amber-500/20",
    agendado: "text-blue-200 bg-blue-500/10 hover:bg-blue-500/20",
    concluido: "text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20",
    cancelado: "text-red-200 bg-red-500/10 hover:bg-red-500/20",
  } as const;

  const displayStatus =
    status === "agendado"
      ? "Marcado"
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant="ghost"
      className={cn(
        "px-3 py-1 font-semibold",
        styles[status as keyof typeof styles] ??
          "text-zinc-300 bg-white/5 hover:bg-white/10",
      )}
    >
      {displayStatus}
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "stats" | "settings"
  >("dashboard");
  const [botStatus, setBotStatus] = useState("loading");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showWhatsAppQRModal, setShowWhatsAppQRModal] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [barbeariaId, setBarbeariaId] = useState<string>("");
  const [receitaTotal, setReceitaTotal] = useState<number>(0);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loading, setLoading] = useState(false);

  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>("");

  const [finishingBookingId, setFinishingBookingId] = useState<string | null>(
    null,
  );
  const [valorProdutos, setValorProdutos] = useState<number | "">("");
  const [descricaoProdutos, setDescricaoProdutos] = useState<string>("");

  // Controlos de visibilidade dos modais/menus
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [showManualMessageForm, setShowManualMessageForm] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [showServicosList, setShowServicosList] = useState(false);
  const [showAddServicoForm, setShowAddServicoForm] = useState(false);
  const [showProfissionaisList, setShowProfissionaisList] = useState(false);
  const [showAddProfissionalForm, setShowAddProfissionalForm] = useState(false);

  // Estados para Edição
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [editingServico, setEditingServico] = useState<any>(null);
  const [editingProfissional, setEditingProfissional] = useState<any>(null);

  const [searchClientQuery, setSearchClientQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("09:00");

  const [formData, setFormData] = useState({
    nome_completo: "",
    num_telemovel: "",
    email: "",
    servico_id: "",
    status: "agendado",
    metodo_pagamento: "",
  });

  const [newClientData, setNewClientData] = useState({
    nome_completo: "",
    num_telemovel: "",
    email: "",
  });
  const [newServicoData, setNewServicoData] = useState({
    nome: "",
    preco: "",
    duracao_minutos: "30",
  });
  const [newProfissionalData, setNewProfissionalData] = useState({
    nome: "",
    percentagem_comissao: 50,
  });
  const [blockFormData, setBlockFormData] = useState({
    profissional_id: "",
    data_inicio: "",
    hora_inicio: "09:00",
    hora_fim: "10:00",
    motivo: "Almoço",
  });
  const [configBarbearia, setConfigBarbearia] = useState({
    nome: "A Minha Barbearia",
    telefone: "",
    morada: "",
    hora_abertura: "09:00",
    hora_fecho: "19:00",
    dias_encerrado: "Domingo",
    permitir_marcacoes_online: true,
    lembretes_whatsapp_auto: true,
    tempo_limite_cancelamento_horas: "12",
  });

  const [reminderClienteId, setReminderClienteId] = useState<string>("manual");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [manualMessage, setManualMessage] = useState({
    telemovel: "",
    texto: "",
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  const AVERAGE_TICKET_PRICE = 20;

  useEffect(() => {
    if (!finishingBookingId) {
      setValorProdutos("");
      setDescricaoProdutos("");
    }
  }, [finishingBookingId]);

  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp");
        const data = await res.json();
        setBotStatus(data.status);
        if (data.qr) setQrCodeUrl(data.qr);
        else setQrCodeUrl(null);
      } catch (error) {
        setBotStatus("offline");
      }
    };
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setLoadingInitial(true);
    try {
      const { data: appData } = await supabase
        .from("agendamentos")
        .select(
          `*, clientes_perfis (nome_completo, num_telemovel, notas_estilo), servicos (nome, preco), profissionais (nome)`,
        )
        .order("data_hora", { ascending: false });
      if (appData) setAppointments(appData);

      const { data: servData } = await supabase
        .from("servicos")
        .select("id, nome, preco, duracao_minutos")
        .order("nome", { ascending: true });
      if (servData) setServicos(servData);

      const { data: clientData } = await supabase
        .from("clientes_perfis")
        .select("id, nome_completo, num_telemovel, email, notas_estilo")
        .order("nome_completo", { ascending: true });
      if (clientData) setClientes(clientData);

      const { data: barbData } = await supabase
        .from("profissionais")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });
      if (barbData) setBarbeiros(barbData);

      const { data: shopData } = await supabase
        .from("barbearias")
        .select("*")
        .limit(1);
      if (shopData && shopData.length > 0) {
        const shop = shopData[0];
        setBarbeariaId(shop.id);
        setReceitaTotal(Number(shop.receita_total_acumulada) || 0);
        setConfigBarbearia({
          nome: shop.nome || "A Minha Barbearia",
          telefone: shop.telefone || "",
          morada: shop.morada || "",
          hora_abertura: shop.hora_abertura || "09:00",
          hora_fecho: shop.hora_fecho || "19:00",
          dias_encerrado: shop.dias_encerrado || "Domingo",
          permitir_marcacoes_online: shop.permitir_marcacoes_online ?? true,
          lembretes_whatsapp_auto: shop.lembretes_whatsapp_auto ?? true,
          tempo_limite_cancelamento_horas: String(
            shop.tempo_limite_cancelamento_horas || "12",
          ),
        });
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  const aplicarTemplateMensagem = (clientId: string, templateKey: string) => {
    let tlm = "",
      nome = "chefe";
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
    if (templateKey === "reminder_tomorrow")
      textoResultante = `Boas, ${nome}! 💈 Passamos para lembrar que tens um corte marcado connosco amanhã. Consegues confirmar se mantemos a hora? Abraço, a equipa!`;
    else if (templateKey === "miss_you")
      textoResultante = `Viva, ${nome}! ✂️ Já passou algum tempo desde o teu último corte e o teu visual já merece um trato. Como está a tua disponibilidade esta semana para darmos um jeito nisso? Abraço!`;
    setManualMessage({ telemovel: tlm, texto: textoResultante });
  };

  // ----- FUNÇÕES CRUD DE ENTIDADES -----

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tlmFormatado = newClientData.num_telemovel.trim();
    if (!newClientData.nome_completo || !tlmFormatado) {
      toast.error("Preenche nome e telemóvel.");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase
        .from("clientes_perfis")
        .insert([
          {
            nome_completo: newClientData.nome_completo.trim(),
            num_telemovel: tlmFormatado,
            email: newClientData.email.trim().toLowerCase(),
            barbearia_id: barbeariaId || null,
          },
        ]);
      if (error) throw error;
      toast.success("Cliente adicionado!");
      setNewClientData({ nome_completo: "", num_telemovel: "", email: "" });
      setShowAddClientForm(false);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("clientes_perfis")
        .update({
          nome_completo: editingCliente.nome_completo,
          num_telemovel: editingCliente.num_telemovel,
          email: editingCliente.email,
        })
        .eq("id", editingCliente.id);
      if (error) throw error;
      toast.success("Cliente atualizado!");
      setEditingCliente(null);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const { error } = await supabase
      .from("clientes_perfis")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro. O cliente pode ter marcações ativas.");
      return;
    }
    setClientes((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cliente eliminado!");
  };

  const handleCreateServico = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("servicos")
        .insert([
          {
            nome: newServicoData.nome.trim(),
            preco: Number(newServicoData.preco),
            duracao_minutos: Number(newServicoData.duracao_minutos),
            barbearia_id: barbeariaId || null,
          },
        ]);
      if (error) throw error;
      toast.success("Serviço adicionado!");
      setNewServicoData({ nome: "", preco: "", duracao_minutos: "30" });
      setShowAddServicoForm(false);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateServico = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("servicos")
        .update({
          nome: editingServico.nome,
          preco: Number(editingServico.preco),
          duracao_minutos: Number(editingServico.duracao_minutos),
        })
        .eq("id", editingServico.id);
      if (error) throw error;
      toast.success("Serviço atualizado!");
      setEditingServico(null);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServico = async (id: string) => {
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) {
      toast.error("Erro. O serviço pode estar em uso.");
      return;
    }
    setServicos((prev) => prev.filter((s) => s.id !== id));
    toast.success("Serviço eliminado!");
  };

  const handleCreateProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profissionais")
        .insert([
          {
            nome: newProfissionalData.nome.trim(),
            ativo: true,
            percentagem_comissao: Number(
              newProfissionalData.percentagem_comissao,
            ),
            barbearia_id: barbeariaId || null,
          },
        ]);
      if (error) throw error;
      toast.success("Profissional adicionado!");
      setNewProfissionalData({ nome: "", percentagem_comissao: 50 });
      setShowAddProfissionalForm(false);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profissionais")
        .update({
          nome: editingProfissional.nome,
          percentagem_comissao: Number(
            editingProfissional.percentagem_comissao,
          ),
        })
        .eq("id", editingProfissional.id);
      if (error) throw error;
      toast.success("Profissional atualizado!");
      setEditingProfissional(null);
      await fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfissional = async (id: string) => {
    const { error } = await supabase
      .from("profissionais")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro. O profissional pode ter marcações associadas.");
      return;
    }
    setBarbeiros((prev) => prev.filter((b) => b.id !== id));
    toast.success("Profissional eliminado!");
  };

  // ----- GESTÃO DE MARCAÇÕES -----

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
      await fetchInitialData();
    }
  };

  const finalizarMarcacao = async (id: string, metodo: string) => {
    const { error } = await supabase
      .from("agendamentos")
      .update({
        status: "concluido",
        metodo_pagamento: metodo,
        valor_produtos: Number(valorProdutos) || 0,
        descricao_produtos: descricaoProdutos,
      })
      .eq("id", id);
    if (!error) {
      setFinishingBookingId(null);
      toast.success("Corte concluído com sucesso!");
      await fetchInitialData();
    } else {
      toast.error("Erro ao finalizar a marcação.");
    }
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar a marcação.");
      return;
    }
    setAppointments((prev) => prev.filter((app) => app.id !== id));
    toast.success("Marcação eliminada com sucesso!");
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (
      !formData.nome_completo ||
      !formData.num_telemovel ||
      !formData.servico_id ||
      !selectedBarbeiroId ||
      !selectedDate
    ) {
      toast.error("Preenche todos os campos obrigatórios.");
      setLoading(false);
      return;
    }
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      if (combinedDateTime < new Date()) {
        toast.error("Não podes agendar para o passado!");
        setLoading(false);
        return;
      }

      const { data: clienteExistente } = await supabase
        .from("clientes_perfis")
        .select("id, barbearia_id")
        .eq("num_telemovel", formData.num_telemovel.trim())
        .maybeSingle();
      const payload = {
        barbearia_id: clienteExistente?.barbearia_id || barbeariaId,
        cliente_id: clienteExistente ? clienteExistente.id : null,
        servico_id: formData.servico_id,
        barbeiro_id: selectedBarbeiroId,
        data_hora: combinedDateTime.toISOString(),
        status: formData.status,
        metodo_pagamento: formData.metodo_pagamento || null,
      };
      const { data, error } = await supabase
        .from("agendamentos")
        .insert([payload])
        .select(
          `*, clientes_perfis (nome_completo, num_telemovel), servicos (nome, preco), profissionais (nome)`,
        );

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
          metodo_pagamento: "",
        });
        setSelectedBarbeiroId("");
        setSelectedDate("");
        setSelectedTime("09:00");
        toast.success("Marcação criada com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [hInicio, mInicio] = blockFormData.hora_inicio
        .split(":")
        .map(Number);
      const [hFim, mFim] = blockFormData.hora_fim.split(":").map(Number);
      const dataHoraInicio = new Date(blockFormData.data_inicio);
      dataHoraInicio.setHours(hInicio, mInicio, 0, 0);
      const dataHoraFim = new Date(blockFormData.data_inicio);
      dataHoraFim.setHours(hFim, mFim, 0, 0);

      const { error } = await supabase
        .from("bloqueios_agenda")
        .insert({
          barbearia_id: barbeariaId,
          profissional_id: blockFormData.profissional_id,
          data_hora_inicio: dataHoraInicio.toISOString(),
          data_hora_fim: dataHoraFim.toISOString(),
          motivo: blockFormData.motivo,
        });
      if (error) throw error;
      toast.success("Horário bloqueado com sucesso!");
      setShowAddBlockForm(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
      if (res.ok) {
        toast.success("Lembrete enviado!");
        setShowManualMessageForm(false);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("barbearias")
        .update({
          ...configBarbearia,
          tempo_limite_cancelamento_horas: Number(
            configBarbearia.tempo_limite_cancelamento_horas,
          ),
        })
        .eq("id", barbeariaId);
      if (error) throw error;
      toast.success("Configurações gravadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirMensagemParaCliente = (telemovel: string, nome: string) => {
    setReminderClienteId("manual");
    setSelectedTemplate("custom");
    setManualMessage({
      telemovel,
      texto: `Olá, ${nome.split(" ")[0]}! 👋 Tudo bem? Estava aqui a rever a agenda e lembrei-me de ti para combinarmos o teu próximo corte. Quando quiseres, avisa! 💈`,
    });
    setShowManualMessageForm(true);
    closeAllMenus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeAllMenus = () => {
    setShowAddForm(false);
    setShowAddBlockForm(false);
    setShowProfissionaisList(false);
    setShowClientsList(false);
    setShowServicosList(false);
    setShowManualMessageForm(false);
  };

  const botConnected = botStatus === "connected";
  const todayCuts = useMemo(
    () =>
      appointments.filter(
        (app) =>
          new Date(app.data_hora).toDateString() ===
            new Date().toDateString() && app.status !== "cancelado",
      ),
    [appointments],
  );
  const pendingCount = appointments.filter(
    (a) => a.status === "agendado" || a.status === "pendente",
  ).length;
  const receitaLocalAcumulada = appointments.reduce((acc, app) => {
    if (app.status === "concluido")
      return (
        acc +
        (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE) +
        (Number(app.valor_produtos) || 0)
      );
    return acc;
  }, 0);
  const totalRevenue = receitaTotal > 0 ? receitaTotal : receitaLocalAcumulada;

  const paymentStats = useMemo(() => {
    const stats: Record<string, number> = {
      Dinheiro: 0,
      "MB Way": 0,
      Cartão: 0,
    };
    appointments.forEach((app) => {
      if (app.status === "concluido") {
        const metodo =
          app.metodo_pagamento === "mbway"
            ? "MB Way"
            : app.metodo_pagamento === "cartao"
              ? "Cartão"
              : "Dinheiro";
        stats[metodo] +=
          (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE) +
          (Number(app.valor_produtos) || 0);
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const serviceStats = useMemo(() => {
    const stats: Record<string, { total: number; qtd: number }> = {};
    appointments.forEach((app) => {
      if (app.status === "concluido") {
        const n = app.servicos?.nome || "Corte Padrão";
        if (!stats[n]) stats[n] = { total: 0, qtd: 0 };
        stats[n].total += Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE;
        stats[n].qtd += 1;
      }
    });
    return Object.entries(stats)
      .map(([name, d]) => ({ name, value: d.total, quantidade: d.qtd }))
      .sort((a, b) => b.value - a.value);
  }, [appointments]);

  const barberStats = useMemo(() => {
    const stats: Record<string, number> = {};
    appointments.forEach((app) => {
      if (app.status === "concluido") {
        const n = app.profissionais?.nome || "Não Atribuído";
        stats[n] =
          (stats[n] || 0) +
          (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE);
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const insights = useMemo(() => {
    const concluidos = appointments.filter((a) => a.status === "concluido");
    const ticketMedio =
      concluidos.length > 0 ? totalRevenue / concluidos.length : 0;
    const maisPopular =
      serviceStats.length > 0
        ? `${serviceStats[0].name} (${serviceStats[0].quantidade}x)`
        : "Nenhum";
    return { ticketMedio, maisPopular };
  }, [appointments, serviceStats, totalRevenue]);

  const dynamicChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayApps = appointments.filter(
        (a) => new Date(a.data_hora).toDateString() === d.toDateString(),
      );
      const dayRevenue = dayApps
        .filter((a) => a.status === "concluido")
        .reduce(
          (acc, app) =>
            acc +
            (Number(app.servicos?.preco) || AVERAGE_TICKET_PRICE) +
            (Number(app.valor_produtos) || 0),
          0,
        );
      data.push({
        day: d.toLocaleDateString("pt-PT", { weekday: "short" }),
        bookings: dayApps.length,
        revenue: dayRevenue,
      });
    }
    return data;
  }, [appointments]);

  const STATS_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];
  const metrics = [
    {
      label: "Faturação Total",
      value: `${totalRevenue.toFixed(2)} EUR`,
      change: "Ver relatórios completos",
      icon: CircleDollarSign,
    },
    {
      label: "Total de Marcações",
      value: appointments.length.toString(),
      change: "Histórico na plataforma",
      icon: CalendarCheck,
    },
    {
      label: "Cortes Pendentes",
      value: pendingCount.toString(),
      change: "Aguardam conclusão",
      icon: Activity,
    },
    {
      label: "Cortes de Hoje",
      value: todayCuts.length.toString(),
      change: "Agendados para hoje",
      icon: Users,
    },
  ];

  return (
    <TooltipProvider>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground pb-24">
        <SiteNavbar />
        <BackgroundBeams className="opacity-35" />
        <Spotlight className="opacity-70" />

        {/* MODAL QR WHATSAPP */}
        {showWhatsAppQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-emerald-500/30 p-6 rounded-2xl text-center shadow-2xl max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold mb-2 text-zinc-100 flex items-center justify-center gap-2">
                <QrCode className="text-emerald-400" /> Ligar WhatsApp
              </h3>
              <p className="text-sm text-zinc-400 mb-6">
                Abre o WhatsApp no telemóvel do teu negócio e lê este código
                para emparelhar.
              </p>
              <div className="bg-white p-4 rounded-xl inline-block mb-6 min-h-[250px] min-w-[250px] flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="WhatsApp QR"
                    className="w-64 h-64 mx-auto"
                  />
                ) : botStatus === "connected" ? (
                  <div className="text-emerald-600 font-bold text-center">
                    Emparelhado! ✅
                  </div>
                ) : (
                  <Spinner className="size-8 text-emerald-500" />
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowWhatsAppQRModal(false)}
                className="w-full bg-zinc-800 text-white hover:bg-zinc-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        <div className="relative px-3 pb-8 pt-8 text-foreground sm:px-5 md:px-8 md:pb-12">
          <div className="relative mx-auto grid w-full max-w-7xl gap-8">
            {currentView === "stats" ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h1 className="text-3xl font-heading font-bold text-zinc-50 flex items-center gap-2">
                      <TrendingUp className="text-emerald-400 size-8" />{" "}
                      Relatórios de Faturação
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentView("dashboard")}
                    className="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
                  >
                    <ArrowLeft className="size-4 mr-2" /> Voltar ao Painel
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-300">
                        Ticket Médio p/ Corte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-emerald-400">
                        {insights.ticketMedio.toFixed(2)}€
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-300">
                        Serviço Mais Solicitado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold text-zinc-100">
                        {insights.maisPopular}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-300">
                        Cortes Fechados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-400">
                        {
                          appointments.filter((a) => a.status === "concluido")
                            .length
                        }{" "}
                        Executados
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="bg-black/40 border-white/10 md:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">
                        Métodos de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={5}
                          >
                            {paymentStats.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={STATS_COLORS[index % STATS_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/40 border-white/10 md:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">
                        Faturação por Barbeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barberStats}>
                          <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.5)"
                            tickLine={false}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tickLine={false}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="value"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/40 border-white/10 md:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">
                        Top Serviços (€)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceStats} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="rgba(255,255,255,0.7)"
                            width={90}
                            fontSize={10}
                            tickLine={false}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="value"
                            fill="#a855f7"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : currentView === "settings" ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                      <Settings className="text-zinc-400 size-8" />{" "}
                      Configurações do Negócio
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentView("dashboard")}
                    className="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
                  >
                    <ArrowLeft className="size-4 mr-2" /> Voltar
                  </Button>
                </div>

                <form
                  onSubmit={handleSaveSettings}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <Card className="bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="flex gap-2 text-lg text-zinc-100">
                        <Store className="size-4 text-emerald-400" /> Público
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-xs text-zinc-400">
                          Nome da Barbearia
                        </label>
                        <input
                          type="text"
                          required
                          className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                          value={configBarbearia.nome}
                          onChange={(e) =>
                            setConfigBarbearia({
                              ...configBarbearia,
                              nome: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-zinc-400">
                          Telefone Oficial
                        </label>
                        <input
                          type="tel"
                          className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                          value={configBarbearia.telefone}
                          onChange={(e) =>
                            setConfigBarbearia({
                              ...configBarbearia,
                              telefone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-zinc-400">Morada</label>
                        <input
                          type="text"
                          className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                          value={configBarbearia.morada}
                          onChange={(e) =>
                            setConfigBarbearia({
                              ...configBarbearia,
                              morada: e.target.value,
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="flex gap-2 text-lg text-zinc-100">
                        <Clock className="size-4 text-blue-400" /> Horário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Abertura
                          </label>
                          <input
                            type="time"
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm color-scheme-dark"
                            value={configBarbearia.hora_abertura}
                            onChange={(e) =>
                              setConfigBarbearia({
                                ...configBarbearia,
                                hora_abertura: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">Fecho</label>
                          <input
                            type="time"
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm color-scheme-dark"
                            value={configBarbearia.hora_fecho}
                            onChange={(e) =>
                              setConfigBarbearia({
                                ...configBarbearia,
                                hora_fecho: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-zinc-400">
                          Dias Encerrado
                        </label>
                        <Select
                          value={configBarbearia.dias_encerrado}
                          onValueChange={(v) =>
                            setConfigBarbearia({
                              ...configBarbearia,
                              dias_encerrado: v,
                            })
                          }
                        >
                          <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            <SelectGroup>
                              <SelectItem value="Nenhum">
                                Aberto Todos os Dias
                              </SelectItem>
                              <SelectItem value="Domingo">Domingo</SelectItem>
                              <SelectItem value="Segunda">
                                Segunda-feira
                              </SelectItem>
                              <SelectItem value="Domingo,Segunda">
                                Domingo e Segunda
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/10 md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex gap-2 text-lg text-zinc-100">
                        <Globe className="size-4 text-purple-400" /> Plataforma
                        Online
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div>
                          <p className="font-semibold text-zinc-100">
                            Aceitar Marcações Online
                          </p>
                          <p className="text-xs text-zinc-400">
                            Permite que a página pública receba novas marcações.
                          </p>
                        </div>
                        <Switch
                          checked={configBarbearia.permitir_marcacoes_online}
                          onCheckedChange={(v) =>
                            setConfigBarbearia((p) => ({
                              ...p,
                              permitir_marcacoes_online: v,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div>
                          <p className="font-semibold text-zinc-100 flex items-center gap-2">
                            <Bell className="size-3.5" /> Lembretes WhatsApp
                          </p>
                          <p className="text-xs text-zinc-400">
                            Envia aviso automático no dia antes.
                          </p>
                        </div>
                        <Switch
                          checked={configBarbearia.lembretes_whatsapp_auto}
                          onCheckedChange={(v) =>
                            setConfigBarbearia((p) => ({
                              ...p,
                              lembretes_whatsapp_auto: v,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2 max-w-sm">
                        <label className="text-xs text-zinc-400 font-medium">
                          Tempo limite p/ Cancelamento (Horas)
                        </label>
                        <Select
                          value={
                            configBarbearia.tempo_limite_cancelamento_horas
                          }
                          onValueChange={(v) =>
                            setConfigBarbearia({
                              ...configBarbearia,
                              tempo_limite_cancelamento_horas: v,
                            })
                          }
                        >
                          <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            <SelectGroup>
                              <SelectItem value="2">2 Horas antes</SelectItem>
                              <SelectItem value="12">12 Horas antes</SelectItem>
                              <SelectItem value="24">24 Horas antes</SelectItem>
                              <SelectItem value="999">
                                Não permitir cancelamentos online
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-end">
                        <Button
                          type="submit"
                          disabled={loading}
                          variant="ghost"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          {loading ? (
                            <Spinner className="mr-2" />
                          ) : (
                            <Save className="mr-2 size-4" />
                          )}{" "}
                          Gravar Configurações
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            ) : (
              <>
                {/* MENU DE AÇÕES RÁPIDAS NO DASHBOARD */}
                <section className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-7">
                  {[
                    {
                      state: showAddForm,
                      setter: setShowAddForm,
                      icon: Plus,
                      label: "Nova Marcação",
                      color: "emerald",
                    },
                    {
                      state: showAddBlockForm,
                      setter: setShowAddBlockForm,
                      icon: CalendarOff,
                      label: "Bloquear Agenda",
                      color: "red",
                    },
                    {
                      state: showProfissionaisList,
                      setter: setShowProfissionaisList,
                      icon: Briefcase,
                      label: "Profissionais",
                      color: "purple",
                    },
                    {
                      state: showClientsList,
                      setter: setShowClientsList,
                      icon: Users,
                      label: "Clientes",
                      color: "zinc",
                    },
                    {
                      state: showServicosList,
                      setter: setShowServicosList,
                      icon: Scissors,
                      label: "Serviços",
                      color: "amber",
                    },
                    {
                      state: showManualMessageForm,
                      setter: setShowManualMessageForm,
                      icon: MessageCircle,
                      label: "Mensagens",
                      color: "green",
                    },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        closeAllMenus();
                        item.setter(!item.state);
                      }}
                      className={cn(
                        "interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-4 text-left transition-colors",
                        item.state
                          ? `border-${item.color}-500/40 bg-${item.color}-500/10 ring-1 ring-${item.color}-500/30`
                          : "border-white/10 bg-white/[0.04] hover:bg-white/10",
                      )}
                    >
                      <span className="mb-3 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                        <item.icon className="size-4" />
                      </span>
                      <span className="block font-heading text-sm font-semibold text-zinc-50">
                        {item.label}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentView("settings")}
                    className="interactive-card rounded-[var(--radius-4xl)] border p-3 md:p-4 text-left border-white/10 bg-zinc-800/40 hover:bg-white/10"
                  >
                    <span className="mb-3 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                      <Settings className="size-4" />
                    </span>
                    <span className="block font-heading text-sm font-semibold text-zinc-50">
                      Definições
                    </span>
                  </button>
                </section>

                {/* FORMS */}
                {showAddForm && (
                  <Card className="border border-emerald-500/20 bg-black/40 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-emerald-400 flex gap-2">
                        <Plus className="size-5" /> Nova Marcação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handleCreateBooking}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end"
                      >
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Escolha Rápida (Opcional)
                          </label>
                          <Combobox
                            value={formData.num_telemovel}
                            onValueChange={(val) => {
                              const cl = clientes.find((c) => c.id === val);
                              if (cl)
                                setFormData({
                                  ...formData,
                                  nome_completo: cl.nome_completo,
                                  num_telemovel: cl.num_telemovel,
                                  email: cl.email || "",
                                });
                            }}
                          >
                            <ComboboxInput
                              placeholder="Procurar cliente..."
                              className="bg-zinc-900 border-white/10 text-white"
                            />
                            <ComboboxContent className="bg-zinc-900 border-white/10 text-white">
                              <ComboboxList>
                                <ComboboxEmpty>Nenhum cliente.</ComboboxEmpty>
                                {clientes.map((c) => (
                                  <ComboboxItem key={c.id} value={c.id}>
                                    {c.nome_completo}
                                  </ComboboxItem>
                                ))}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Nome do Cliente
                          </label>
                          <input
                            required
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                            value={formData.nome_completo}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nome_completo: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Telemóvel
                          </label>
                          <input
                            required
                            type="tel"
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                            value={formData.num_telemovel}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                num_telemovel: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Barbeiro
                          </label>
                          <Select
                            value={selectedBarbeiroId}
                            onValueChange={setSelectedBarbeiroId}
                          >
                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              <SelectGroup>
                                {barbeiros.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.nome}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Serviço Pretendido
                          </label>
                          <Select
                            value={formData.servico_id}
                            onValueChange={(val) =>
                              setFormData({ ...formData, servico_id: val })
                            }
                          >
                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              <SelectGroup>
                                {servicos.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.nome} ({Number(s.preco).toFixed(2)}€)
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">Data</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10",
                                  !selectedDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 size-4" />
                                {selectedDate
                                  ? format(
                                      new Date(selectedDate + "T00:00:00"),
                                      "PPP",
                                    )
                                  : "Escolha data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                              <Calendar
                                mode="single"
                                selected={
                                  selectedDate
                                    ? new Date(selectedDate + "T00:00:00")
                                    : undefined
                                }
                                onSelect={(d) =>
                                  d && setSelectedDate(format(d, "yyyy-MM-dd"))
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">Hora</label>
                          <input
                            type="time"
                            required
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2 mt-2">
                          <Button
                            type="submit"
                            disabled={loading}
                            variant="ghost"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white w-full h-10"
                          >
                            {loading ? (
                              <Spinner className="mr-2" />
                            ) : (
                              "Gravar Marcação"
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {showAddBlockForm && (
                  <Card className="border border-red-500/20 bg-black/40 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex gap-2">
                        <CalendarOff className="size-5" /> Bloquear Agenda
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handleCreateBlock}
                        className="grid gap-6 md:grid-cols-5 items-end"
                      >
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Quem fica ausente?
                          </label>
                          <Select
                            value={blockFormData.profissional_id}
                            onValueChange={(val) =>
                              setBlockFormData({
                                ...blockFormData,
                                profissional_id: val,
                              })
                            }
                          >
                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              <SelectGroup>
                                {barbeiros.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.nome}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Data do Bloqueio
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10",
                                  !blockFormData.data_inicio &&
                                    "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 size-4" />
                                {blockFormData.data_inicio
                                  ? format(
                                      new Date(
                                        blockFormData.data_inicio + "T00:00:00",
                                      ),
                                      "PPP",
                                    )
                                  : "Data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                              <Calendar
                                mode="single"
                                selected={
                                  blockFormData.data_inicio
                                    ? new Date(
                                        blockFormData.data_inicio + "T00:00:00",
                                      )
                                    : undefined
                                }
                                onSelect={(d) =>
                                  d &&
                                  setBlockFormData({
                                    ...blockFormData,
                                    data_inicio: format(d, "yyyy-MM-dd"),
                                  })
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">
                            Início
                          </label>
                          <input
                            type="time"
                            required
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                            value={blockFormData.hora_inicio}
                            onChange={(e) =>
                              setBlockFormData({
                                ...blockFormData,
                                hora_inicio: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs text-zinc-400">Fim</label>
                          <input
                            type="time"
                            required
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark"
                            value={blockFormData.hora_fim}
                            onChange={(e) =>
                              setBlockFormData({
                                ...blockFormData,
                                hora_fim: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2 mt-2">
                          <Button
                            type="submit"
                            disabled={loading}
                            variant="ghost"
                            className="bg-red-600 hover:bg-red-500 text-white w-full h-10"
                          >
                            {loading ? (
                              <Spinner className="mr-2" />
                            ) : (
                              "Bloquear Horário"
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* LISTA E GESTÃO: CLIENTES */}
                {showClientsList && (
                  <Card className="border border-zinc-500/20 bg-zinc-950/80">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <CardTitle className="text-xl flex gap-2 text-zinc-100">
                          <Users className="size-5" /> Clientes (
                          {clientes.length})
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowAddClientForm(!showAddClientForm)
                          }
                          className="border border-white/10 text-zinc-300"
                        >
                          <UserPlus className="size-4 mr-2" /> Novo Cliente
                        </Button>
                      </div>
                      <div className="w-72">
                        <InputGroup>
                          <InputGroupAddon>
                            <Search className="size-4 text-zinc-500" />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Procurar nome ou telemóvel..."
                            value={searchClientQuery}
                            onChange={(e) =>
                              setSearchClientQuery(e.target.value)
                            }
                            className="bg-zinc-900 border-white/10 text-white"
                          />
                        </InputGroup>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {showAddClientForm && (
                        <form
                          onSubmit={handleCreateClient}
                          className="mb-6 grid gap-4 sm:grid-cols-4 items-end bg-blue-500/5 p-4 rounded-xl border border-blue-500/20"
                        >
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Nome
                            </label>
                            <input
                              required
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
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
                            <label className="text-xs text-zinc-400">
                              Telemóvel
                            </label>
                            <input
                              required
                              type="tel"
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newClientData.num_telemovel}
                              onChange={(e) =>
                                setNewClientData({
                                  ...newClientData,
                                  num_telemovel: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Email
                            </label>
                            <input
                              required
                              type="email"
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newClientData.email}
                              onChange={(e) =>
                                setNewClientData({
                                  ...newClientData,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={loading}
                            variant="ghost"
                            className="bg-blue-600 hover:bg-blue-500 text-white h-9"
                          >
                            {loading ? (
                              <Spinner className="size-4" />
                            ) : (
                              "Registar Cliente"
                            )}
                          </Button>
                        </form>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredClientes.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-500/30 transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-sm text-zinc-100">
                                {cliente.nome_completo}
                              </p>
                              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                                <Phone className="size-3" />{" "}
                                {cliente.num_telemovel}
                              </p>
                              {cliente.email && (
                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                  <Mail className="size-3" /> {cliente.email}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex gap-1 justify-end pt-3 border-t border-white/5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      abrirMensagemParaCliente(
                                        cliente.num_telemovel,
                                        cliente.nome_completo,
                                      )
                                    }
                                    className="h-7 w-7 text-green-400 hover:bg-green-500/10"
                                  >
                                    <MessageCircle className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>WhatsApp</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingCliente(cliente)}
                                    className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="bg-zinc-950 border-white/10">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Apagar Cliente?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isto removerá o cliente permanentemente.
                                      Pode falhar se ele tiver marcações ativas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="ghost"
                                      className="bg-red-600 text-white hover:bg-red-500"
                                      onClick={() =>
                                        handleDeleteClient(cliente.id)
                                      }
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* LISTA E GESTÃO: SERVICOS */}
                {showServicosList && (
                  <Card className="border border-amber-500/20 bg-zinc-950/80">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="text-xl flex gap-2 text-zinc-100">
                        <Sparkles className="size-5 text-amber-400" /> Serviços
                        ({servicos.length})
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowAddServicoForm(!showAddServicoForm)
                        }
                        className="border border-white/10 text-zinc-300"
                      >
                        <Plus className="size-4 mr-2" /> Novo Serviço
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {showAddServicoForm && (
                        <form
                          onSubmit={handleCreateServico}
                          className="mb-6 grid gap-4 sm:grid-cols-4 items-end bg-amber-500/5 p-4 rounded-xl border border-amber-500/20"
                        >
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Nome
                            </label>
                            <input
                              required
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newServicoData.nome}
                              onChange={(e) =>
                                setNewServicoData({
                                  ...newServicoData,
                                  nome: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Preço
                            </label>
                            <InputGroup>
                              <InputGroupInput
                                type="number"
                                step="0.01"
                                required
                                value={newServicoData.preco}
                                onChange={(e) =>
                                  setNewServicoData({
                                    ...newServicoData,
                                    preco: e.target.value,
                                  })
                                }
                                className="bg-zinc-900 border-white/10 text-white"
                              />
                              <InputGroupAddon>
                                <Euro className="size-3 text-zinc-500" />
                              </InputGroupAddon>
                            </InputGroup>
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Duração (Minutos)
                            </label>
                            <input
                              required
                              type="number"
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newServicoData.duracao_minutos}
                              onChange={(e) =>
                                setNewServicoData({
                                  ...newServicoData,
                                  duracao_minutos: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={loading}
                            variant="ghost"
                            className="bg-amber-600 hover:bg-amber-500 text-white h-9"
                          >
                            {loading ? (
                              <Spinner className="size-4" />
                            ) : (
                              "Gravar Serviço"
                            )}
                          </Button>
                        </form>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {servicos.map((serv) => (
                          <div
                            key={serv.id}
                            className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm text-zinc-100">
                                  {serv.nome}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  ⏱️ {serv.duracao_minutos} min
                                </p>
                              </div>
                              <Badge
                                variant="ghost"
                                className="bg-amber-500/10 text-amber-400"
                              >
                                {Number(serv.preco).toFixed(2)}€
                              </Badge>
                            </div>
                            <div className="mt-3 flex gap-1 justify-end pt-3 border-t border-white/5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingServico(serv)}
                                    className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar Serviço</TooltipContent>
                              </Tooltip>
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Eliminar Serviço
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="bg-zinc-950 border-white/10">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Apagar Serviço?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isto removerá o serviço. Pode não ser
                                      possível se estiver presente no histórico
                                      de marcações.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="ghost"
                                      className="bg-red-600 text-white hover:bg-red-500"
                                      onClick={() =>
                                        handleDeleteServico(serv.id)
                                      }
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* LISTA E GESTÃO: PROFISSIONAIS */}
                {showProfissionaisList && (
                  <Card className="border border-purple-500/20 bg-zinc-950/80">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="text-xl flex gap-2 text-zinc-100">
                        <Briefcase className="size-5 text-purple-400" />{" "}
                        Profissionais ({barbeiros.length})
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowAddProfissionalForm(!showAddProfissionalForm)
                        }
                        className="border border-white/10 text-zinc-300"
                      >
                        <Plus className="size-4 mr-2" /> Novo Profissional
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {showAddProfissionalForm && (
                        <form
                          onSubmit={handleCreateProfissional}
                          className="mb-6 grid gap-4 sm:grid-cols-4 items-end bg-purple-500/5 p-4 rounded-xl border border-purple-500/20"
                        >
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Nome do Barbeiro
                            </label>
                            <input
                              required
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newProfissionalData.nome}
                              onChange={(e) =>
                                setNewProfissionalData({
                                  ...newProfissionalData,
                                  nome: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs text-zinc-400">
                              Comissão (%)
                            </label>
                            <input
                              required
                              type="number"
                              min="0"
                              max="100"
                              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                              value={newProfissionalData.percentagem_comissao}
                              onChange={(e) =>
                                setNewProfissionalData({
                                  ...newProfissionalData,
                                  percentagem_comissao: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={loading}
                            variant="ghost"
                            className="bg-purple-600 hover:bg-purple-500 text-white h-9"
                          >
                            {loading ? (
                              <Spinner className="size-4" />
                            ) : (
                              "Gravar Profissional"
                            )}
                          </Button>
                        </form>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {barbeiros.map((barb) => (
                          <div
                            key={barb.id}
                            className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <User className="size-5 text-purple-400" />
                                <div>
                                  <p className="font-semibold text-sm text-zinc-100">
                                    {barb.nome}
                                  </p>
                                  <p className="text-xs text-zinc-400 mt-1">
                                    Comissão: {barb.percentagem_comissao ?? 50}%
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="ghost"
                                className="bg-emerald-500/10 text-emerald-400"
                              >
                                Ativo
                              </Badge>
                            </div>
                            <div className="mt-3 flex gap-1 justify-end pt-3 border-t border-white/5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingProfissional(barb)}
                                    className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Eliminar Profissional
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="bg-zinc-950 border-white/10">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Apagar Barbeiro?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isto removerá o profissional. Não
                                      recomendado se ele já tiver histórico de
                                      cortes associado.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="ghost"
                                      className="bg-red-600 text-white hover:bg-red-500"
                                      onClick={() =>
                                        handleDeleteProfissional(barb.id)
                                      }
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ESTATISTICAS GERAIS */}
                <section className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {metrics.map((metric) => (
                    <Card
                      key={metric.label}
                      onClick={() => {
                        if (metric.label.includes("Faturação"))
                          setCurrentView("stats");
                      }}
                      className={cn(
                        "border border-white/10 bg-white/[0.04]",
                        metric.label.includes("Faturação") &&
                          "cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors",
                      )}
                    >
                      <CardHeader className="flex-row justify-between p-4">
                        <div>
                          <CardDescription className="text-zinc-400">
                            {metric.label}
                          </CardDescription>
                          <CardTitle className="mt-2 text-2xl text-zinc-50">
                            {metric.value}
                          </CardTitle>
                        </div>
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full bg-white/5 text-zinc-300",
                            metric.label.includes("Faturação") &&
                              "bg-emerald-500/20 text-emerald-400",
                          )}
                        >
                          <metric.icon className="size-5" />
                        </span>
                      </CardHeader>
                    </Card>
                  ))}
                </section>

                {/* GRÁFICOS DO DASHBOARD E TABELA DE MARCAÇÕES */}
                <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
                  <Card className="border border-white/10 bg-white/[0.04]">
                    <CardHeader>
                      <CardTitle className="text-2xl text-zinc-100">
                        Evolução da Semana
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                      <ChartContainer
                        config={chartConfig}
                        className="h-full w-full"
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

                  <Card className="border border-white/10 bg-white/[0.04] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-2xl text-zinc-100">
                        Bot do WhatsApp
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "size-3 rounded-full animate-pulse",
                              botConnected
                                ? "bg-emerald-400"
                                : botStatus === "qr"
                                  ? "bg-amber-400"
                                  : "bg-red-400",
                            )}
                          />
                          <p className="font-semibold text-sm text-zinc-100">
                            {botConnected
                              ? "Emparelhado e Ativo"
                              : botStatus === "qr"
                                ? "Aguardar Leitura do QR"
                                : `Estado: ${botStatus}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto grid gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setShowWhatsAppQRModal(true)}
                          className="bg-zinc-800 text-white hover:bg-zinc-700 h-10"
                        >
                          <QrCode className="size-4 mr-2" /> Emparelhar Telefone
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            await fetch("/api/whatsapp/start", {
                              method: "POST",
                            });
                            toast.success("Comando enviado!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white h-10"
                        >
                          <Wifi className="size-4 mr-2" /> Forçar Reinício
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr]">
                  <Card className="border border-white/10 bg-white/[0.04]">
                    <CardHeader>
                      <CardTitle className="text-2xl text-zinc-100">
                        Gestão de Marcações Diárias
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-zinc-400">
                              Cliente
                            </TableHead>
                            <TableHead className="text-zinc-400">
                              Serviço / Barbeiro
                            </TableHead>
                            <TableHead className="text-zinc-400">
                              Data & Hora
                            </TableHead>
                            <TableHead className="text-zinc-400">
                              Estado
                            </TableHead>
                            <TableHead className="text-right text-zinc-400">
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingInitial ? (
                            [...Array(4)].map((_, i) => (
                              <TableRow key={i} className="border-white/5">
                                <TableCell>
                                  <Skeleton className="h-4 w-[150px] bg-white/10" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-[120px] bg-white/10" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-[100px] bg-white/10" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-6 w-[80px] bg-white/10 rounded-full" />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Skeleton className="h-8 w-24 ml-auto bg-white/10 rounded-md" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : appointments.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-zinc-500 py-8"
                              >
                                Sem marcações registadas.
                              </TableCell>
                            </TableRow>
                          ) : (
                            appointments.map((appointment) => {
                              const dataObj = new Date(appointment.data_hora);
                              const telemovel =
                                appointment.clientes_perfis?.num_telemovel ||
                                appointment.telemovel_manual;
                              const nome =
                                appointment.clientes_perfis?.nome_completo ||
                                appointment.nome_manual ||
                                "Cliente Manual";

                              return (
                                <TableRow
                                  key={appointment.id}
                                  className="border-white/5 hover:bg-white/[0.02]"
                                >
                                  <TableCell className="font-semibold text-zinc-100">
                                    <div className="flex flex-col">
                                      <span>{nome}</span>
                                      <span className="text-[10px] text-zinc-500 font-normal">
                                        {telemovel || "N/A"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-zinc-300">
                                    <div className="flex flex-col">
                                      <span>{appointment.servicos?.nome}</span>
                                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                        <User className="size-3" />{" "}
                                        {appointment.profissionais?.nome ||
                                          "Sem Prof."}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-zinc-300">
                                    {dataObj.toLocaleDateString("pt-PT")}{" "}
                                    <span className="text-zinc-500 ml-1">
                                      {dataObj.toLocaleTimeString("pt-PT", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col items-start gap-1">
                                      <StatusBadge
                                        status={appointment.status}
                                      />
                                      {appointment.metodo_pagamento && (
                                        <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
                                          💳 {appointment.metodo_pagamento}
                                        </span>
                                      )}
                                      {Number(appointment.valor_produtos) >
                                        0 && (
                                        <span className="text-[10px] text-zinc-500">
                                          +{appointment.valor_produtos}€ (Prod)
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 relative">
                                      {telemovel && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                abrirMensagemParaCliente(
                                                  telemovel,
                                                  nome,
                                                )
                                              }
                                              className="h-8 w-8 text-green-400 hover:bg-green-500/10"
                                            >
                                              <MessageCircle className="size-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            WhatsApp Lembrete
                                          </TooltipContent>
                                        </Tooltip>
                                      )}

                                      {appointment.status === "agendado" && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                setFinishingBookingId(
                                                  appointment.id,
                                                )
                                              }
                                              className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                              <Check className="size-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Concluir e Receber
                                          </TooltipContent>
                                        </Tooltip>
                                      )}

                                      {finishingBookingId ===
                                        appointment.id && (
                                        <div className="absolute right-10 top-0 z-50 flex flex-col gap-2 bg-zinc-950 border border-white/10 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 w-72 text-left">
                                          <p className="text-xs font-semibold mb-1 text-zinc-300 border-b border-white/10 pb-1">
                                            Adicionar Venda Extra (Opcional)
                                          </p>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              placeholder="Produto..."
                                              className="flex-1 bg-white/5 border border-white/10 rounded p-1.5 text-xs text-white"
                                              value={descricaoProdutos}
                                              onChange={(e) =>
                                                setDescricaoProdutos(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            <input
                                              type="number"
                                              placeholder="€ Valor"
                                              className="w-20 bg-white/5 border border-white/10 rounded p-1.5 text-xs text-white"
                                              value={valorProdutos}
                                              onChange={(e) =>
                                                setValorProdutos(
                                                  e.target.value === ""
                                                    ? ""
                                                    : Number(e.target.value),
                                                )
                                              }
                                            />
                                          </div>
                                          <p className="text-xs font-semibold mt-2 text-zinc-300">
                                            Escolha o Método de Pagamento
                                          </p>
                                          <div className="flex gap-1.5">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                finalizarMarcacao(
                                                  appointment.id,
                                                  "dinheiro",
                                                )
                                              }
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-8 text-xs text-white"
                                            >
                                              💵 Din
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                finalizarMarcacao(
                                                  appointment.id,
                                                  "mbway",
                                                )
                                              }
                                              className="flex-1 bg-blue-600 hover:bg-blue-500 h-8 text-xs text-white"
                                            >
                                              📱 MB
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                finalizarMarcacao(
                                                  appointment.id,
                                                  "cartao",
                                                )
                                              }
                                              className="flex-1 bg-zinc-700 hover:bg-zinc-600 h-8 text-xs text-white"
                                            >
                                              💳 Car
                                            </Button>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setFinishingBookingId(null)
                                            }
                                            className="mt-1 h-7 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5"
                                          >
                                            Cancelar Caixa
                                          </Button>
                                        </div>
                                      )}

                                      {(appointment.status === "agendado" ||
                                        appointment.status === "pendente") && (
                                        <AlertDialog>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                                >
                                                  <Trash2 className="size-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Apagar Marcação
                                            </TooltipContent>
                                          </Tooltip>
                                          <AlertDialogContent className="bg-zinc-950 border-white/10">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Eliminar Marcação?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Isto removerá a marcação da
                                                agenda permanentemente.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                                                Voltar
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                variant="ghost"
                                                className="bg-red-600 text-white hover:bg-red-500"
                                                onClick={() =>
                                                  deleteAppointment(
                                                    appointment.id,
                                                  )
                                                }
                                              >
                                                Sim, Apagar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </div>
        </div>

        {/* --- MODAIS DE EDIÇÃO DE ENTIDADES --- */}

        {/* Dialog Editar Cliente */}
        <Dialog
          open={!!editingCliente}
          onOpenChange={(open) => !open && setEditingCliente(null)}
        >
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            {editingCliente && (
              <form onSubmit={handleUpdateClient} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Nome</label>
                  <input
                    required
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingCliente.nome_completo}
                    onChange={(e) =>
                      setEditingCliente({
                        ...editingCliente,
                        nome_completo: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Telemóvel</label>
                  <input
                    required
                    type="tel"
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingCliente.num_telemovel}
                    onChange={(e) =>
                      setEditingCliente({
                        ...editingCliente,
                        num_telemovel: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Email</label>
                  <input
                    type="email"
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingCliente.email || ""}
                    onChange={(e) =>
                      setEditingCliente({
                        ...editingCliente,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="ghost"
                    className="bg-blue-600 hover:bg-blue-500 text-white w-full"
                  >
                    {loading ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Guardar Alterações"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Serviço */}
        <Dialog
          open={!!editingServico}
          onOpenChange={(open) => !open && setEditingServico(null)}
        >
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
            </DialogHeader>
            {editingServico && (
              <form onSubmit={handleUpdateServico} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">
                    Nome do Serviço
                  </label>
                  <input
                    required
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingServico.nome}
                    onChange={(e) =>
                      setEditingServico({
                        ...editingServico,
                        nome: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Preço (€)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingServico.preco}
                    onChange={(e) =>
                      setEditingServico({
                        ...editingServico,
                        preco: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">
                    Duração (Minutos)
                  </label>
                  <input
                    required
                    type="number"
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingServico.duracao_minutos}
                    onChange={(e) =>
                      setEditingServico({
                        ...editingServico,
                        duracao_minutos: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="ghost"
                    className="bg-amber-600 hover:bg-amber-500 text-white w-full"
                  >
                    {loading ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Guardar Alterações"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Profissional */}
        <Dialog
          open={!!editingProfissional}
          onOpenChange={(open) => !open && setEditingProfissional(null)}
        >
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Barbeiro</DialogTitle>
            </DialogHeader>
            {editingProfissional && (
              <form
                onSubmit={handleUpdateProfissional}
                className="grid gap-4 py-4"
              >
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Nome</label>
                  <input
                    required
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingProfissional.nome}
                    onChange={(e) =>
                      setEditingProfissional({
                        ...editingProfissional,
                        nome: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-zinc-400">Comissão (%)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm"
                    value={editingProfissional.percentagem_comissao}
                    onChange={(e) =>
                      setEditingProfissional({
                        ...editingProfissional,
                        percentagem_comissao: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="ghost"
                    className="bg-purple-600 hover:bg-purple-500 text-white w-full"
                  >
                    {loading ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Guardar Alterações"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
