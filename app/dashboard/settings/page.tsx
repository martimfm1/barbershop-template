"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Bell, CalendarCheck2, Camera, Check, Clock3, CreditCard, ImageIcon, LogOut, MapPin, Search, Save, Settings, ShieldCheck, Store, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useBarbershop } from "@/context/BarbershopContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { cn } from "@/lib/utils";
import { processAndUploadImage } from "@/lib/utils/upload-image";
import { barbershopService } from "@/app/dashboard/_services/barbershop.service";
import { authService } from "@/app/dashboard/_services/auth.service";
import { SettingsLocationPanel } from "@/components/dashboard/settings-location-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

interface BarbershopConfig {
  name: string;
  phone: string;
  address: string;
  opening_time: string;
  closing_time: string;
  lunch_start?: string;
  lunch_end?: string;
  closed_days: string;
  allow_online_bookings: boolean;
  auto_reminders: boolean;
  is_public_in_directory: boolean;
}

type SettingsSection = "overview" | "business" | "location" | "hours" | "appearance" | "booking" | "billing" | "account";

const sections: { id: SettingsSection; label: string; description: string; icon: typeof Settings }[] = [
  { id: "overview", label: "Visão geral", description: "Estado da configuração", icon: Settings },
  { id: "business", label: "Negócio", description: "Dados públicos", icon: Store },
  { id: "location", label: "Localização", description: "Morada e mapa", icon: MapPin },
  { id: "hours", label: "Horários", description: "Funcionamento", icon: Clock3 },
  { id: "appearance", label: "Aparência", description: "Logótipo e capa", icon: ImageIcon },
  { id: "booking", label: "Marcações", description: "Regras de reserva", icon: CalendarCheck2 },
  { id: "billing", label: "Plano e faturação", description: "Subscrição e faturas", icon: CreditCard },
  { id: "account", label: "Conta e segurança", description: "Sessão e acesso", icon: ShieldCheck },
];

const DAYS_OF_WEEK = [["Monday", "Segunda-feira"], ["Tuesday", "Terça-feira"], ["Wednesday", "Quarta-feira"], ["Thursday", "Quinta-feira"], ["Friday", "Sexta-feira"], ["Saturday", "Sábado"], ["Sunday", "Domingo"]] as const;
const INPUT = "min-h-11 rounded-xl border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40";
const CARD = "border-white/10 bg-black/30 backdrop-blur-md";

function normalize(value: Partial<BarbershopConfig>): BarbershopConfig {
  return { ...value, name: value.name ?? "", phone: value.phone ?? "", address: value.address ?? "", opening_time: value.opening_time ?? "09:00", closing_time: value.closing_time ?? "19:00", lunch_start: value.lunch_start ?? "", lunch_end: value.lunch_end ?? "", closed_days: value.closed_days ?? "None", allow_online_bookings: value.allow_online_bookings ?? true, auto_reminders: false, is_public_in_directory: value.is_public_in_directory ?? true };
}

