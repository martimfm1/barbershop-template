"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, Megaphone, Settings, Sparkles, Heart, CreditCard, LayoutDashboard, CalendarDays, Users, Scissors, Briefcase, MessageCircle, Menu, X, Lock, QrCode, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { FeatureKey } from "@/lib/billing/plan-features";
import { BarberIcon } from "@/components/BarberIcon";
import { useBarbershop } from "@/context/BarbershopContext";

interface SidebarItem { href: string; label: string; icon: LucideIcon; feature?: FeatureKey }

const items: SidebarItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/qr-code", label: "Codigo QR", icon: QrCode },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/equipa", label: "Equipa", icon: Briefcase, feature: "team_management" },
  { href: "/dashboard/mensagens", label: "Mensagens", icon: MessageCircle, feature: "messaging" },
  { href: "/dashboard/analytics", label: "Análise", icon: BarChart3, feature: "advanced_analytics" },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, feature: "marketing_campaigns" },
  { href: "/dashboard/automations", label: "Automações", icon: Sparkles, feature: "automated_followups" },
  { href: "/dashboard/loyalty", label: "Fidelização", icon: Heart, feature: "loyalty" },
  { href: "/dashboard/pos", label: "Ponto de venda", icon: CreditCard, feature: "pos" },
  { href: "/dashboard/billing", label: "Plano e faturação", icon: CreditCard },
  { href: "/dashboard/settings", label: "Definições", icon: Settings },
];

const mobilePrimary = items.slice(0, 4);

type BrandAvatarProps = { mobile?: boolean; avatarUrl: string | null };

function BrandAvatar({ mobile = false, avatarUrl }: BrandAvatarProps) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-zinc-100", mobile ? "size-8" : "size-9")}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar da barbearia"
          fill
          sizes={mobile ? "32px" : "36px"}
          className="object-cover"
          unoptimized
        />
      ) : (
        <BarberIcon className={cn(mobile ? "size-4" : "size-5")} aria-hidden="true" />
      )}
    </span>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasFeature } = useFeatureAccess();
  const { barbershopAvatarUrl } = useBarbershop();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLocked = (item: SidebarItem) => Boolean(item.feature && !hasFeature(item.feature));

  const handleLocked = (item: SidebarItem) => {
    toast.info(`${item.label} está disponível num plano superior.`, {
      description: "Podes continuar a usar a Silentra sem fazer upgrade. Se precisares desta funcionalidade, compara os planos.",
      action: { label: "Comparar planos", onClick: () => router.push("/dashboard/billing") },
    });
  };

  const closeMobile = () => setMobileOpen(false);

  const renderItem = (item: SidebarItem, mobile = false) => {
    const locked = isLocked(item);
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    const Icon = item.icon;

    if (locked) {
      return <button key={item.href} type="button" onClick={() => handleLocked(item)} className={cn("group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors", "text-zinc-500 hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", mobile && "min-h-12")} aria-label={`${item.label}, disponível num plano superior`}><Icon className="size-4 shrink-0 text-zinc-600" aria-hidden="true" /><span className="truncate">{item.label}</span><Lock className="ml-auto size-3.5 shrink-0 text-zinc-600" aria-hidden="true" /></button>;
    }

    return <Link key={item.href} href={item.href} onClick={mobile ? closeMobile : undefined} className={cn("group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", mobile && "min-h-12")} aria-current={active ? "page" : undefined}><Icon className={cn("size-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} aria-hidden="true" /><span className="truncate">{item.label}</span></Link>;
  };

  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-zinc-950/70 backdrop-blur-xl lg:block"><div className="flex h-full flex-col"><div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5"><Link href="/dashboard" className="group flex min-h-11 items-center gap-3 rounded-xl px-2 text-zinc-100 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Voltar à visão geral"><BrandAvatar avatarUrl={barbershopAvatarUrl} /><span className="font-heading text-lg font-semibold tracking-tight">Silentra</span></Link></div><nav aria-label="Navegação principal do painel" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-5"><p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Menu</p>{items.map((item) => renderItem(item))}</nav></div></aside>
    <nav aria-label="Navegação rápida do painel" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{mobilePrimary.map((item) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)); const Icon = item.icon; return <Link key={item.href} href={item.href} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", active ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200")} aria-current={active ? "page" : undefined}><Icon className={cn("size-4", active && "text-emerald-400")} aria-hidden="true" /><span className="max-w-full truncate">{item.label}</span></Link>; })}<button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Abrir menu completo" aria-expanded={mobileOpen}><Menu className="size-4" aria-hidden="true" /><span>Mais</span></button></div></nav>
    {mobileOpen && <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel"><button type="button" className="absolute inset-0 bg-black/70" onClick={closeMobile} aria-label="Fechar menu" /><aside className="absolute inset-y-0 right-0 flex w-[min(88vw,24rem)] flex-col border-l border-white/10 bg-zinc-950 p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 pb-4"><Link href="/dashboard" onClick={closeMobile} className="flex min-h-10 items-center gap-2 rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Voltar à visão geral"><BrandAvatar avatarUrl={barbershopAvatarUrl} mobile /><span className="font-heading font-semibold">Silentra</span></Link><button type="button" onClick={closeMobile} className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Fechar menu"><X className="size-5" aria-hidden="true" /></button></div><nav aria-label="Todas as secções do painel" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-4">{items.map((item) => renderItem(item, true))}</nav></aside></div>}
  </>;
}
