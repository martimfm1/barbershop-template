import { NextResponse } from 'next/server';
import { moduleErrorResponse, requireModuleContext } from '@/services/modules/authorization';

const STATUSES = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<Status, readonly Status[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { admin, barbershopId } = await requireModuleContext('pos', 'pos');
    const { orderId } = await params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    const status = typeof body?.status === 'string' ? body.status : '';

    if (!STATUSES.includes(status as Status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const { data: current, error: currentError } = await admin
      .from('marketplace_orders')
      .select('*')
      .eq('id', orderId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();

    if (currentError) {
      console.error('[MARKETPLACE_ORDER_READ_ERROR]', currentError.code ?? 'UNKNOWN');
      return NextResponse.json({ error: 'Não foi possível carregar a encomenda.' }, { status: 503 });
    }

    if (!current) {
      return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    }

    const currentStatus = current.status as Status;
    if (currentStatus === status) {
      return NextResponse.json({ order: current });
    }

    if (!ALLOWED_TRANSITIONS[currentStatus].includes(status as Status)) {
      return NextResponse.json(
        { error: 'Esta encomenda não pode passar diretamente para esse estado.' },
        { status: 409 },
      );
    }

    if (status === 'cancelled') {
      const { data, error } = await admin.rpc('cancel_marketplace_order_atomic', {
        p_order_id: orderId,
        p_barbershop_id: barbershopId,
      });

      if (error || !data) {
        console.error('[MARKETPLACE_ORDER_CANCEL_ERROR]', error?.code ?? 'UNKNOWN');
        return NextResponse.json(
          { error: 'Não foi possível cancelar a encomenda.' },
          { status: 409 },
        );
      }

      return NextResponse.json({ order: data });
    }

    const { data, error } = await admin
      .from('marketplace_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('barbershop_id', barbershopId)
      .eq('status', currentStatus)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: 'A encomenda foi alterada entretanto. Atualiza a página e tenta novamente.' },
        { status: 409 },
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { error: 'Não foi possível atualizar a encomenda.' },
      { status: 500 },
    );
  }
}