export default function SettingsPage() {
  const router = useRouter();
  const { barbershopId } = useBarbershop();
  const { hasFeature, loading: planLoading } = useFeatureAccess();
  const canManageDirectoryVisibility = hasFeature("directory_visibility");
  const [activeSection, setActiveSection] = useState<SettingsSection>("overview");
  const [mobileSection, setMobileSection] = useState<SettingsSection>("overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [config, setConfig] = useState<BarbershopConfig>({ name: "", phone: "", address: "", opening_time: "09:00", closing_time: "19:00", lunch_start: "12:30", lunch_end: "13:30", closed_days: "None", allow_online_bookings: true, auto_reminders: false, is_public_in_directory: true });
  const [initialConfig, setInitialConfig] = useState<BarbershopConfig | null>(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [bannerTimestamp, setBannerTimestamp] = useState(Date.now());
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = barbershopId && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/avatar/${barbershopId}/avatar.webp?t=${avatarTimestamp}` : null;
  const bannerUrl = barbershopId && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/banner/${barbershopId}/banner.webp?t=${bannerTimestamp}` : null;

  const fetchSettings = useCallback(async () => {
    if (!barbershopId) return;
    setLoading(true);
    const result = await barbershopService.getConfig(barbershopId);
    if (result.error) toast.error(result.error.message || "Não foi possível carregar as definições.");
    else if (result.data) { const next = normalize(result.data); setConfig(next); setInitialConfig(next); }
    setLoading(false);
  }, [barbershopId]);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(initialConfig), [config, initialConfig]);
  const completion = useMemo(() => { const checks = [Boolean(config.name.trim()), Boolean(config.phone.trim()), Boolean(config.address.trim()), Boolean(config.opening_time && config.closing_time), config.allow_online_bookings]; return Math.round((checks.filter(Boolean).length / checks.length) * 100); }, [config]);
  const filteredSections = useMemo(() => { const term = search.trim().toLocaleLowerCase("pt-PT"); return !term ? sections : sections.filter((section) => `${section.label} ${section.description}`.toLocaleLowerCase("pt-PT").includes(term)); }, [search]);
  const currentClosedDays = useMemo(() => config.closed_days === "None" ? [] : config.closed_days.split(",").map((day) => day.trim()), [config.closed_days]);

  function toggleClosedDay(day: string) { setConfig((current) => { const next = currentClosedDays.includes(day) ? currentClosedDays.filter((item) => item !== day) : [...currentClosedDays, day]; return { ...current, closed_days: next.length ? next.join(",") : "None" }; }); }

  async function saveSettings() {
    if (!barbershopId || !dirty) return;
    if (!config.name.trim() || !config.phone.trim() || !config.address.trim()) { toast.error("Complete o nome, telefone e morada antes de guardar."); setActiveSection(!config.name.trim() || !config.phone.trim() ? "business" : "location"); return; }
    if (config.opening_time >= config.closing_time) { toast.error("O horário de fecho tem de ser posterior ao horário de abertura."); setActiveSection("hours"); return; }
    setSaving(true);
    const payload: Partial<BarbershopConfig> = { ...config, auto_reminders: false };
    if (!canManageDirectoryVisibility) delete payload.is_public_in_directory;
    const result = await barbershopService.updateConfig(barbershopId, payload);
    setSaving(false);
    if (result.error) return toast.error(result.error.message || "Não foi possível guardar as alterações.");
    const next = normalize(result.data ?? config); setConfig(next); setInitialConfig(next); toast.success("Alterações guardadas.");
  }

  function cancelChanges() { if (!initialConfig) return; setConfig(initialConfig); toast.message("As alterações foram descartadas."); }
  async function uploadImage(type: "avatar" | "banner", file: File) { if (!barbershopId) return; setUploading(type); const { error } = await processAndUploadImage({ file, bucket: type, path: `${barbershopId}/${type}.webp`, maxWidth: type === "avatar" ? 400 : 1200, quality: 0.85 }); setUploading(null); if (error) return toast.error("Não foi possível atualizar a imagem."); if (type === "avatar") setAvatarTimestamp(Date.now()); else setBannerTimestamp(Date.now()); toast.success(type === "avatar" ? "Logótipo atualizado." : "Capa atualizada."); }
  async function logout() { setLogoutLoading(true); try { await authService.logout(); router.replace("/login"); router.refresh(); } catch { toast.error("Não foi possível terminar a sessão."); setLogoutLoading(false); } }
  function selectSection(id: SettingsSection) { setActiveSection(id); setMobileSection(id); document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }

  if (loading || planLoading) return <div className="flex min-h-[70vh] items-center justify-center"><Spinner className="size-7 text-zinc-300" /></div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mb-2 lg:border-0 lg:bg-transparent lg:px-0 lg:py-6 lg:backdrop-blur-none">
          <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Link href="/dashboard" aria-label="Voltar ao painel" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><ArrowLeft className="size-4" /></Link><div className="min-w-0"><p className="text-xs font-medium text-zinc-500">Painel</p><h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">Definições</h1></div></div><div className="hidden items-center gap-2 sm:flex">{dirty && <Button type="button" variant="ghost" onClick={cancelChanges} className="min-h-10 text-zinc-400 hover:text-zinc-100">Descartar</Button>}<Button type="button" onClick={() => void saveSettings()} disabled={!dirty || saving} className="min-h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white">{saving ? <Spinner className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}{saving ? "A guardar…" : dirty ? "Guardar alterações" : "Tudo guardado"}</Button></div></div>
          {dirty && <div className="mt-3 flex items-center gap-2 text-xs text-amber-300"><span className="size-1.5 rounded-full bg-amber-300" />Tem alterações por guardar.</div>}
        </header>

        <div className="mt-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block"><div className="sticky top-6 space-y-3"><div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2"><div className="mb-2 px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">Organização</div>{filteredSections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" onClick={() => selectSection(section.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400", activeSection === section.id ? "bg-white/8 text-zinc-100" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300")}><span className={cn("flex size-8 items-center justify-center rounded-lg", activeSection === section.id ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.03] text-zinc-600")}><Icon className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-medium">{section.label}</span><span className="block truncate text-[11px] text-zinc-600">{section.description}</span></span></button>; })}</div><div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"><p className="text-xs font-semibold text-emerald-300">Configuração da barbearia</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs text-zinc-500">{completion}% concluído</p></div></div></aside>

          <div className="min-w-0">
            <div className="mb-4 flex gap-2 lg:hidden"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar definições" className={`${INPUT} pl-9`} /></div><select aria-label="Secção das definições" value={mobileSection} onChange={(e) => selectSection(e.target.value as SettingsSection)} className="min-h-11 max-w-[46%] rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200"><option value="overview">Visão geral</option>{sections.filter((s) => s.id !== "overview").map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:hidden"><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-zinc-500">Estado da configuração</p><p className="mt-1 text-lg font-semibold">{completion}% concluído</p></div><div className="size-12 rounded-full border-4 border-emerald-400/20 border-t-emerald-400" aria-hidden="true" /></div></div>

            <section id="settings-overview" className="scroll-mt-24"><Card className={cn(CARD, "overflow-hidden")}><div className="grid lg:grid-cols-[1.15fr_.85fr]"><div className="p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Visão geral</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Tenha o essencial sempre pronto.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Encontre rapidamente uma definição, perceba o impacto da alteração e continue o trabalho sem perder contexto.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{sections.filter((section) => section.id !== "overview").slice(0, 4).map((section) => { const Icon = section.icon; return <button key={section.id} type="button" onClick={() => selectSection(section.id)} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-300"><Icon className="size-4" /></span><span><span className="block text-sm font-medium text-zinc-100">{section.label}</span><span className="mt-0.5 block text-xs text-zinc-600">{section.description}</span></span></button>; })}</div></div><div className="border-t border-white/10 bg-white/[0.02] p-5 sm:p-7 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">Atalhos úteis</p><div className="mt-4 space-y-2"><Link href="/dashboard/billing" className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-white/[0.04]"><span className="flex items-center gap-3"><CreditCard className="size-4 text-zinc-400" /><span className="text-sm">Gerir plano</span></span><ArrowUpRight className="size-4 text-zinc-600" /></Link><Link href="/dashboard/mensagens" className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-white/[0.04]"><span className="flex items-center gap-3"><Bell className="size-4 text-zinc-400" /><span className="text-sm">Mensagens</span></span><ArrowUpRight className="size-4 text-zinc-600" /></Link></div></div></div></Card></section>

            <section id="settings-business" className="scroll-mt-24 mt-6"><Card className={CARD}><CardHeader><CardTitle className="flex items-center gap-2"><Store className="size-4 text-emerald-400" /> Negócio</CardTitle><CardDescription>As informações que os clientes veem quando encontram a sua barbearia.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="settings-name" className="text-sm font-medium">Nome da barbearia</label><Input id="settings-name" value={config.name} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} className={INPUT} placeholder="Ex.: Barbearia Central" /></div><div className="grid gap-2"><label htmlFor="settings-phone" className="text-sm font-medium">Telefone oficial</label><Input id="settings-phone" type="tel" autoComplete="tel" value={config.phone} onChange={(e) => setConfig((c) => ({ ...c, phone: e.target.value }))} className={INPUT} placeholder="+351 9xx xxx xxx" /></div></CardContent></Card></section>

            <section id="settings-location" className="scroll-mt-24 mt-6"><SettingsLocationPanel barbershopId={barbershopId!} /></section>

            <section id="settings-hours" className="scroll-mt-24 mt-6"><Card className={CARD}><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-blue-400" /> Horários</CardTitle><CardDescription>Defina o horário de funcionamento e os dias em que a barbearia está encerrada.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="settings-open" className="text-sm font-medium">Abertura</label><Input id="settings-open" type="time" value={config.opening_time} onChange={(e) => setConfig((c) => ({ ...c, opening_time: e.target.value }))} className={INPUT} /></div><div className="grid gap-2"><label htmlFor="settings-close" className="text-sm font-medium">Fecho</label><Input id="settings-close" type="time" value={config.closing_time} onChange={(e) => setConfig((c) => ({ ...c, closing_time: e.target.value }))} className={INPUT} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="settings-lunch-start" className="text-sm font-medium">Início da pausa <span className="font-normal text-zinc-600">(opcional)</span></label><Input id="settings-lunch-start" type="time" value={config.lunch_start ?? ""} onChange={(e) => setConfig((c) => ({ ...c, lunch_start: e.target.value }))} className={INPUT} /></div><div className="grid gap-2"><label htmlFor="settings-lunch-end" className="text-sm font-medium">Fim da pausa <span className="font-normal text-zinc-600">(opcional)</span></label><Input id="settings-lunch-end" type="time" value={config.lunch_end ?? ""} onChange={(e) => setConfig((c) => ({ ...c, lunch_end: e.target.value }))} className={INPUT} /></div></div><div><p className="text-sm font-medium">Dias de encerramento</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{DAYS_OF_WEEK.map(([value, label]) => { const active = currentClosedDays.includes(value); return <button key={value} type="button" onClick={() => toggleClosedDay(value)} className={cn("flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400", active ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200" : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]")}>{label}<span className={cn("flex size-5 items-center justify-center rounded-full border", active ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-white/15")}>{active ? <Check className="size-3" /> : null}</span></button>; })}</div></div></CardContent></Card></section>

            <section id="settings-appearance" className="scroll-mt-24 mt-6"><Card className={CARD}><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="size-4 text-amber-400" /> Aparência</CardTitle><CardDescription>Defina a identidade visual apresentada aos clientes.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"><div className="relative h-40 sm:h-52">{bannerUrl ? <Image src={bannerUrl} alt="Capa da barbearia" fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-sm text-zinc-600">Sem capa definida</div>}<div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3"><div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-950 bg-zinc-800 shadow-xl">{avatarUrl ? <Image src={avatarUrl} alt="Logótipo da barbearia" width={128} height={128} className="h-full w-full object-cover" unoptimized /> : <UserCircle2 className="size-8 text-zinc-600" />}</div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => bannerInputRef.current?.click()} disabled={uploading === "banner"} className="min-h-10 rounded-xl bg-zinc-950/80 text-zinc-100">{uploading === "banner" ? <Spinner className="mr-2 size-4" /> : <ImageIcon className="mr-2 size-4" />}Capa</Button><Button type="button" variant="secondary" onClick={() => avatarInputRef.current?.click()} disabled={uploading === "avatar"} className="min-h-10 rounded-xl bg-zinc-950/80 text-zinc-100">{uploading === "avatar" ? <Spinner className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}Logótipo</Button></div></div></div></div><input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage("avatar", file); e.currentTarget.value = ""; }} /><input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage("banner", file); e.currentTarget.value = ""; }} /></CardContent></Card></section>

            <section id="settings-booking" className="scroll-mt-24 mt-6"><Card className={CARD}><CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck2 className="size-4 text-violet-400" /> Marcações</CardTitle><CardDescription>Escolha como os clientes podem interagir com a sua agenda.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="min-w-0"><p className="text-sm font-medium">Permitir marcações online</p><p className="mt-1 text-xs leading-5 text-zinc-600">Quando ativo, os clientes podem marcar através da página pública.</p></div><Switch checked={config.allow_online_bookings} onCheckedChange={(checked) => setConfig((c) => ({ ...c, allow_online_bookings: checked }))} /></div><div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="min-w-0"><p className="text-sm font-medium">Aparecer no diretório</p><p className="mt-1 text-xs leading-5 text-zinc-600">Disponível apenas nos planos compatíveis.</p></div><Switch disabled={!canManageDirectoryVisibility} checked={canManageDirectoryVisibility && config.is_public_in_directory} onCheckedChange={(checked) => canManageDirectoryVisibility && setConfig((c) => ({ ...c, is_public_in_directory: checked }))} /></div></CardContent></Card></section>

            <section id="settings-billing" className="scroll-mt-24 mt-6"><Card className="border-emerald-500/20 bg-emerald-500/[0.04]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Plano e faturação</p><h2 className="mt-1 text-lg font-semibold">Gerir subscrição, faturas e limites.</h2><p className="mt-1 text-sm text-zinc-500">Veja o plano atual e altere-o quando precisar.</p></div><Button asChild className="min-h-11 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400"><Link href="/dashboard/billing">Abrir faturação<ArrowUpRight className="ml-2 size-4" /></Link></Button></CardContent></Card></section>

            <section id="settings-account" className="scroll-mt-24 mt-6"><Card className={CARD}><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /> Conta e segurança</CardTitle><CardDescription>Gestão da sessão e acesso à conta.</CardDescription></CardHeader><CardContent><Button type="button" variant="outline" onClick={() => void logout()} disabled={logoutLoading} className="min-h-11 rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"><LogOut className="mr-2 size-4" />{logoutLoading ? "A terminar sessão…" : "Terminar sessão"}</Button></CardContent></Card></section>
          </div>
        </div>

        {dirty && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl sm:hidden"><div className="mx-auto flex max-w-xl items-center gap-2"><Button type="button" variant="ghost" onClick={cancelChanges} className="min-h-11 flex-1 text-zinc-400">Descartar</Button><Button type="button" onClick={() => void saveSettings()} disabled={saving} className="min-h-11 flex-[1.4] rounded-xl bg-zinc-50 text-zinc-950">{saving ? <Spinner className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}Guardar</Button></div></div>}
      </div>
    </main>
  );
}
