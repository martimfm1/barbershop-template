"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useBarbershop } from "@/context/BarbershopContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { processAndUploadImage } from "@/lib/utils/upload-image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { barbershopService } from "@/app/dashboard/_services/barbershop.service";
import { authService } from "@/app/dashboard/_services/auth.service";
import {
  Settings, ArrowLeft, Store, Clock, CalendarOff, Globe, Save, LogOut,
  ImageIcon, UserCircle2, UtensilsCrossed, Camera, Upload, CreditCard,
  ArrowUpRight, LockKeyhole, Crown,
} from "lucide-react";

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

const DAYS_OF_WEEK = [
  { eng: "Monday", pt: "Segunda" }, { eng: "Tuesday", pt: "Terça" },
  { eng: "Wednesday", pt: "Quarta" }, { eng: "Thursday", pt: "Quinta" },
  { eng: "Friday", pt: "Sexta" }, { eng: "Saturday", pt: "Sábado" },
  { eng: "Sunday", pt: "Domingo" },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

export default function SettingsPage() {
  const router = useRouter();
  const { barbershopId } = useBarbershop();
  const { hasFeature, loading: planLoading } = useFeatureAccess();
  const canManageDirectoryVisibility = hasFeature("directory_visibility");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [bannerTimestamp, setBannerTimestamp] = useState(Date.now());
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [barbershopConfig, setBarbershopConfig] = useState<BarbershopConfig>({
    name: "", phone: "", address: "", opening_time: "09:00", closing_time: "19:00",
    lunch_start: "12:30", lunch_end: "13:30", closed_days: "None",
    allow_online_bookings: true, auto_reminders: false, is_public_in_directory: true,
  });

  const avatarUrl = useMemo(() => {
    if (!SUPABASE_URL || !barbershopId) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/avatar/${barbershopId}/avatar.webp?t=${avatarTimestamp}`;
  }, [barbershopId, avatarTimestamp]);
  const bannerUrl = useMemo(() => {
    if (!SUPABASE_URL || !barbershopId) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/banner/${barbershopId}/banner.webp?t=${bannerTimestamp}`;
  }, [barbershopId, bannerTimestamp]);

  const fetchSettings = useCallback(async () => {
    if (!barbershopId) return;
    try {
      setLoading(true);
      const res = await barbershopService.getConfig(barbershopId);
      if (res.error) throw res.error;
      if (res.data) {
        setBarbershopConfig({
          name: res.data.name ?? "", phone: res.data.phone ?? "", address: res.data.address ?? "",
          opening_time: res.data.opening_time ?? "09:00", closing_time: res.data.closing_time ?? "19:00",
          lunch_start: res.data.lunch_start ?? "", lunch_end: res.data.lunch_end ?? "",
          closed_days: res.data.closed_days ?? "None", allow_online_bookings: res.data.allow_online_bookings ?? true,
          auto_reminders: false, is_public_in_directory: res.data.is_public_in_directory ?? true,
        });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar as configurações do negócio.");
    } finally { setLoading(false); }
  }, [barbershopId]);

  useEffect(() => { if (barbershopId) void fetchSettings(); }, [barbershopId, fetchSettings]);

  const currentClosedDays = useMemo(() => {
    if (!barbershopConfig.closed_days || barbershopConfig.closed_days === "None") return [];
    return barbershopConfig.closed_days.split(",").map((d) => d.trim());
  }, [barbershopConfig.closed_days]);

  const toggleClosedDay = (dayEng: string) => {
    const updatedDays = currentClosedDays.includes(dayEng)
      ? currentClosedDays.filter((d) => d !== dayEng)
      : [...currentClosedDays, dayEng];
    setBarbershopConfig((prev) => ({ ...prev, closed_days: updatedDays.length ? updatedDays.join(",") : "None" }));
  };

  const handleImageUpload = async (file: File, type: "avatar" | "banner") => {
    if (!barbershopId) { toast.error("ID da barbearia não encontrado."); return; }
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setUploading(true);
    try {
      const { error } = await processAndUploadImage({ file, bucket: type, path: `${barbershopId}/${type}.webp`, maxWidth: type === "avatar" ? 400 : 1200, quality: 0.85 });
      if (error) throw error;
      if (type === "avatar") { setAvatarError(false); setAvatarTimestamp(Date.now()); }
      else { setBannerError(false); setBannerTimestamp(Date.now()); }
      toast.success(`${type === "avatar" ? "Logótipo" : "Banner"} atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro de upload:", error);
      toast.error("Erro ao carregar imagem. Verifica o formato e as permissões do Supabase.");
    } finally { setUploading(false); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershopId) return;
    if (!barbershopConfig.phone?.trim()) { toast.error("O telefone oficial é obrigatório."); return; }
    if (!barbershopConfig.address?.trim()) { toast.error("A rua/morada é obrigatória."); return; }
    try {
      setSubmitting(true);
      const payload: Partial<BarbershopConfig> = { ...barbershopConfig, auto_reminders: false };
      if (!canManageDirectoryVisibility) delete payload.is_public_in_directory;
      const response = await barbershopService.updateConfig(barbershopId, payload);
      if (response.error) throw response.error;
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao gravar alterações.");
    } finally { setSubmitting(false); }
  };

  const handleLogout = async () => {
    try {
      setSubmitting(true); await authService.logout(); toast.success("Sessão terminada.");
      router.push("/login"); router.refresh();
    } catch (error) { console.error("Erro de logout:", error); toast.error("Erro ao efetuar logout."); setSubmitting(false); }
  };

  if (loading || planLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><Spinner className="size-8" /></div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-6 relative z-10">
      <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageUpload(file, "avatar"); e.target.value = ""; }} />
      <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageUpload(file, "banner"); e.target.value = ""; }} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Settings className="text-zinc-400 size-8" /> Definições</h1>
        <Link href="/dashboard"><Button variant="ghost" className="bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10 text-xs"><ArrowLeft className="size-4 mr-2" /> Voltar ao Dashboard</Button></Link>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-md">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><CreditCard className="size-5" /></div><div><h2 className="font-semibold text-zinc-100">Plano e faturação</h2><p className="mt-1 text-xs leading-5 text-zinc-400">Consulta o teu plano, compara funcionalidades e gere a subscrição.</p></div></div>
          <Button asChild className="shrink-0 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"><Link href="/dashboard/billing">Gerir plano <ArrowUpRight className="ml-2 size-4" /></Link></Button>
        </CardContent>
      </Card>

      <form onSubmit={handleSaveSettings} className="grid gap-6 md:grid-cols-2">
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-zinc-100"><Store className="size-4 text-emerald-400" /> Detalhes públicos</CardTitle><CardDescription className="text-zinc-400 text-xs">Informações visíveis na página de agendamento.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Nome da barbearia</label><input required className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50" value={barbershopConfig.name} onChange={(e) => setBarbershopConfig((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Telefone oficial</label><input type="tel" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50" value={barbershopConfig.phone} onChange={(e) => setBarbershopConfig((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Morada</label><input className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50" value={barbershopConfig.address} onChange={(e) => setBarbershopConfig((p) => ({ ...p, address: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-md"><CardHeader><CardTitle className="flex items-center gap-2 text-lg text-zinc-100"><ImageIcon className="size-4 text-amber-400" /> Identidade visual</CardTitle><CardDescription className="text-zinc-400 text-xs">Personaliza o logótipo e a capa da tua barbearia.</CardDescription></CardHeader><CardContent className="space-y-5">
          <div className="relative w-full h-36 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden group">
            {bannerUrl && !bannerError ? <Image src={bannerUrl} alt="Banner da barbearia" width={1200} height={400} unoptimized className="w-full h-full object-cover" onError={() => setBannerError(true)} /> : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Sem imagem de capa</div>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button type="button" variant="secondary" size="sm" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()} className="bg-zinc-900/90 text-white text-xs gap-2 border border-white/20">{uploadingCover ? <Spinner className="size-3.5" /> : <Upload className="size-3.5" />} {uploadingCover ? "A enviar..." : "Alterar capa"}</Button></div>
            <div className="absolute bottom-2 left-3 size-16 rounded-xl border-2 border-zinc-950 bg-zinc-900 overflow-hidden shadow-lg group/avatar">{avatarUrl && !avatarError ? <Image src={avatarUrl} alt="Logo da barbearia" width={160} height={160} unoptimized className="w-full h-full object-cover" onError={() => setAvatarError(true)} /> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><UserCircle2 className="size-8" /></div>}<button type="button" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white" aria-label="Alterar logótipo">{uploadingAvatar ? <Spinner className="size-4" /> : <Camera className="size-4" />}</button></div>
          </div>
          <div className="flex gap-3"><Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()} className="flex-1 bg-white/5 border-white/10 text-zinc-200 text-xs h-9">{uploadingAvatar ? <Spinner className="mr-2 size-3.5" /> : <Camera className="mr-2 size-3.5 text-amber-400" />} Upload logótipo</Button><Button type="button" variant="outline" size="sm" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()} className="flex-1 bg-white/5 border-white/10 text-zinc-200 text-xs h-9">{uploadingCover ? <Spinner className="mr-2 size-3.5" /> : <ImageIcon className="mr-2 size-3.5 text-amber-400" />} Upload capa</Button></div>
        </CardContent></Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-md md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-lg text-zinc-100"><Clock className="size-4 text-blue-400" /> Horário e agendamento</CardTitle><CardDescription className="text-zinc-400 text-xs">Define o horário de funcionamento, pausa e dias de encerramento.</CardDescription></CardHeader><CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Abertura</label><input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark" value={barbershopConfig.opening_time} onChange={(e) => setBarbershopConfig((p) => ({ ...p, opening_time: e.target.value }))} /></div><div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Fecho</label><input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark" value={barbershopConfig.closing_time} onChange={(e) => setBarbershopConfig((p) => ({ ...p, closing_time: e.target.value }))} /></div></div>
          <div className="p-4 bg-white/2 border border-white/5 rounded-xl space-y-3"><div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider"><UtensilsCrossed className="size-4" /> Pausa para almoço</div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Início</label><input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark" value={barbershopConfig.lunch_start ?? ""} onChange={(e) => setBarbershopConfig((p) => ({ ...p, lunch_start: e.target.value }))} /></div><div className="grid gap-2"><label className="text-xs text-zinc-400 font-medium">Fim</label><input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark" value={barbershopConfig.lunch_end ?? ""} onChange={(e) => setBarbershopConfig((p) => ({ ...p, lunch_end: e.target.value }))} /></div></div><p className="text-[11px] text-zinc-500">Os horários dentro deste intervalo ficam indisponíveis para marcações online.</p></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium"><CalendarOff className="size-3.5 text-red-400" /> Dias de folga</label><div className="flex flex-wrap gap-1.5">{DAYS_OF_WEEK.map((day) => { const closed = currentClosedDays.includes(day.eng); return <button key={day.eng} type="button" onClick={() => toggleClosedDay(day.eng)} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex-1 min-w-[72px]", closed ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:bg-zinc-800")}>{day.pt}</button>; })}</div><p className="text-[11px] text-zinc-500">Atualmente: <span className="text-zinc-400 font-medium">{barbershopConfig.closed_days === "None" ? "Aberto todos os dias" : barbershopConfig.closed_days}</span></p></div>
        </CardContent></Card>

        <Card className="bg-black/40 border-white/10 md:col-span-2 backdrop-blur-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-zinc-100"><Globe className="size-4 text-purple-400" /> Online Platform &amp; Automation</CardTitle><CardDescription className="text-zinc-400 text-xs">Controla como a tua barbearia aparece e recebe clientes online.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl"><div><p className="font-semibold text-zinc-100 text-sm">Aceitar marcações online</p><p className="text-xs text-zinc-400 mt-0.5">Permite que clientes façam marcações autonomamente na página pública.</p></div><Switch className="cursor-pointer" checked={barbershopConfig.allow_online_bookings} onCheckedChange={(v) => setBarbershopConfig((p) => ({ ...p, allow_online_bookings: v }))} /></div>

            <div className={cn("relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all", canManageDirectoryVisibility ? "border-purple-500/20 bg-purple-500/[0.04]" : "border-white/10 bg-white/[0.02]")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", canManageDirectoryVisibility ? "border-purple-500/20 bg-purple-500/10 text-purple-400" : "border-white/10 bg-white/5 text-zinc-500")}><Globe className="size-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-sm text-zinc-100">Visibilidade no diretório</p><span className="inline-flex items-center gap-1 rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300"><Crown className="size-3" /> Pro</span></div><p className="mt-1 text-xs leading-5 text-zinc-400">Escolhe se a tua barbearia aparece no diretório público <span className="text-zinc-300">/barbearias</span>. A página pública directa continua disponível.</p></div></div>
                <div className="flex shrink-0 items-center gap-3"><span className={cn("text-xs font-medium", canManageDirectoryVisibility ? (barbershopConfig.is_public_in_directory ? "text-emerald-400" : "text-zinc-500") : "text-zinc-600")}>{canManageDirectoryVisibility ? (barbershopConfig.is_public_in_directory ? "Visível" : "Oculta") : "Bloqueado"}</span><Switch disabled={!canManageDirectoryVisibility} className="cursor-pointer" checked={barbershopConfig.is_public_in_directory} onCheckedChange={(v) => setBarbershopConfig((p) => ({ ...p, is_public_in_directory: v }))} aria-label={canManageDirectoryVisibility ? "Alterar visibilidade no diretório" : "Visibilidade no diretório disponível no plano Pro"} /></div>
              </div>
              {!canManageDirectoryVisibility && <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-xs text-zinc-400"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-zinc-500" /><span>Esta funcionalidade está incluída no <Link href="/dashboard/billing" className="font-semibold text-purple-300 hover:text-purple-200">plano Pro</Link>. Faz upgrade para controlar a presença da tua barbearia no diretório.</span></div>}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end"><Button type="submit" disabled={submitting || uploadingAvatar || uploadingCover} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 h-10">{submitting ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />} Guardar alterações</Button></div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 pt-2"><div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="space-y-0.5"><h3 className="text-sm font-semibold text-red-400 flex items-center gap-2"><LogOut className="size-4" /> Terminar sessão</h3><p className="text-xs text-zinc-400 max-w-xl">Desconecta o painel administrativo. Será necessário iniciar sessão novamente.</p></div><Button type="button" onClick={handleLogout} disabled={submitting} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-4 h-9">Sair da conta</Button></div></div>
      </form>
    </main>
  );
}
