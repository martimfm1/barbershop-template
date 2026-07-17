export interface InstanceState {
  status: "NOT_INITIALIZED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR";
  connected: boolean;
  qrCode: string | null;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private readonly baseUrl = process.env.WHATSAPP_GATEWAY_URL;
  private readonly apiKey = process.env.WHATSAPP_GATEWAY_KEY;

  private constructor() {
    if (!this.baseUrl || !this.apiKey) {
      console.error("Missing environment variables for WhatsAppService");
    }
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  private get headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "apikey": this.apiKey || "",
    };
  }

  public async getStatus(barbershopId: string): Promise<InstanceState> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${barbershopId}`, {
        method: "GET",
        headers: this.headers,
      });

      if (response.status === 404) {
        console.log(`Instance not found for barbershop: ${barbershopId}`);
        return { status: "NOT_INITIALIZED", connected: false, qrCode: null };
      }

      const data = await response.json();
      const isConnected = data?.instance?.state === "open";

      return {
        status: isConnected ? "CONNECTED" : "INITIALIZING",
        connected: isConnected,
        qrCode: data?.instance?.qrcode?.base64 || null,
      };
    } catch (error) {
      console.error(`Error fetching instance state for ${barbershopId}:`, error);
      return { status: "ERROR", connected: false, qrCode: null };
    }
  }

  public async initialize(barbershopId: string): Promise<InstanceState> {
    const currentState = await this.getStatus(barbershopId);
    if (currentState.connected) {
      return currentState;
    }

    console.log(`Initializing new WhatsApp instance for barbershop: ${barbershopId}`);

    const response = await fetch(`${this.baseUrl}/instance/create`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        instanceName: barbershopId,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!response.ok) {
      console.error(`Failed to create instance: ${response.statusText}`);
      throw new Error("GATEWAY_CREATION_FAILED");
    }

    const data = await response.json();

    if (data?.qrcode?.base64) {
      return {
        status: "QR_CODE",
        connected: false,
        qrCode: data.qrcode.base64,
      };
    }

    return { status: "INITIALIZING", connected: false, qrCode: null };
  }

  public async disconnect(barbershopId: string): Promise<void> {
    console.log(`Terminating instance session for barbershop: ${barbershopId}`);
    
    await fetch(`${this.baseUrl}/instance/logout/${barbershopId}`, {
      method: "DELETE",
      headers: this.headers,
    });

    await fetch(`${this.baseUrl}/instance/delete/${barbershopId}`, {
      method: "DELETE",
      headers: this.headers,
    });
  }

  public async sendAlert(barbershopId: string, phone: string, text: string): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, "");
    console.log(`Routing notification package to gateway for instance: ${barbershopId}`);

    const response = await fetch(`${this.baseUrl}/message/sendText/${barbershopId}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        number: cleanPhone,
        options: {
          delay: 1000,
          presence: "composing",
        },
        textMessage: { text },
      }),
    });

    if (!response.ok) {
      console.error(`Gateway message delivery rejection: ${response.statusText}`);
      throw new Error("MESSAGE_ROUTING_FAILED");
    }
  }
}