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
    <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${accentClassName}`}
            aria-hidden="true"
          >
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          {description}
        </p>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {actions}
        <Button
          asChild
          variant="ghost"
          className="min-h-11 rounded-lg border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Voltar ao painel
          </Link>
        </Button>
      </div>
    </header>
  );
}
