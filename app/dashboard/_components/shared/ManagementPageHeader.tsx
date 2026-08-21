import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ManagementPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow: string;
  accentClassName: string;
  actions?: ReactNode;
};

export function ManagementPageHeader({
  icon: Icon,
  title,
  description,
  eyebrow,
  accentClassName,
  actions,
}: ManagementPageHeaderProps) {
  return (
    <header className="dashboard-page-header silentra-management-header">
      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className={`silentra-page-icon flex size-11 shrink-0 items-center justify-center rounded-2xl border ${accentClassName}`}
            aria-hidden="true"
          >
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70 sm:text-[11px]">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-3xl">
              {title}
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {actions}
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Voltar ao painel</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
