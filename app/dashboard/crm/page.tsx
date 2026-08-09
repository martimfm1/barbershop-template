"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Users, ChevronRight, Lock, Plus, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type ClientRow = { id: string; name_complete: string; email?: string | null; num_phone?: string | null };
type TagRow = { id: string; name: string };

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada. Volta a iniciar sessão.");
  return { Authorization: `Bearer ${session.access_token}` };
}

export default function CRMPage() {
  const { hasFeature, loading: billingLoading } = useFeatureAccess();
  const allowed = hasFeature("advanced_crm");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    if (billingLoading || !allowed) return;
    let cancelled = false;
    const load = async () => {
      try {
        const headers = await authHeaders();
        const [clientsRes, tagsRes] = await Promise.all([
          fetch(`/api/crm/clients?limit=100&search=${encodeURIComponent(search)}`, { headers, cache: "no-store" }),
          fetch("/api/crm/tags", { headers, cache: "no-store" }),
        ]);
        if (!clientsRes.ok || !tagsRes.ok) throw new Error("Não foi possível carregar o CRM.");
        const clientsJson = await clientsRes.json();
        const tagsJson = await tagsRes.json();
        if (!cancelled) { setClients(clientsJson.clients ?? []); setTags(tagsJson.tags ?? []); }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Erro ao carregar o CRM.");
      } finally { if (!cancelled) setLoading(false); }
    };
    const timer = window.setTimeout(load, search ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [allowed, billingLoading, search]);

  async function handleCreateTag(event: React.FormEvent) {
    event.preventDefault();
    if (!newTag.trim()) return;
    setCreatingTag(true);
    try {
      const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
      const response = await fetch("/api/crm/tags", { method: "POST", headers, body: JSON.stringify({ name: newTag.trim() }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível criar a tag.");
      setTags((current) => [...current, json.tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTag("");
      toast.success("Tag criada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao criar tag."); }
    finally { setCreatingTag(false); }
  }

  if (billingLoading) return <main className="min-h-screen bg-background" />;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24 text-foreground"><div className="mx-auto max-w-2xl"><Card className="border-white/10 bg-white/[0.03]"><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><div className="rounded-2xl bg-primary/10 p-4 text-primary"><Lock className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold">CRM Avançado</h1><p className="mt-2 text-muted-foreground">Clientes, histórico, notas e segmentação num só lugar.</p></div><Button asChild><Link href="/plans">Ver planos</Link></Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-8"><div className="mx-auto max-w-7xl space-y-8"><header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-medium text-primary">CRM AVANÇADO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Clientes</h1><p className="mt-2 text-muted-foreground">Conhece cada cliente e transforma histórico em relacionamento.</p></div><Button asChild><Link href="/dashboard">Voltar ao dashboard</Link></Button></header><div className="grid gap-6 lg:grid-cols-[1fr_300px]"><Card className="border-white/10 bg-white/[0.03]"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Base de clientes</CardTitle><div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar nome, email ou telefone..." className="pl-9" /></div></CardHeader><CardContent>{loading ? <p className="py-10 text-center text-muted-foreground">A carregar...</p> : clients.length === 0 ? <p className="py-10 text-center text-muted-foreground">Nenhum cliente encontrado.</p> : <div className="divide-y divide-white/10">{clients.map((client) => <Link key={client.id} href={`/dashboard/crm/${client.id}`} className="flex items-center justify-between gap-4 py-4 transition hover:bg-white/[0.03] md:px-3"><div className="min-w-0"><p className="truncate font-medium">{client.name_complete}</p><p className="truncate text-sm text-muted-foreground">{client.email || client.num_phone || "Sem contacto"}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>)}</div>}</CardContent></Card><Card className="h-fit border-white/10 bg-white/[0.03]"><CardHeader><CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Segmentação</CardTitle></CardHeader><CardContent><form onSubmit={handleCreateTag} className="flex gap-2"><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} maxLength={50} placeholder="Nova tag" /><Button type="submit" size="icon" disabled={creatingTag || !newTag.trim()}><Plus className="h-4 w-4" /></Button></form><div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">{tag.name}</span>)}</div></CardContent></Card></div></div></main>;
}
