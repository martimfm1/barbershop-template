// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarBot } = await import('./lib/whatsapp-bot');
    iniciarBot();
    console.log("🚀 Bot WhatsApp iniciado.");
  }
}