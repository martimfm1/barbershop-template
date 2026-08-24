import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'emerald' | 'blue' | 'amber' | 'violet';
};

const tones = {
  neutral: 'border-white/10 bg-white/[0.02] text-zinc-500',
  emerald: 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-400',
  blue: 'border-blue-500/20 bg-blue-500/[0.04] text-blue-400',
  amber: 'border-amber-500/20 bg-amber-500/[0.04] text-amber-400',
  violet: 'border-violet-500/20 bg-violet-500/[0.04] text-violet-400',
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tone = 'neutral',
}: EmptyStateProps) {
  const action = actionLabel ? (
    onAction ? (
      <Button
        type="button"
        onClick={onAction}
        className="min-h-11 rounded-lg bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
      >
        {actionLabel}
        <ArrowRight className="ml-2 size-4" aria-hidden="true" />
      </Button>
    ) : actionHref ? (
      <Button
        asChild
        className="min-h-11 rounded-lg bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
      >
        <Link href={actionHref}>
          {actionLabel}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
      </Button>
    ) : null
  ) : null;

  return (
    <div className="silentra-empty flex flex-col items-center justify-center px-5 py-12 text-center sm:py-14">
      <div
        className={`flex size-12 items-center justify-center rounded-xl border ${tones[tone]}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
