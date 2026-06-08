// app/api/whatsapp/qr/route.ts
import { NextResponse } from 'next/server';
import { getQrRaw, getStatus } from '@/lib/whatsapp-bot';
import QRCode from 'qrcode'; // Utiliza a biblioteca que já tens instalada

export async function GET() {
    const qr = getQrRaw();
    const status = getStatus();

    // Se o bot não estiver em modo de emparelhamento ou não houver QR, não vale a pena gerar
    if (!qr || status !== 'pairing') {
        return new NextResponse('QR Code não disponível ou bot já conectado', { status: 400 });
    }

    try {
        // Transforma a string do Baileys (ex: "1@...") numa imagem PNG real
        const qrBuffer = await QRCode.toBuffer(qr, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',  // Cor dos módulos do QR
                light: '#FFFFFF'  // Cor do fundo
            }
        });

        // Devolve o Buffer diretamente com o cabeçalho de imagem PNG
        return new NextResponse(qrBuffer, {
            headers: {
                'Content-Type': 'image/png',
                // Força o browser a não guardar o QR antigo em cache
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Erro ao gerar imagem do QR:', error);
        return new NextResponse('Erro interno ao gerar QR Code', { status: 500 });
    }
}