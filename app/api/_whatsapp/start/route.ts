import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Este serviço de WhatsApp está temporariamente desativado." },
    { status: 503 }
  );
}

// Caso a tua rota fizesse POST também:
export async function POST() {
  return NextResponse.json(
    { error: "Este serviço de WhatsApp está temporariamente desativado." },
    { status: 503 }
  );
}

// disabilitado por enquanto

// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { barbershopId } = await req.json();
//     const instanceName = `shop-${barbershopId}`;
//     const evolutionApiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
//     const apiKey = process.env.EVOLUTION_API_API_KEY;
//     const headers = { "apikey": apiKey, "Content-Type": "application/json" };

//     // 1. Verificação de Estado
//     const resInstances = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, { method: "GET", headers });
//     const instances = await resInstances.json();
//     const existingInstance = instances.find((i: any) => i.name === instanceName);

//     // 2. Lógica de Limpeza Síncrona
//     if (existingInstance) {
//       console.log(`[LOG] Instância ${instanceName} detectada. Tentando limpeza...`);
      
//       await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, { method: "DELETE", headers });

//       // IMPORTANTE: Pequena pausa para a Evolution API processar a deleção
//       await new Promise(resolve => setTimeout(resolve, 1500));

//       // Verificação pós-deleção
//       const resCheck = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, { method: "GET", headers });
//       const currentInstances = await resCheck.json();
//       if (currentInstances.find((i: any) => i.name === instanceName)) {
//         throw new Error("A instância não pôde ser apagada. Está bloqueada pelo Container ou sessão ativa.");
//       }
//     }

//     // 3. Criação Limpa
//     const resCreate = await fetch(`${evolutionApiUrl}/instance/create`, {
//       method: "POST",
//       headers,
//       body: JSON.stringify({
//         instanceName,
//         token: instanceName,
//         integration: "WHATSAPP-BAILEYS",
//         qrcode: true,
//       })
//     });

//     if (!resCreate.ok) throw new Error(`Falha na criação: ${await resCreate.text()}`);

//     // 4. Conexão
//     await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, { method: "GET", headers });

//     return NextResponse.json({ success: true });

//   } catch (error: any) {
//     console.error("❌ [WhatsApp Start Error]:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }