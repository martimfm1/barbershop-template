import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarMensagem } from "@/lib/whatsapp-bot";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const agora = new Date();

    // Define a janela ideal para apanhar os cortes daqui a 1 hora (entre 50 min e 70 min à frente)
    const inicioJanela = new Date(
      agora.getTime() + 50 * 60 * 1000,
    ).toISOString();
    const fimJanela = new Date(agora.getTime() + 70 * 60 * 1000).toISOString();

    // 1. Procura no Supabase agendamentos ativos na janela certa que ainda não foram avisados
    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select(
        `
    id,
    data_hora,
    telemovel_manual,
    nome_manual,
    clientes_perfis (nome_completo, num_telemovel),
    servicos (nome)
    `,
      )
      .eq("status", "agendado")
      .eq("notificacao_1h_enviada", false)
      .gte("data_hora", inicioJanela)
      .lte("data_hora", fimJanela);

    if (error) throw error;

    if (!agendamentos || agendamentos.length === 0) {
      return NextResponse.json({
        message: "Nenhum agendamento para avisar nesta janela.",
      });
    }

    let mensagensEnviadas = 0;

    // 2. Loop para disparar as mensagens
    for (const app of agendamentos) {
      const telemovel =
        app.clientes_perfis?.num_telemovel || app.telemovel_manual;
      const nome =
        app.clientes_perfis?.nome_completo || app.nome_manual || "Cliente";
      const servicoNome = app.servicos?.nome || "Corte";
      const horaCorte = new Date(app.data_hora).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (telemovel) {
        const textoLembrete = `Olá ${nome}! 💈 Passamos para lembrar que tens marcação para *${servicoNome}* daqui a pouco, às *${horaCorte}h*. Até já!`;

        await enviarMensagem(telemovel, textoLembrete);
        mensagensEnviadas++;

        // 3. Atualiza no Supabase para marcar como enviado
        await supabase
          .from("agendamentos")
          .update({ notificacao_1h_enviada: true })
          .eq("id", app.id);
      }
    }

    return NextResponse.json({
      success: true,
      mensagens_enviadas: mensagensEnviadas,
    });
  } catch (err: any) {
    console.error("Erro no Cron de avisos:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
