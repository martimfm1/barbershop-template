import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ barbershopId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const barbershopId = resolvedParams?.barbershopId;
    const instanceName = `shop-${barbershopId}`;
    const evolutionApiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.EVOLUTION_API_API_KEY;

    // 1. Verificar o status da instância
    const resInstances = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: { "apikey": apiKey! }
    });
    
    const instances = await resInstances.json();
    const currentSpecs = instances.find((inst: any) => inst.name === instanceName);

    if (!currentSpecs) {
      return NextResponse.json({ status: "NOT_INITIALIZED", qrCodeUrl: null });
    }

    // 2. Se já estiver conectado, não precisamos de QR
    if (currentSpecs.connectionStatus === "connected") {
      return NextResponse.json({ status: "CONNECTED", qrCodeUrl: null });
    }

    // 3. SE NÃO ESTIVER CONECTADO: Vamos pedir o QR Code explicitamente
    // A Evolution API tem um endpoint próprio para o QR Base64
    const resQr = await fetch(`${evolutionApiUrl}/instance/qrCode/${instanceName}`, {
      method: "GET",
      headers: { "apikey": apiKey! }
    });

    if (resQr.ok) {
      const qrData = await resQr.json();
      // O endpoint /qrCode retorna o base64 diretamente
      if (qrData.base64) {
        return NextResponse.json({ 
            status: "qr", 
            qrCodeUrl: qrData.base64 
        });
      }
    }

    // Se falhar, reportamos apenas o estado
    return NextResponse.json({ status: "INITIALIZING", qrCodeUrl: null });

  } catch (error) {
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}