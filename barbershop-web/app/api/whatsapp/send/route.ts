import { NextResponse } from "next/server";
import { getSock, getStatus } from "@/lib/whatsapp-bot";
export async function POST(request: Request) {
  try {
    const { telemovel, mensagem } = await request.json();

    // 1. Validar inputs básicos
    if (!telemovel || !mensagem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos "telemovel" e "mensagem" são obrigatórios.',
        },
        { status: 400 },
      );
    }

    // 2. Verificar se o bot está ativo
    const sock = getSock();
    const status = getStatus();

    if (!sock || status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error: `O bot não está pronto para enviar mensagens. Status atual: ${status}`,
        },
        { status: 503 },
      );
    }

    // 3. Formatar o número para o padrão internacional do WhatsApp (Baileys)
    // Remove espaços, símbolos e o "+" caso existam
    let numeroLimpo = telemovel.replace(/\s+/g, "").replace("+", "");

    // Se for um número português (9 dígitos) e não tiver o indicativo 351, adiciona-o automaticamente
    if (
      numeroLimpo.length === 9 &&
      (numeroLimpo.startsWith("9") || numeroLimpo.startsWith("2"))
    ) {
      numeroLimpo = "351" + numeroLimpo;
    }

    // O JID final esperado pelo Baileys (ex: 351912345678@s.whatsapp.net)
    const jid = `${numeroLimpo}@s.whatsapp.net`;

    console.log(`✉️ A enviar mensagem via WP para: ${jid}`);

    // 4. Enviar a mensagem utilizando a instância global do Baileys
    await sock.sendMessage(jid, { text: mensagem });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Erro na API interna de envio de WhatsApp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno ao processar o envio.",
      },
      { status: 500 },
    );
  }
}
