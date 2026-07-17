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
// import { createAdminClient } from "@/lib/supabase/admin";

// export async function POST(request: Request) {
//   try {
//     const apiKey = request.headers.get("apikey");
//     if (apiKey !== process.env.WHATSAPP_GATEWAY_KEY) {
//       console.warn("Unauthorized webhook interception attempt blocked");
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const body = await request.json();
//     const { event, instance } = body;

//     console.log(`Received webhook payload for event: ${event} on instance: ${instance}`);

//     if (event === "connection.update") {
//       const state = body.data?.state;
//       const isConnected = state === "open";
      
//       console.log(`Processing state mutation for ${instance} to connection_status: ${state}`);

//       const supabase = await createAdminClient();

//       const { error } = await supabase
//         .from("barbershops")
//         .update({
//           whatsapp_status: isConnected ? "CONNECTED" : "DISCONNECTED",
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", instance);

//       if (error) {
//         console.error(`Database update failure for instance ${instance}:`, error.message);
//         return NextResponse.json({ error: "Database sync failed" }, { status: 500 });
//       }

//       console.log(`Successfully synchronized connection state for instance: ${instance}`);
//     }

//     return NextResponse.json({ processed: true });
//   } catch (error) {
//     console.error("Webhook ingestion routine crashed:", error);
//     return NextResponse.json({ error: "Webhook ingestion failure" }, { status: 500 });
//   }
// }