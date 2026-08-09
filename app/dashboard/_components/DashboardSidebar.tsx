"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Megaphone, Settings, Users, Scissors, Sparkles, UserRound, Heart, Package, CreditCard, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clientes", icon: UserRound },
  { href: "/dashboard/services", label: "Serviços", icon: Scissors },
  { href: "/dashboard/professionals", label: "Equipa", icon: Users, feature: "team_management" as const },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, feature: "advanced_analytics" as const },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, feature: "marketing_campaigns" as const },
  { href: "/dashboard/automations", label: "Automações", icon: Sparkles, feature: "automated_followups" as const },
  { href: "/dashboard/loyalty", label: "Fidelização", icon: Heart, feature: "loyalty" as const },
  { href: "/dashboard/inventory", label: "Stock", icon: Package, feature: "inventory" as const },
  { href: "/dashboard/pos", label: "POS", icon: CreditCard, feature: "pos" as const },
  { href: "/dashboard/billing", label: "Plano e faturação", icon: CreditCard },
  { href: "/dashboard/settings", label: "Definições", icon: Settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const { hasFeature } = useFeatureAccess();

  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-zinc-950/70 pt-20 backdrop-blur-xl lg:block">
    <nav aria-label="Navegação do dashboard" className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-5">
      {items.map((item) => {
        const locked = item.feature ? !hasFeature(item.feature) : false;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} className={cn("group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100", locked && "opacity-55")} aria-current={active ? "page" : undefined}>
          <Icon className={cn("size-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
          {locked && <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">Pro</span>}
        </Link>;
      })}
    </nav>
  </aside>;
}
