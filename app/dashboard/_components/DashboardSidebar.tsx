"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Megaphone, Settings, Sparkles, Heart, CreditCard, LayoutDashboard, CalendarDays, Users, Scissors, Briefcase, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { FeatureKey } from "@/lib/billing/plan-features";

interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: FeatureKey;
}

const items: SidebarItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/equipa", label: "Equipa", icon: Briefcase, feature: "team_management" },
  { href: "/dashboard/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, feature: "advanced_analytics" },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, feature: "marketing_campaigns" },
  { href: "/dashboard/automations", label: "Automações", icon: Sparkles, feature: "automated_followups" },
  { href: "/dashboard/loyalty", label: "Fidelização", icon: Heart, feature: "loyalty" },
  { href: "/dashboard/pos", label: "POS", icon: CreditCard, feature: "pos" },
  { href: "/dashboard/billing", label: "Plano e faturação", icon: CreditCard },
  { href: "/dashboard/settings", label: "Definições", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { hasFeature } = useFeatureAccess();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-zinc-950/70 pt-20 backdrop-blur-xl lg:block">
      <nav aria-label="Navegação do dashboard" className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-5">
        {items.map((item) => {
          const locked = item.feature ? !hasFeature(item.feature) : false;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                locked && "opacity-55",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {locked && <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">Pro</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}