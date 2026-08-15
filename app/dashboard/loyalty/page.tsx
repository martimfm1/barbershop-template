"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Gift, Loader2, Lock, Pencil, Plus, RefreshCw, Save, Sparkles, Star, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

type LoyaltySettings = { enabled: boolean; points_per_euro: number; welcome_points: number; referral_points: number };
type Reward = { id: string; name: string; description: string | null; points_cost: number; reward_type: "discount" | "free_service" | "custom"; reward_value: number | null; active: boolean };
const emptyReward = { name: "", description: "", points_cost: "100", reward_type: "discount", reward_value: "" };

export default function LoyaltyPage() {
  const { hasFeature, loading: accessLoading } = useFeatureAccess();
  const allowed = hasFeature("loyalty");
  const [settings, setSettings] = useState<LoyaltySettings>({ enabled: true, points_per_euro: 1, welcome_points: 0, referral_points: 0 });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState(emptyReward);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try { const response = await fetch("/api/loyalty", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar a fidelização."); setSettings({ enabled: data.settings?.enabled !== false, points_per_euro: Number(data.settings?.points_per_euro ?? 1), welcome_points: Number(data.settings?.welcome_points ?? 0), referral_points: Number(data.settings?.referral_points ?? 0) }); setRewards(data.rewards ?? []); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao carregar fidelização."); }
    finally { setLoading(false); }
  }, [allowed]);
  useEffect(() => { void load(); }, [load]);

  const saveSettings = async () => {
    setSaving(true); try { const response = await fetch("/api/loyalty", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível guardar."); setSettings({ enabled: data.settings.enabled, points_per_euro: Number(data.settings.points_per_euro), welcome_points: Number(data.settings.welcome_points), referral_points: Number(data.settings.referral_points) }); toast.success("Fidelização atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao guardar."); } finally { setSaving(false); }
  };

  const saveReward = async () => {
    setSaving(true);
    try {
      const payload = { id: editing ?? undefined, ...rewardForm, points_cost: Number(rewardForm.points_cost), reward_value: rewardForm.reward_value === "" ? null : Number(rewardForm.reward_value), active: true };
      const response = await fetch("/api/loyalty/rewards", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível guardar a recompensa.");
      setRewards((current) => editing ? current.map((item) => item.id === editing ? { ...item, ...data.reward } : item) : [data.reward, ...current]);
      setEditing(null); setCreating(false); setRewardForm(emptyReward); toast.success(editing ? "Recompensa atualizada." : "Recompensa criada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao guardar recompensa."); } finally { setSaving(false); }
  };

  const editReward = (reward: Reward) => { setEditing(reward.id); setCreating(true); setRewardForm({ name: reward.name, description: reward.description ?? "", points_cost: String(reward.points_cost), reward_type: reward.reward_type, reward_value: reward.reward_value === null ? "" : String(reward.reward_value) }); };
  const deleteReward = async (id: string) => { if (!window.confirm("Eliminar esta recompensa?")) return; try { const response = await fetch(`/api/loyalty/rewards?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível eliminar."); setRewards((current) => current.filter((item) => item.id !== id)); toast.success("Recompensa eliminada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao eliminar recompensa."); } };

  if (accessLoading) return <main className="min-h-screen bg-background" />;
  if (!allowed) return <main className="min-h-screen bg-background px-4 py-24"><div className="mx-auto max-w-xl"><Card><CardContent className="flex flex-col items-center gap-5 py-16 text-center"><Lock className="h-8 w-8 text-primary" /><h1 className="text-2xl font-semibold">Programa de fidelização</h1><p className="text-muted-foreground">Cria pontos e recompensas para incentivar os clientes a voltar.</p><Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button></CardContent></Card></div></main>;

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">FIDELIZAÇÃO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Pontos e recompensas</h1><p className="mt-2 max-w-2xl text-muted-foreground">Configura como os clientes acumulam pontos e o que podem resgatar. As alterações são aplicadas à barbearia inteira.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button><Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button></div></header>

    <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Regras do programa</CardTitle></CardHeader><CardContent className="space-y-5"><label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><span><span className="block font-medium">Programa ativo</span><span className="mt-1 block text-xs text-muted-foreground">Ativa ou pausa a acumulação e resgates.</span></span><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={settings.enabled} onChange={(e) => setSettings((value) => ({ ...value, enabled: e.target.checked }))} /></label><div className="grid gap-4 sm:grid-cols-3"><div><Label>€1 gasto = pontos</Label><Input className="mt-1" type="number" min="0.01" max="100" step="0.01" value={settings.points_per_euro} onChange={(e) => setSettings((value) => ({ ...value, points_per_euro: Number(e.target.value) }))} /></div><div><Label>Pontos de boas-vindas</Label><Input className="mt-1" type="number" min="0" max="100000" value={settings.welcome_points} onChange={(e) => setSettings((value) => ({ ...value, welcome_points: Number(e.target.value) }))} /></div><div><Label>Pontos de referência</Label><Input className="mt-1" type="number" min="0" max="100000" value={settings.referral_points} onChange={(e) => setSettings((value) => ({ ...value, referral_points: Number(e.target.value) }))} /></div></div><Button onClick={() => void saveSettings()} disabled={saving} className="min-h-11"><Save className="mr-2 h-4 w-4" />{saving ? "A guardar…" : "Guardar regras"}</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Resumo</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Conversão</p><p className="mt-1 text-2xl font-semibold">€1 = {settings.points_per_euro} pts</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Recompensas ativas</p><p className="mt-1 text-2xl font-semibold">{rewards.filter((r) => r.active).length}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Exemplo</p><p className="mt-1 font-medium">€25 → {25 * settings.points_per_euro} pontos</p></div></CardContent></Card></section>

    <section><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">Recompensas</h2><p className="mt-1 text-sm text-muted-foreground">Mantém as recompensas simples, claras e fáceis de resgatar.</p></div><Button onClick={() => { setCreating(true); setEditing(null); setRewardForm(emptyReward); }}><Plus className="mr-2 h-4 w-4" />Nova recompensa</Button></div>{creating && <Card className="mb-4"><CardHeader><CardTitle>{editing ? "Editar recompensa" : "Nova recompensa"}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><Label>Nome</Label><Input className="mt-1" value={rewardForm.name} onChange={(e) => setRewardForm((v) => ({ ...v, name: e.target.value }))} maxLength={120} placeholder="Ex.: Corte gratuito" /></div><div><Label>Pontos necessários</Label><Input className="mt-1" type="number" min="1" value={rewardForm.points_cost} onChange={(e) => setRewardForm((v) => ({ ...v, points_cost: e.target.value }))} /></div><div className="sm:col-span-2"><Label>Descrição</Label><Textarea className="mt-1" value={rewardForm.description} onChange={(e) => setRewardForm((v) => ({ ...v, description: e.target.value }))} maxLength={1000} placeholder="O cliente vê esta explicação ao resgatar." /></div><div><Label>Tipo</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={rewardForm.reward_type} onChange={(e) => setRewardForm((v) => ({ ...v, reward_type: e.target.value }))}><option value="discount">Desconto</option><option value="free_service">Serviço gratuito</option><option value="custom">Personalizada</option></select></div><div><Label>Valor (opcional)</Label><Input className="mt-1" type="number" min="0" step="0.01" value={rewardForm.reward_value} onChange={(e) => setRewardForm((v) => ({ ...v, reward_value: e.target.value }))} placeholder="Ex.: 5" /></div><div className="flex gap-2 sm:col-span-2"><Button onClick={() => void saveReward()} disabled={saving || !rewardForm.name.trim()}><Save className="mr-2 h-4 w-4" />Guardar</Button><Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button></div></CardContent></Card>}
      {loading && rewards.length === 0 ? <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar…</div> : rewards.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rewards.map((reward) => <Card key={reward.id} className={reward.active ? "" : "opacity-60"}><CardContent className="flex h-full flex-col p-5"><div className="flex items-start justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gift className="h-5 w-5" /></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{reward.points_cost} pts</span></div><h3 className="mt-5 font-semibold">{reward.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{reward.description || "Recompensa de fidelização"}</p><p className="mt-4 text-xs text-muted-foreground">{reward.reward_type}{reward.reward_value !== null ? ` · ${reward.reward_value}` : ""}</p><div className="mt-4 flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => editReward(reward)} aria-label="Editar recompensa"><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => void deleteReward(reward.id)} aria-label="Eliminar recompensa"><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div> : <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Gift className="h-8 w-8 text-muted-foreground" /><p className="font-medium">Ainda não existem recompensas</p><p className="text-sm text-muted-foreground">Cria a primeira recompensa para começar.</p></CardContent></Card>}</section>
  </div></main>;
}
