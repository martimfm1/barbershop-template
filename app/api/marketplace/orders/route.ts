import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { moduleErrorResponse, requireModuleContext } from '@/services/modules/authorization';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { admin, barbershopId } = await requireModuleContext('pos', 'pos');
    const { data, error } = await admin
      .from('marketplace_orders')
      .select('*, marketplace_order_items(*)')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: 'Não foi possível carregar as encomendas.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
    const customerPhone = typeof body?.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
    const shopId = typeof body?.barbershopId === 'string' ? body.barbershopId : '';
    const items = Array.isArray(body?.items) ? body.items.slice(0, 30) : [];

    if (customerName.length < 2 || customerEmail.length < 5 || !customerEmail.includes('@') || customerPhone.length < 6 || !shopId || items.length === 0) {
      return NextResponse.json({ error: 'Preenche os teus dados e adiciona pelo menos um produto.' }, { status: 400 });
    }

    const db = createAdminClient();
    const normalizedItems = items.map((item) => ({
      productId: typeof (item as Record<string, unknown>)?.productId === 'string' ? (item as Record<string, unknown>).productId : '',
      quantity: Number((item as Record<string, unknown>)?.quantity),
    }));
    if (normalizedItems.some((item) => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 50)) {
      return NextResponse.json({ error: 'O carrinho contém produtos inválidos.' }, { status: 400 });
    }

    const { data, error } = await db.rpc('create_marketplace_order_atomic', {
      p_barbershop_id: shopId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_notes: notes || null,
      p_items: normalizedItems,
    });
    if (error || !data) {
      const message = error?.message ?? 'Não foi possível criar a encomenda.';
      return NextResponse.json({ error: /stock|unavailable/i.test(message) ? 'Um dos produtos deixou de ter stock suficiente. Atualiza o carrinho e tenta novamente.' : message }, { status: 409 });
    }
    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    console.error('[MARKETPLACE_ORDER_API]', error);
    return NextResponse.json({ error: 'Não foi possível concluir a encomenda.' }, { status: 500 });
  }
}
