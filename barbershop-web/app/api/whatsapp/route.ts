// app/api/whatsapp/route.ts
import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/whatsapp-bot';

export async function GET() {
  try {
    const currentStatus = getStatus();
    return NextResponse.json({ status: currentStatus });
  } catch (error) {
    // Se o bot ainda não foi iniciado ou der erro, assume offline para o dashboard
    return NextResponse.json({ status: 'offline' });
  }
}