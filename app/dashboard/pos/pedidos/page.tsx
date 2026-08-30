'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ClipboardList, Clock3, Mail, MapPin, PackageCheck, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Item = { id: string; product_name: string; quantity: number; unit_price: number; total: number };
type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  subtotal: number;
  total: number;
  fulfillment_method: 'pickup' | 'delivery';
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  marketplace_order_items: Item[];
};
const money = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
const statusMeta = {
  pending: { label: 'Novo', icon: Clock3, classes: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  confirmed: { label: 'Confirmado', icon: Check, classes: 'bg-sky-400/10 text-sky-300 border-sky-400/20' },
  ready: { label: 'Pronto', icon: PackageCheck, classes: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
  completed: { label: 'Concluído', icon: ClipboardList, classes: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20' },
  cancelled: { label: 'Cancelado', icon: XCircle, classes: 'bg-rose-400/10 text-rose-300 border-rose-400/20' },
} as const;

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Order['status']>('all');
  const [fulfillment, setFulfillment] = useState<'all' | Order['fulfillment_method']>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/orders', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Não foi possível carregar as encomendas.');
      setOrders(json.orders ?? []);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao carregar encomendas.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-PT');
    return orders.filter((order) => {
      const text = `${order.id} ${order.customer_name} ${order.customer_email} ${order.customer_phone}`.toLocaleLowerCase('pt-PT');
      return (!term || text.includes(term)) && (status === 'all' || order.status === status) && (fulfillment === 'all' || order.fulfillment_method === fulfillment);
    });
  }, [orders, query, status, fulfillment]);

  const stats = useMemo(() => ({
    open: orders.filter((order) => ['pending', 'confirmed', 'ready'].includes(order.status)).length,
    delivery: orders.filter((order) => order.fulfillment_method === 'delivery' && order.status !== 'cancelled').length,
    revenue: orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total), 0),
    completed: orders.filter((order) => order.status === 'completed').length,
  }), [orders]);

  async function changeStatus(order: Order, next: Order['status']) {
    setUpdating(order.id);
    try {
      const response = await fetch(`/api/marketplace/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Não foi possível atualizar.');
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...json.order, status: next } : item));
      toast.success(next === 'cancelled' ? 'Encomenda cancelada.' : 'Estado atualizado.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao atualizar.'); }
    finally { setUpdating(null); }
  }

  return <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/dashboard/pos" className="inline-flex min-h-10 items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="size-4"/>Voltar ao ponto de venda</Link><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Vendas</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Encomendas</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Um único sítio para acompanhar encomendas online. O pagamento, levantamento e envio continuam do lado da barbearia.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading} className="min-h-11"><RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button></header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Summary icon={Clock3} label="Em aberto" value={String(stats.open)} detail="precisam de ação"/><Summary icon={Truck} label="Para enviar" value={String(stats.delivery)} detail="envio pela barbearia"/><Summary icon={ClipboardList} label="Volume vendido" value={money(stats.revenue)} detail="encomendas não canceladas"/><Summary icon={Check} label="Concluídas" value={String(stats.completed)} detail="histórico completo"/></div>

    <Card className="border-white/10 bg-white/[0.02]"><CardContent className="p-3"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"/><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar nome, email, telefone ou ID" className="min-h-11 border-white/10 bg-white/[0.03] pl-9" aria-label="Pesquisar encomendas"/></div><select value={fulfillment} onChange={(event) => setFulfillment(event.target.value as 'all' | Order['fulfillment_method'])} aria-label="Filtrar por entrega" className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm"><option value="all">Todas as formas</option><option value="pickup">Levantamento</option><option value="delivery">Entrega</option></select><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | Order['status'])} aria-label="Filtrar estado" className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm"><option value="all">Todos os estados</option><option value="pending">Novos</option><option value="confirmed">Confirmados</option><option value="ready">Prontos</option><option value="completed">Concluídos</option><option value="cancelled">Cancelados</option></select></div></CardContent></Card>

    {loading ? <div className="grid gap-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-3xl bg-white/[0.03]" />)}</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center"><ClipboardList className="mx-auto size-7 text-zinc-700"/><p className="mt-4 text-sm text-zinc-500">Não há encomendas com estes filtros.</p></div> : <div className="space-y-4">
      {filtered.map((order) => {
        const meta = statusMeta[order.status];
        const Icon = meta.icon;
        const next = order.status === 'pending' ? 'confirmed' : order.status === 'confirmed' ? 'ready' : order.status === 'ready' ? 'completed' : null;
        const isDelivery = order.fulfillment_method === 'delivery';
        return <Card key={order.id} className="overflow-hidden border-white/10 bg-white/[0.02]">
          <CardHeader className="border-b border-white/[0.06] p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`flex size-8 items-center justify-center rounded-lg border ${meta.classes}`}><Icon className="size-4"/></span><CardTitle className="text-base">{order.customer_name}</CardTitle>{isDelivery ? <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/15 bg-sky-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-sky-300"><Truck className="size-3"/>Entrega</span> : <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-400"><StoreIcon/>Levantamento</span>}</div><p className="mt-2 text-xs text-zinc-500">Pedido <span className="font-mono text-zinc-400">#{order.id.slice(0,8)}</span> · {new Date(order.created_at).toLocaleString('pt-PT')}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.classes}`}>{meta.label}</span></div></CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-5"><div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <div className="space-y-2">{order.marketplace_order_items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.055] bg-white/[0.02] p-3 text-sm"><span className="min-w-0 truncate"><strong>{item.product_name}</strong><span className="ml-2 text-xs text-zinc-600">× {item.quantity}</span></span><span className="font-semibold">{money(item.total)}</span></div>)}{order.notes && <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-3 text-xs leading-5 text-amber-100"><strong>Nota:</strong> {order.notes}</div>}</div>
            <div className="space-y-3"><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Cliente</p><a className="mt-2 flex items-center gap-2 text-sm text-zinc-200 hover:text-emerald-300" href={`mailto:${order.customer_email}`}><Mail className="size-3.5"/>{order.customer_email}</a><p className="mt-1 text-sm text-zinc-400">{order.customer_phone}</p></div>{isDelivery && <div className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.03] p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-300"><MapPin className="size-3.5"/>Morada</p><p className="mt-2 text-sm leading-6 text-zinc-300">{order.shipping_address}<br/>{order.shipping_postal_code} {order.shipping_city}</p><p className="mt-2 text-[11px] leading-5 text-zinc-600">Trata do envio diretamente com o cliente.</p></div>}<div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-zinc-500">Total</span><strong className="text-xl">{money(order.total)}</strong></div></div></div>
          </div><div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">{next && <Button disabled={updating === order.id} onClick={() => void changeStatus(order, next)} className="min-h-11 bg-emerald-400 text-zinc-950 hover:bg-emerald-300">{next === 'confirmed' ? 'Confirmar' : next === 'ready' ? (isDelivery ? 'Pronto para enviar' : 'Pronto para levantar') : 'Marcar como concluído'}</Button>}{order.status !== 'cancelled' && order.status !== 'completed' && <Button variant="outline" disabled={updating === order.id} onClick={() => void changeStatus(order, 'cancelled')} className="min-h-11 text-rose-300 hover:text-rose-200">Cancelar</Button>}</div></CardContent>
        </Card>;
      })}
    </div>}
  </div></main>;
}

function Summary({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail: string }) {
  return <Card className="border-white/10 bg-white/[0.02]"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-zinc-500">{label}</span><Icon className="size-4 text-zinc-600"/></div><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-zinc-600">{detail}</p></CardContent></Card>;
}
function StoreIcon() { return <span className="inline-block size-3.5 rounded border border-zinc-500/70" aria-hidden="true"/>; }
