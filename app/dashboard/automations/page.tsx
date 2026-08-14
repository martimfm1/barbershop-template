"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, CalendarCheck2, Clock3, Loader2, Lock, Pause, Play, Plus, RefreshCw, Trash2, UserRound, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type Trigger = "booking_created" | "booking_completed" | "booking_cancelled" | "client_inactive" | "birthday";
type Rule = { id: string; name: string; trigger_type: Trigger; active: boolean; conditions: Record<string, unknown>; actions: unknown[]; created_at: string };

const TRIGGERS: { value: Trigger; label: string; description: string; icon: typeof Zap }[] = [
  { value: "booking_created", label: "Nova marcação", description: "Quando uma nova marcação é criada.", icon: CalendarCheck2 },
  { value: "booking_completed", label: "Marcação concluída", description: "Depois de um serviço concluído.", icon: CalendarCheck2 },
  { value: "booking_cancelled", label: "Marcação cancelada", description: "Quando uma reserva é cancelada.", icon: Bell },
  { value: "client_inactive", label: "Cliente inativo", description: "Quando um cliente deixa de voltar.", icon: UserRound },
  { value: "birthday", label: "Aniversário do cliente", description: "No dia de aniversário do cliente.", icon: Bell },
];

function triggerMeta(value: Trigger) {
  return TRIGGERS.find((trigger) => trigger.value === value) ?? TRIGGERS[0];
}

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
      const response = await fetch("/api/automations/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), triggerType, conditions: {}, actions: [], active: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível criar a automação.");
      setRules((current) => [json.rule, ...current]);
      setName("");
      toast.success("Regra criada como configuração inicial.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao criar automação."); }
    finally { setCreating(false); }
  }

  if (accessLoading) return <main className="min-h-screen bg-background" />;

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-24">
        <div className="mx-auto max-w-xl">
          <Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center">
            <Lock className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">Automações</h1>
            <p className="text-muted-foreground">Follow-ups automáticos estão disponíveis no plano Pro e Enterprise.</p>
            <Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button>
          </CardContent></Card>
        </div>
      </main>
    );
  }

  const selected = triggerMeta(triggerType);
  const activeCount = rules.filter((rule) => rule.active).length;
  const configuredCount = rules.filter((rule) => rule.actions.length > 0).length;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">AUTOMAÇÕES</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Follow-ups automáticos</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Define o evento que inicia uma regra e acompanha o estado das automações num só lugar.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button>
            <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar automações"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Regras</p><p className="mt-1 text-2xl font-semibold">{rules.length}</p><p className="mt-1 text-xs text-muted-foreground">Todas as regras criadas.</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ativas</p><p className="mt-1 text-2xl font-semibold">{activeCount}</p><p className="mt-1 text-xs text-muted-foreground">Prontas para serem processadas pelo sistema.</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Com ações</p><p className="mt-1 text-2xl font-semibold">{configuredCount}</p><p className="mt-1 text-xs text-muted-foreground">Regras que já têm ações guardadas.</p></CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Nova automação</CardTitle>
              <p className="text-sm text-muted-foreground">Começa pelo gatilho. A regra é criada sem ações para poderes continuar a configuração quando o editor de ações estiver disponível.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium">Nome interno</label>
                <Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Lembrete após serviço" maxLength={120} />
                <p className="mt-1 text-xs text-muted-foreground">Só aparece na tua dashboard. Usa um nome que explique claramente o objetivo.</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3"><label className="text-sm font-medium">Quando deve começar?</label><span className="text-xs text-muted-foreground">Gatilho</span></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TRIGGERS.map((trigger) => {
                    const Icon = trigger.icon;
                    const isSelected = trigger.value === triggerType;
                    return <button key={trigger.value} type="button" onClick={() => setTriggerType(trigger.value)} className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-white/10 hover:bg-muted/30"}`}>
                      <div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span><div><p className="text-sm font-medium">{trigger.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{trigger.description}</p></div></div>
                    </button>;
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-medium">Estado inicial</p><p className="mt-1 text-xs text-muted-foreground">A nova regra será criada como ativa.</p></div>
                <Button onClick={() => void createRule()} disabled={creating || !name.trim()}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Criar regra</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Pré-visualização</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary"><span className="h-2 w-2 rounded-full bg-primary" />Gatilho</div>
                <div className="mt-3 flex items-center gap-3 rounded-xl border bg-background p-4"><selected.icon className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-medium">{selected.label}</p><p className="text-xs text-muted-foreground">{selected.description}</p></div></div>
                <div className="mx-auto flex h-10 w-px bg-border" />
                <div className="rounded-xl border border-dashed p-4 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Ação automática</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Ainda não configurada nesta etapa.</p></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Assim consegues perceber a lógica antes de criares a regra: <strong>quando acontece o gatilho → a automação executa uma ação</strong>.</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4"><h2 className="text-xl font-semibold">Automações existentes</h2><p className="mt-1 text-sm text-muted-foreground">Revê rapidamente quais estão ativas e quais ainda precisam de ações.</p></div>
          {loading && rules.length === 0 ? <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar...</div> : rules.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Zap className="h-8 w-8 text-muted-foreground" /><p className="font-medium">Ainda não tens automações</p><p className="text-sm text-muted-foreground">Cria uma regra acima para começar.</p></CardContent></Card> : <div className="grid gap-3 lg:grid-cols-2">{rules.map((rule) => { const meta = triggerMeta(rule.trigger_type); const Icon = meta.icon; return <Card key={rule.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${rule.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-medium">{rule.name}</p><p className="mt-1 text-sm text-muted-foreground">{meta.label}</p></div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${rule.active ? "border-emerald-500/20 text-emerald-500" : "border-white/10 text-muted-foreground"}`}>{rule.active ? "Ativa" : "Inativa"}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-muted/30 p-3"><p className="text-muted-foreground">Ações</p><p className="mt-1 font-semibold">{rule.actions.length}</p></div><div className="rounded-lg bg-muted/30 p-3"><p className="text-muted-foreground">Criada em</p><p className="mt-1 font-semibold">{new Date(rule.created_at).toLocaleDateString("pt-PT")}</p></div></div><div className="mt-4 flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled title="A API atual ainda não disponibiliza a alteração do estado.">{rule.active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{rule.active ? "Ativa" : "Inativa"}</Button><Button variant="ghost" size="icon" disabled title="A API atual ainda não disponibiliza a eliminação de regras."><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>; })}</div>}
        </section>
      </div>
    </main>
  );
}
