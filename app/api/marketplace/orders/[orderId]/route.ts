import { NextResponse } from 'next/server';
import { moduleErrorResponse, requireModuleContext } from '@/services/modules/authorization';

const STATUSES = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { admin, barbershopId } = await requireModuleContext('pos', 'pos');
    const { orderId } = await params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    const status = typeof body?.status === 'string' ? body.status : '';
    if (!STATUSES.includes(status as Status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    if (status === 'cancelled') {
      const { data, error } = await admin.rpc('cancel_marketplace_order_atomic', {
        p_order_id: orderId,
        p_barbershop_id: barbershopId,
      });
      if (error || !data) {
        const message = error?.message ?? 'Não foi possível cancelar a encomenda.';
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json({ order: data });
    }

    const { data, error } = await admin
      .from('marketplace_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('barbershop_id', barbershopId)
      .select('*')
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: 'Não foi possível atualizar a encomenda.' }, { status: 500 });
  }
}
