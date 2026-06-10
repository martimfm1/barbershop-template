import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  WASocket,
} from "@whiskeysockets/baileys";
import { createClient } from "@supabase/supabase-js";
import pino from "pino";

// Inicializar Supabase no lado do Servidor para os lembretes automáticos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface EstadoWhatsapp {
  sock: WASocket | null;
  qrCodeRaw: string | null;
  connectionStatus: "offline" | "loading" | "pairing" | "connected";
}

const globalForWhatsapp = globalThis as unknown as {
  whatsapp_bot_state?: EstadoWhatsapp;
};

if (!globalForWhatsapp.whatsapp_bot_state) {
  globalForWhatsapp.whatsapp_bot_state = {
    sock: null,
    qrCodeRaw: null,
    connectionStatus: "offline",
  };
}

const estado = globalForWhatsapp.whatsapp_bot_state;
let rotinaLembretes: NodeJS.Timeout | null = null;

// Rotina Inteligente de Monitorização em Background
async function verificarEEnviarLembretes(sock: WASocket) {
  try {
    const agora = new Date();
    const daquiAUmaHora = new Date(agora.getTime() + 60 * 60 * 1000);

    // Criamos uma janela/margem de tempo de 15 minutos para garantir que apanhamos o agendamento
    const margemInicio = new Date(
      daquiAUmaHora.getTime() - 7 * 60 * 1000,
    ).toISOString();
    const margemFim = new Date(
      daquiAUmaHora.getTime() + 8 * 60 * 1000,
    ).toISOString();

    // Procurar agendamentos ativos na próxima hora que ainda não receberam lembrete
    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select(
        `
                id,
                data_hora,
                clientes_perfis (nome_completo, num_telemovel),
                servicos (nome)
            `,
      )
      .eq("status", "agendado")
      .eq("lembrete_enviado", false)
      .gte("data_hora", margemInicio)
      .lte("data_hora", margemFim);

    if (error) throw error;
    if (!agendamentos || agendamentos.length === 0) return;

    for (const app of agendamentos) {
      const cliente = app.clientes_perfis as any;
      const servico = app.servicos as any;

      if (!cliente || !cliente.num_telemovel) continue;

      // Formatação do número de telemóvel
      let numeroLimpo = cliente.num_telemovel
        .replace(/\s+/g, "")
        .replace("+", "");
      if (
        numeroLimpo.length === 9 &&
        (numeroLimpo.startsWith("9") || numeroLimpo.startsWith("2"))
      ) {
        numeroLimpo = "351" + numeroLimpo;
      }
      const jid = `${numeroLimpo}@s.whatsapp.net`;

      const horaCorte = new Date(app.data_hora).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const primeiroNome = cliente.nome_completo.split(" ")[0];

      const mensagemLembrete = `Olá ${primeiroNome}! 👋 Passamos para te lembrar que tens um agendamento de ${servico?.nome || "corte"} connosco daqui a pouco, às *${horaCorte}*. Ficamos à tua espera! 💈✂️`;

      console.log(
        `⏰ [Automação] A enviar lembrete automático de 1h para: ${jid}`,
      );
      await sock.sendMessage(jid, { text: mensagemLembrete });

      // Atualiza no Supabase para evitar reenvio
      await supabase
        .from("agendamentos")
        .update({ lembrete_enviado: true })
        .eq("id", app.id);
    }
  } catch (err) {
    console.error("❌ Erro na execução dos lembretes automáticos:", err);
  }
}

export async function iniciarBot() {
  if (estado.sock || estado.connectionStatus === "loading") return;

  estado.connectionStatus = "loading";

  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("./sessao_whatsapp");

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Chrome"),
      syncFullHistory: false,
    });

    estado.sock = sock;

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        estado.qrCodeRaw = qr;
        estado.connectionStatus = "pairing";
      }

      if (connection === "open") {
        estado.connectionStatus = "connected";
        estado.qrCodeRaw = null;
        console.log("✅ Bot do WhatsApp conectado com sucesso!");

        // Limpar rotina anterior se existir e iniciar uma nova a verificar a cada 4 minutos
        if (rotinaLembretes) clearInterval(rotinaLembretes);
        rotinaLembretes = setInterval(
          () => verificarEEnviarLembretes(sock),
          4 * 60 * 1000,
        );
        // Executa uma vez logo ao ligar
        verificarEEnviarLembretes(sock);
      }

      if (connection === "close") {
        estado.connectionStatus = "offline";
        estado.sock = null;
        estado.qrCodeRaw = null;
        if (rotinaLembretes) {
          clearInterval(rotinaLembretes);
          rotinaLembretes = null;
        }

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          setTimeout(iniciarBot, 5000);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    estado.connectionStatus = "offline";
    estado.sock = null;
  }
}

export async function enviarMensagem(
  telemovel: string,
  mensagem: string,
) {
  const sock = getSock();

  if (!sock) {
    throw new Error("WhatsApp não está conectado");
  }

  let numeroLimpo = telemovel
    .replace(/\s+/g, "")
    .replace("+", "");

  if (
    numeroLimpo.length === 9 &&
    (numeroLimpo.startsWith("9") || numeroLimpo.startsWith("2"))
  ) {
    numeroLimpo = "351" + numeroLimpo;
  }

  const jid = `${numeroLimpo}@s.whatsapp.net`;

  await sock.sendMessage(jid, {
    text: mensagem,
  });
}

export const getSock = () => estado.sock;
export const getStatus = () => estado.connectionStatus;
export const getQrRaw = () => estado.qrCodeRaw;
