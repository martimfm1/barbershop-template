'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type AnimatedTab = {
  href: string;
  label: string;
  description?: string;
};

export function AnimatedTabs({
  tabs,
  activeHref,
  className,
}: {
  tabs: AnimatedTab[];
  activeHref: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Secções"
      className={cn(
        'flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-xl',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = activeHref === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative min-h-11 shrink-0 rounded-xl px-4 py-2 text-left transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              'motion-reduce:transition-none',
              active
                ? 'bg-white/[0.08] text-zinc-50'
                : 'text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-200',
            )}
          >
            <span className="relative z-10 block text-sm font-medium">
              {tab.label}
            </span>
            {tab.description ? (
              <span className="relative z-10 mt-0.5 block text-[11px] text-zinc-600 group-hover:text-zinc-500">
                {tab.description}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-x-2 bottom-0 h-0.5 origin-left rounded-full transition-transform duration-200 motion-reduce:transition-none',
                active
                  ? 'scale-x-100 bg-emerald-400'
                  : 'scale-x-0 bg-transparent',
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
