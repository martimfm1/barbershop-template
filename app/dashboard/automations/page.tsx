"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, CalendarCheck2, Clock3, Loader2, Lock, Mail, Pause, Play, Plus, RefreshCw, Save, Trash2, UserRound, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type Trigger = "booking_created" | "booking_completed" | "booking_cancelled" | "client_inactive" | "birthday";
type Action = { type: "email" | "sms"; subject?: string; body?: string };
type Rule = { id: string; name: string; trigger_type: Trigger; active: boolean; conditions: Record<string, unknown>; actions: Action[]; created_at: string };
const TRIGGERS: { value: Trigger; label: string; description: string; icon: typeof Zap }[] = [
  { value: "booking_created", label: "Nova marcação", description: "Quando uma nova marcação é criada.", icon: CalendarCheck2 },
  { value: "booking_completed", label: "Marcação concluída", description: "Depois de um serviço concluído.", icon: CalendarCheck2 },
  { value: "booking_cancelled", label: "Marcação cancelada", description: "Quando uma reserva é cancelada.", icon: Bell },
  { value: "client_inactive", label: "Cliente inativo", description: "Quando um cliente deixa de voltar.", icon: UserRound },
  { value: "birthday", label: "Aniversário do cliente", description: "No dia de aniversário do cliente.", icon: Bell },
];
function triggerMeta(value: Trigger) { return TRIGGERS.find((t) => t.value === value) ?? TRIGGERS[0]; }

