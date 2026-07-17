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


// import { NextResponse } from "next/server";
// import { WhatsAppService } from "@/app/dashboard/_services/whatsapp.service";

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { barbershopId, phone, message } = body;

//     if (!barbershopId || !phone || !message) {
//       return NextResponse.json({ error: "Missing parameters payload" }, { status: 400 });
//     }

//     const ws = WhatsAppService.getInstance();
//     await ws.sendAlert(barbershopId, phone, message);

//     return NextResponse.json({ dispatched: true });
//   } catch (error) {
//     console.error("Message dispatch failure pipeline:", error);
//     return NextResponse.json({ error: "Failed to process message routing" }, { status: 500 });
//   }
// }