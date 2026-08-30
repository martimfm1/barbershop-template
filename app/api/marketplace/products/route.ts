import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const category = url.searchParams.get('category')?.trim() ?? '';
  const sort = url.searchParams.get('sort') ?? 'featured';
  const shopId = url.searchParams.get('shop')?.trim() ?? '';

  const db = createAdminClient();
  let query = db
    .from('inventory_products')
    .select('id,barbershop_id,name,description,category,image_url,unit_price,compare_at_price,stock_quantity,marketplace_featured,barbershops(name,slug)')
    .eq('active', true)
    .eq('marketplace_visible', true)
    .gt('stock_quantity', 0)
    .limit(100);

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (category) query = query.eq('category', category);
  if (shopId) query = query.eq('barbershop_id', shopId);

  if (sort === 'price_asc') query = query.order('unit_price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('unit_price', { ascending: false });
  else if (sort === 'newest') query = query.order('updated_at', { ascending: false });
  else query = query.order('marketplace_featured', { ascending: false }).order('updated_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('[MARKETPLACE_PRODUCTS_API]', error);
    return NextResponse.json({ error: 'Não foi possível carregar o marketplace.' }, { status: 500 });
  }

  const categories = [...new Set((data ?? []).map((item) => item.category).filter(Boolean))].sort();
  return NextResponse.json({ products: data ?? [], categories });
}