export default function AutomationsPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("automated_followups");
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<Trigger>("booking_created");
  const [actionType, setActionType] = useState<"email" | "sms">("email");
  const [actionSubject, setActionSubject] = useState("");
  const [actionBody, setActionBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => { if (!allowed) return; setLoading(true); try { const response = await fetch("/api/automations/rules", { cache: "no-store" }); const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar as automações."); setRules(json.rules ?? []); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao carregar automações."); } finally { setLoading(false); } }, [allowed]);
  useEffect(() => { void load(); }, [load]);

  const resetEditor = () => { setEditing(null); setName(""); setTriggerType("booking_created"); setActionType("email"); setActionSubject(""); setActionBody(""); setCreating(false); };
  const openNew = () => { resetEditor(); setCreating(true); };
  const openEdit = (rule: Rule) => { setEditing(rule); setCreating(true); setName(rule.name); setTriggerType(rule.trigger_type); const action = rule.actions[0]; setActionType(action?.type ?? "email"); setActionSubject(action?.subject ?? ""); setActionBody(action?.body ?? ""); };

  const saveRule = async () => {
    if (!name.trim()) return toast.error("Indica um nome para a automação.");
    if (!actionBody.trim()) return toast.error("Define a mensagem da ação.");
    setSaving(true);
    try {
      const payload = { name: name.trim(), triggerType, active: true, conditions: {}, actions: [{ type: actionType, ...(actionType === "email" ? { subject: actionSubject.trim() || "Mensagem da tua barbearia" } : {}), body: actionBody.trim() }] };
      const url = editing ? `/api/automations/rules/${editing.id}` : "/api/automations/rules";
      const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Não foi possível guardar a automação.");
      setRules((current) => editing ? current.map((item) => item.id === editing.id ? json.rule : item) : [json.rule, ...current]);
      toast.success(editing ? "Automação atualizada." : "Automação criada."); resetEditor();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao guardar automação."); } finally { setSaving(false); }
  };
  const toggleRule = async (rule: Rule) => { try { const response = await fetch(`/api/automations/rules/${rule.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !rule.active }) }); const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Não foi possível alterar o estado."); setRules((current) => current.map((item) => item.id === rule.id ? json.rule : item)); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao alterar estado."); } };
  const deleteRule = async (rule: Rule) => { if (!window.confirm(`Eliminar a automação "${rule.name}"?`)) return; try { const response = await fetch(`/api/automations/rules/${rule.id}`, { method: "DELETE" }); const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Não foi possível eliminar."); setRules((current) => current.filter((item) => item.id !== rule.id)); toast.success("Automação eliminada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao eliminar automação."); } };

  if (accessLoading) return <main className="min-h-screen bg-background" />;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Automações</h1><p className="text-muted-foreground">Follow-ups automáticos estão disponíveis no plano Pro e Enterprise.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;
  const activeCount = rules.filter((r) => r.active).length; const configuredCount = rules.filter((r) => r.actions.length > 0).length;

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">AUTOMAÇÕES</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Follow-ups automáticos</h1><p className="mt-2 max-w-2xl text-muted-foreground">Define um gatilho, uma mensagem e o estado da regra. A configuração fica ligada à tua barbearia e ao plano efetivo.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button><Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button></div></header>
    <section className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Regras</p><p className="mt-1 text-2xl font-semibold">{rules.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ativas</p><p className="mt-1 text-2xl font-semibold">{activeCount}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Configuradas</p><p className="mt-1 text-2xl font-semibold">{configuredCount}</p></CardContent></Card></section>
    {(creating || editing) && <Card className="border-primary/20"><CardHeader><div className="flex items-center justify-between"><CardTitle>{editing ? "Editar automação" : "Nova automação"}</CardTitle><Button variant="ghost" onClick={resetEditor}>Fechar</Button></div></CardHeader><CardContent className="grid gap-5 lg:grid-cols-[1fr_1fr]"><div className="space-y-4"><div><label className="text-sm font-medium">Nome interno</label><Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Relembrar cliente após 30 dias" /></div><div><label className="text-sm font-medium">Gatilho</label><div className="mt-2 grid gap-2 sm:grid-cols-2">{TRIGGERS.map((trigger) => <button key={trigger.value} type="button" onClick={() => setTriggerType(trigger.value)} className={`rounded-xl border p-3 text-left ${triggerType === trigger.value ? "border-primary bg-primary/5" : "border-white/10"}`}><p className="text-sm font-medium">{trigger.label}</p><p className="mt-1 text-xs text-muted-foreground">{trigger.description}</p></button>)}</div></div></div><div className="space-y-4"><div><label className="text-sm font-medium">Ação</label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={actionType} onChange={(e) => setActionType(e.target.value as "email" | "sms")}><option value="email">Email</option><option value="sms">SMS</option></select></div>{actionType === "email" && <div><label className="text-sm font-medium">Assunto</label><Input className="mt-1" value={actionSubject} onChange={(e) => setActionSubject(e.target.value)} maxLength={180} placeholder="Mensagem da tua barbearia" /></div>}<div><label className="text-sm font-medium">Mensagem</label><Textarea className="mt-1 min-h-40" value={actionBody} onChange={(e) => setActionBody(e.target.value)} maxLength={8000} placeholder="Olá {{nome}}, sentimos a tua falta..." /></div><div className="rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">Variáveis úteis: <code>{{nome}}</code>, <code>{{barbearia}}</code>, <code>{{booking_url}}</code>.</div><Button onClick={() => void saveRule()} disabled={saving} className="min-h-11 w-full"><Save className="mr-2 h-4 w-4" />{saving ? "A guardar…" : "Guardar automação"}</Button></div></CardContent></Card>}
    {!creating && !editing && <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova automação</Button>}
    <section><div className="mb-4"><h2 className="text-xl font-semibold">Automações existentes</h2><p className="mt-1 text-sm text-muted-foreground">As regras são tenant-scoped e respeitam as permissões da equipa.</p></div>{loading && rules.length === 0 ? <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar…</div> : rules.length ? <div className="grid gap-3 lg:grid-cols-2">{rules.map((rule) => { const meta = triggerMeta(rule.trigger_type); const Icon = meta.icon; const action = rule.actions[0]; return <Card key={rule.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${rule.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-medium">{rule.name}</p><p className="mt-1 text-sm text-muted-foreground">{meta.label} → {action?.type === "sms" ? "SMS" : action ? "Email" : "Sem ação"}</p></div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${rule.active ? "border-emerald-500/20 text-emerald-500" : "border-white/10 text-muted-foreground"}`}>{rule.active ? "Ativa" : "Inativa"}</span></div><p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{action?.body || "Esta regra ainda não tem mensagem configurada."}</p><div className="mt-4 flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => void toggleRule(rule)}>{rule.active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{rule.active ? "Desativar" : "Ativar"}</Button><Button variant="outline" size="sm" onClick={() => openEdit(rule)}>Editar</Button><Button variant="ghost" size="icon" onClick={() => void deleteRule(rule)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>; })}</div> : <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Zap className="h-8 w-8 text-muted-foreground" /><p className="font-medium">Ainda não tens automações</p><p className="text-sm text-muted-foreground">Cria uma regra para começar.</p></CardContent></Card>}</section>
  </div></main>;
}
