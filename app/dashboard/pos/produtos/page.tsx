'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Package, Pencil, Plus, Search, Star, Store, Trash2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  sku: string | null;
  unit_price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  active: boolean;
  marketplace_visible: boolean;
  marketplace_featured: boolean;
};

type FormState = {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  sku: string;
  unitPrice: string;
  compareAtPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  active: boolean;
  marketplaceVisible: boolean;
  marketplaceFeatured: boolean;
};

const EMPTY_FORM: FormState = {
  name: '', description: '', category: '', imageUrl: '', sku: '', unitPrice: '',
  compareAtPrice: '', stockQuantity: '0', lowStockThreshold: '0', active: true,
  marketplaceVisible: false, marketplaceFeatured: false,
};

const money = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);

export default function MarketplaceProductsPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/manage/products', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Não foi possível carregar os produtos.');
      setProducts(json.products ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar os produtos.');
    } finally { setLoading(false); }
  }

  useEffect(() => { if (!accessLoading && allowed) void load(); }, [accessLoading, allowed]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort(), [products]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-PT');
    return products.filter((p) => {
      const text = `${p.name} ${p.description ?? ''} ${p.sku ?? ''}`.toLocaleLowerCase('pt-PT');
      return (!term || text.includes(term)) && (category === 'all' || p.category === category) && (visibility === 'all' || (visibility === 'published' ? p.marketplace_visible : !p.marketplace_visible));
    });
  }, [products, search, category, visibility]);

  function startCreate() { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function startEdit(product: Product) {
    setEditing(product);
    setForm({ name: product.name, description: product.description ?? '', category: product.category ?? '', imageUrl: product.image_url ?? '', sku: product.sku ?? '', unitPrice: String(product.unit_price), compareAtPrice: product.compare_at_price == null ? '' : String(product.compare_at_price), stockQuantity: String(product.stock_quantity), lowStockThreshold: String(product.low_stock_threshold), active: product.active, marketplaceVisible: product.marketplace_visible, marketplaceFeatured: product.marketplace_featured });
    setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const url = editing ? `/api/marketplace/manage/products/${editing.id}` : '/api/marketplace/manage/products';
      const response = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Não foi possível guardar o produto.');
      toast.success(editing ? 'Produto atualizado.' : 'Produto criado.'); setEditing(null); setForm(EMPTY_FORM); setFormOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao guardar o produto.'); }
    finally { setSaving(false); }
  }

  async function archive(product: Product) {
    if (!window.confirm(`Arquivar “${product.name}”?`)) return;
    try { const response = await fetch(`/api/marketplace/manage/products/${product.id}`, { method: 'DELETE' }); const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Não foi possível arquivar.'); toast.success('Produto arquivado.'); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao arquivar.'); }
  }

  if (accessLoading || loading) return <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100"><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-16 rounded-2xl bg-white/5"/><div className="h-24 rounded-2xl bg-white/5"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 rounded-3xl bg-white/5"/>)}</div></div></main>;
  if (!allowed) return <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100"><div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"><Package className="mx-auto size-8 text-emerald-300"/><h1 className="mt-4 text-2xl font-semibold">Produtos do marketplace</h1><p className="mt-2 text-sm text-zinc-500">Esta área faz parte do módulo de vendas.</p><Button asChild className="mt-5"><Link href="/dashboard/billing">Ver plano</Link></Button></div></main>;

  return <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/dashboard/pos" className="inline-flex min-h-10 items-center gap-2 text-sm text-zinc-500 hover:text-white"><span aria-hidden="true">←</span>Voltar ao ponto de venda</Link><div className="mt-5 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"><Store className="size-5"/></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Marketplace</p><h1 className="text-3xl font-semibold tracking-tight">Produtos</h1></div></div><p className="mt-2 max-w-2xl text-sm text-zinc-500">Define o que vendes, controla o stock e escolhe exatamente o que aparece publicamente.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" asChild className="min-h-11"><Link href="/marketplace" target="_blank">Abrir marketplace</Link></Button><Button onClick={startCreate} className="min-h-11 bg-zinc-50 text-zinc-950 hover:bg-white"><Plus className="mr-2 size-4"/>Novo produto</Button></div></header>
    <Card className="border-white/10 bg-white/[0.02]"><CardContent className="p-3 sm:p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Pesquisar nome, descrição ou SKU" className="min-h-11 border-white/10 bg-white/[0.03] pl-9" aria-label="Pesquisar produtos"/></div><select value={category} onChange={(e)=>setCategory(e.target.value)} aria-label="Filtrar por categoria" className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm"><option value="all">Todas as categorias</option>{categories.map((item)=><option key={item} value={item}>{item}</option>)}</select><select value={visibility} onChange={(e)=>setVisibility(e.target.value)} aria-label="Filtrar por publicação" className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm"><option value="all">Todos</option><option value="published">Publicados</option><option value="hidden">Não publicados</option></select></div></CardContent></Card>
    {formOpen && <Card className="border-emerald-400/15 bg-emerald-400/[0.025]"><CardHeader><CardTitle>{editing ? `Editar ${editing.name}` : 'Novo produto'}</CardTitle><p className="text-sm text-zinc-500">O mesmo produto fica disponível no POS e, quando publicado, no marketplace.</p></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><label className="grid gap-1.5 md:col-span-2"><span className="text-xs font-medium text-zinc-300">Nome *</span><Input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Pomada Matte 100ml"/></label><label className="grid gap-1.5 md:col-span-2"><span className="text-xs font-medium text-zinc-300">Descrição</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="min-h-24 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white outline-none focus:border-emerald-400/40" placeholder="Descrição curta e útil para o cliente."/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">Categoria</span><Input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} placeholder="Cabelo"/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">SKU</span><Input value={form.sku} onChange={(e)=>setForm({...form,sku:e.target.value})} placeholder="Opcional"/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">Preço (€) *</span><Input required type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e)=>setForm({...form,unitPrice:e.target.value})}/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">Preço anterior</span><Input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e)=>setForm({...form,compareAtPrice:e.target.value})} placeholder="Opcional"/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">Stock *</span><Input required type="number" min="0" step="1" value={form.stockQuantity} onChange={(e)=>setForm({...form,stockQuantity:e.target.value})}/></label><label className="grid gap-1.5"><span className="text-xs font-medium text-zinc-300">Alerta de stock</span><Input type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(e)=>setForm({...form,lowStockThreshold:e.target.value})}/></label><label className="grid gap-1.5 md:col-span-2"><span className="text-xs font-medium text-zinc-300">URL da imagem</span><Input type="url" value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} placeholder="https://..."/></label><fieldset className="grid gap-2 md:col-span-2"><legend className="text-xs font-semibold text-zinc-300">Publicação</legend><div className="grid gap-2 sm:grid-cols-3"><label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-xs"><input type="checkbox" checked={form.active} onChange={(e)=>setForm({...form,active:e.target.checked})}/><span>Produto ativo</span></label><label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 text-xs"><input type="checkbox" checked={form.marketplaceVisible} onChange={(e)=>setForm({...form,marketplaceVisible:e.target.checked})}/><span>Publicar no marketplace</span></label><label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 text-xs"><input type="checkbox" checked={form.marketplaceFeatured} onChange={(e)=>setForm({...form,marketplaceFeatured:e.target.checked})}/><Star className="size-3.5 text-amber-300"/><span>Produto em destaque</span></label></div></fieldset><div className="flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={()=>{setFormOpen(false);setEditing(null);setForm(EMPTY_FORM)}}>Cancelar</Button><Button type="submit" disabled={saving} className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300">{saving ? 'A guardar…' : 'Guardar produto'}</Button></div></form></CardContent></Card>}
    <section aria-live="polite"><div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold">Catálogo</h2><p className="text-xs text-zinc-500">{filtered.length} produto{filtered.length===1?'':'s'} visível{filtered.length===1?'':'is'} com estes filtros.</p></div></div>{filtered.length===0?<div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-sm text-zinc-500">Não encontrámos produtos. Experimenta limpar os filtros ou criar um novo produto.</div>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product)=><article key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"><div className="relative aspect-[4/3] bg-white/[0.03]">{product.image_url?<div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(${product.image_url})`}} role="img" aria-label={product.name}/>:<div className="absolute inset-0 flex items-center justify-center text-zinc-700"><ImageIcon className="size-10"/></div>}<div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{product.marketplace_visible&&<span className="rounded-full border border-emerald-400/20 bg-zinc-950/80 px-2 py-1 text-[10px] font-semibold text-emerald-300">Publicado</span>}{product.marketplace_featured&&<span className="rounded-full border border-amber-400/20 bg-zinc-950/80 px-2 py-1 text-[10px] font-semibold text-amber-200">Destaque</span>}</div></div><div className="space-y-4 p-5"><div><h3 className="font-semibold text-zinc-100">{product.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{product.description||'Sem descrição.'}</p></div><div className="flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-xl font-semibold">{money(product.unit_price)}</span>{product.compare_at_price&&product.compare_at_price>product.unit_price?<span className="text-xs text-zinc-600 line-through">{money(product.compare_at_price)}</span>:null}</div><p className={`mt-1 text-[11px] ${product.stock_quantity<=product.low_stock_threshold?'text-amber-300':'text-zinc-600'}`}>{product.stock_quantity<=product.low_stock_threshold?'Stock baixo · ':''}{product.stock_quantity} em stock{product.category?` · ${product.category}`:''}</p></div><div className="flex gap-1.5"><Button variant="outline" size="icon" onClick={()=>startEdit(product)} aria-label={`Editar ${product.name}`}><Pencil className="size-4"/></Button><Button variant="outline" size="icon" onClick={()=>void archive(product)} aria-label={`Arquivar ${product.name}`} className="text-rose-300 hover:text-rose-200"><Trash2 className="size-4"/></Button></div></div></div></article>)}</div>}</section>
  </div></main>;
}
