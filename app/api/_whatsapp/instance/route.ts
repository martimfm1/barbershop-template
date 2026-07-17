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

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const barbershopId = searchParams.get("barbershopId");

//     if (!barbershopId) {
//       return NextResponse.json({ error: "Missing barbershopId parameter" }, { status: 400 });
//     }

//     const ws = WhatsAppService.getInstance();
//     const state = await ws.getStatus(barbershopId);

//     return NextResponse.json(state);
//   } catch (error) {
//     console.error("API execution failure in instance fetch route:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { barbershopId } = body;

//     if (!barbershopId) {
//       return NextResponse.json({ error: "Missing required field: barbershopId" }, { status: 400 });
//     }

//     const ws = WhatsAppService.getInstance();
//     const state = await ws.initialize(barbershopId);

//     return NextResponse.json(state);
//   } catch (error) {
//     console.error("API execution failure in instance initialization route:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// export async function DELETE(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const barbershopId = searchParams.get("barbershopId");

//     if (!barbershopId) {
//       return NextResponse.json({ error: "Missing barbershopId parameter" }, { status: 400 });
//     }

//     const ws = WhatsAppService.getInstance();
//     await ws.disconnect(barbershopId);

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("API execution failure in instance deletion route:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }