"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Mail, MessageSquare, Plus, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

 type Campaign = { id: string; name: string; channel: "email" | "sms"; subject: string | null; body: string; status: string; scheduled_at: string | null; created_at: string };

export default function MarketingPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("marketing_campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "email" as "email" | "sms", subject: "", body: "" });

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch("/api/marketing/campaigns", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as campanhas.");
      setCampaigns(data.campaigns ?? []);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao carregar campanhas."); }
    finally { setLoading(false); }
  }, [allowed]);

  useEffect(() => { void load(); }, [load]);

  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/marketing/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar a campanha.");
      toast.success("Campanha criada como rascunho.");
      setCampaigns((current) => [data.campaign, ...current]);
      setForm({ name: "", channel: "email", subject: "", body: "" });
      setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao criar campanha."); }
    finally { setCreating(false); }
  }

  if (accessLoading) return <main className="min-h-screen bg-background" />;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Campanhas de marketing</h1><p className="text-muted-foreground">Crie campanhas segmentadas de email e SMS com o plano Pro.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">MARKETING · PRO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Campanhas</h1><p className="mt-1 text-muted-foreground">Cria comunicações para os clientes da tua barbearia.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button><Button onClick={() => setOpen((value) => !value)}><Plus className="mr-2 h-4 w-4" />Nova campanha</Button></div></header>

  {open && <Card><CardHeader><CardTitle>Nova campanha</CardTitle></CardHeader><CardContent><form onSubmit={createCampaign} className="grid gap-4"><div className="grid gap-4 md:grid-cols-2"><div><label className="text-sm font-medium">Nome interno</label><Input className="mt-1" value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campanha de aniversário" required /></div><div><label className="text-sm font-medium">Canal</label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as "email" | "sms" })}><option value="email">Email</option><option value="sms">SMS</option></select></div></div>{form.channel === "email" && <div><label className="text-sm font-medium">Assunto</label><Input className="mt-1" value={form.subject} maxLength={200} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Temos uma surpresa para ti" required /></div>}<div><label className="text-sm font-medium">Mensagem</label><Textarea className="mt-1 min-h-36" value={form.body} maxLength={10000} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Escreve a mensagem da campanha..." required /></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Guardar campanha</Button></div></form></CardContent></Card>}

  <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Campanhas recentes</CardTitle><Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button></CardHeader><CardContent>{loading && !campaigns.length ? <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar...</div> : campaigns.length ? <div className="divide-y divide-white/10">{campaigns.map((campaign) => <div key={campaign.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3">{campaign.channel === "email" ? <Mail className="h-5 w-5 shrink-0 text-primary" /> : <MessageSquare className="h-5 w-5 shrink-0 text-primary" />}<div className="min-w-0"><p className="truncate font-medium">{campaign.name}</p><p className="text-sm text-muted-foreground">{campaign.channel.toUpperCase()} · {new Date(campaign.created_at).toLocaleDateString("pt-PT")}</p></div></div><span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-medium capitalize">{campaign.status}</span></div>)}</div> : <div className="py-16 text-center"><Send className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><p className="font-medium">Ainda não existem campanhas</p><p className="mt-1 text-sm text-muted-foreground">Cria a primeira campanha para começar.</p></div>}</CardContent></Card></div></main>;
}
