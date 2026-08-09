"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Pause, Play, Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type Trigger = "booking_created" | "booking_completed" | "booking_cancelled" | "client_inactive" | "birthday";
type Rule = { id: string; name: string; trigger_type: Trigger; active: boolean; conditions: Record<string, unknown>; actions: unknown[]; created_at: string };

const TRIGGERS: { value: Trigger; label: string }[] = [
  { value: "booking_created", label: "Nova marcação" },
  { value: "booking_completed", label: "Marcação concluída" },
  { value: "booking_cancelled", label: "Marcação cancelada" },
  { value: "client_inactive", label: "Cliente inativo" },
  { value: "birthday", label: "Aniversário do cliente" },
];

export default function AutomationsPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("automated_followups");
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<Trigger>("booking_created");

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await fetch("/api/automations/rules", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar as automações.");
      setRules(json.rules ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar automações.");
    } finally { setLoading(false); }
  }, [allowed]);

  useEffect(() => { void load(); }, [load]);

  async function createRule() {
    if (!name.trim()) { toast.error("Indica um nome para a automação."); return; }
    setCreating(true);
    try {
      const response = await fetch("/api/automations/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), triggerType, conditions: {}, actions: [], active: true }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível criar a automação.");
      setRules((current) => [json.rule, ...current]);
      setName("");
      toast.success("Automação criada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao criar automação."); }
    finally { setCreating(false); }
  }

  if (accessLoading) return <main className="min-h-screen bg-background" />;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Automações</h1><p className="text-muted-foreground">Follow-ups automáticos estão disponíveis no plano Pro e Enterprise.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">AUTOMAÇÕES · PRO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Follow-ups automáticos</h1><p className="mt-1 text-muted-foreground">Cria regras para reagir automaticamente aos eventos dos clientes.</p></div><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button></header>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Nova automação</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><label className="text-xs text-muted-foreground">Nome</label><Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Follow-up após marcação" maxLength={120} /></div><div><label className="text-xs text-muted-foreground">Gatilho</label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={triggerType} onChange={(e) => setTriggerType(e.target.value as Trigger)}>{TRIGGERS.map((trigger) => <option key={trigger.value} value={trigger.value}>{trigger.label}</option>)}</select></div><Button onClick={() => void createRule()} disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Criar</Button></CardContent></Card>
    <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Regras existentes</h2><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button></div>
    {loading && rules.length === 0 ? <div className="flex h-48 items-center justify-center text-muted-foreground">A carregar...</div> : rules.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Zap className="h-8 w-8 text-muted-foreground" /><p className="font-medium">Ainda não tens automações.</p><p className="text-sm text-muted-foreground">Cria a primeira regra acima.</p></CardContent></Card> : <div className="space-y-3">{rules.map((rule) => <Card key={rule.id}><CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${rule.active ? "bg-emerald-500" : "bg-muted-foreground"}`} /><p className="truncate font-medium">{rule.name}</p></div><p className="mt-1 text-sm text-muted-foreground">{TRIGGERS.find((trigger) => trigger.value === rule.trigger_type)?.label ?? rule.trigger_type} · {rule.actions.length} ação(ões)</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled title="A gestão de ações é feita pela configuração da automação.">{rule.active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{rule.active ? "Ativa" : "Inativa"}</Button><Button variant="ghost" size="icon" disabled title="Eliminação será disponibilizada na API de gestão de regras"><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>}
  </div></main>;
}
