// app/api/whatsapp/qr/route.ts
import { NextResponse } from "next/server";
import { getQrRaw, getStatus } from "@/lib/whatsapp-bot";
import QRCode from "qrcode";

export async function GET() {
  const qr = getQrRaw();
  const status = getStatus();

  if (!qr || status !== "pairing") {
    return new NextResponse("QR Code não disponível ou bot já conectado", {
      status: 400,
    });
  }

  try {
    const qrBuffer = await QRCode.toBuffer(qr, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar imagem do QR:", error);
    return new NextResponse("Erro interno ao gerar QR Code", { status: 500 });
  }
}
