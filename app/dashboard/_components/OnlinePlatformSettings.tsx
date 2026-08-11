"use client";

import Link from "next/link";
import { Globe, LockKeyhole, Crown, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface OnlinePlatformSettingsProps {
  allowOnlineBookings: boolean;
  isPublicInDirectory: boolean;
  canManageDirectoryVisibility: boolean;
  onAllowOnlineBookingsChange: (value: boolean) => void;
  onDirectoryVisibilityChange: (value: boolean) => void;
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  badge,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
  status: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 transition-colors sm:p-5", disabled ? "border-white/10 bg-white/[0.015]" : "border-white/10 bg-white/[0.025] hover:border-white/15") }>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", disabled ? "border-white/10 bg-white/5 text-zinc-600" : checked ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-zinc-500")}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("text-sm font-semibold", disabled ? "text-zinc-500" : "text-zinc-100")}>{title}</p>
              {badge}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <span className={cn("text-xs font-medium", disabled ? "text-zinc-600" : checked ? "text-emerald-400" : "text-zinc-500")}>{status}</span>
          <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

export function OnlinePlatformSettings({
  allowOnlineBookings,
  isPublicInDirectory,
  canManageDirectoryVisibility,
  onAllowOnlineBookingsChange,
  onDirectoryVisibilityChange,
}: OnlinePlatformSettingsProps) {
  return (
    <div className="space-y-3">
      <SettingRow
        icon={<CalendarCheck className="size-5" aria-hidden="true" />}
        title="Aceitar marcações online"
        description="Permite que os clientes façam marcações autonomamente através da página pública da tua barbearia."
        checked={allowOnlineBookings}
        onCheckedChange={onAllowOnlineBookingsChange}
        status={allowOnlineBookings ? "Ativo" : "Desativado"}
      />

      <SettingRow
        icon={<Globe className="size-5" aria-hidden="true" />}
        title="Visibilidade no diretório"
        description={<>Escolhe se a tua barbearia aparece no diretório público <span className="text-zinc-300">/barbearias</span>. A página pública direta continua disponível.</>}
        checked={isPublicInDirectory}
        onCheckedChange={onDirectoryVisibilityChange}
        disabled={!canManageDirectoryVisibility}
        status={!canManageDirectoryVisibility ? "Pro" : isPublicInDirectory ? "Visível" : "Oculta"}
        badge={<span className="inline-flex items-center gap-1 rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300"><Crown className="size-3" /> Pro</span>}
      />

      {!canManageDirectoryVisibility && (
        <div className="flex items-start gap-2 rounded-xl border border-purple-500/15 bg-purple-500/[0.04] px-3 py-2.5 text-xs text-zinc-400">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-purple-300" aria-hidden="true" />
          <span>O controlo de visibilidade está incluído no <Link href="/dashboard/billing" className="font-semibold text-purple-300 hover:text-purple-200">plano Pro</Link>.</span>
        </div>
      )}

      {canManageDirectoryVisibility && (
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-zinc-500">
          <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
          As alterações são validadas no servidor de acordo com o teu plano.
        </p>
      )}
    </div>
  );
}
