import { NextResponse } from 'next/server';
import { iniciarBot } from '@/lib/whatsapp-bot'; 

export async function POST() {
  try {
    // Liga o teu bot usando a função exata do teu lib
    await iniciarBot(); 
    return NextResponse.json({ success: true, message: "Bot a iniciar..." });
  } catch (error) {
    console.error("Erro ao disparar o bot:", error);
    return NextResponse.json({ error: "Falha ao iniciar o bot" }, { status: 500 });
  }
}