'use client';

import {
  Download,
  ShieldAlert,
  Store,
  UsersRound,
  Workflow,
} from 'lucide-react';

const oldWay = [
  {
    icon: Download,
    label: 'Download app',
    tone: 'text-red-200',
    bg: 'bg-red-500/10',
  },
  {
    icon: UsersRound,
    label: 'Create account',
    tone: 'text-red-200',
    bg: 'bg-red-500/10',
  },
  {
    icon: ShieldAlert,
    label: 'Verify email',
    tone: 'text-red-200',
    bg: 'bg-red-500/10',
  },
  {
    icon: Workflow,
    label: 'Recover password',
    tone: 'text-red-200',
    bg: 'bg-red-500/10',
  },
] as const;

const silentraWay = [
  {
    icon: Store,
    label: 'Pick a service',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Workflow,
    label: 'Pick a time',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Download,
    label: 'Done',
    tone: 'text-emerald-200',
    bg: 'bg-emerald-500/10',
  },
] as const;

export function ComparisonSection() {
  return (
    <section id="friction" className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
          <span className="size-2 rounded-full bg-red-400/70" />
          The old way
        </div>
        <div className="mt-6 grid gap-3">
          {oldWay.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-full border border-white/8 px-4 py-3 backdrop-blur-xl ${item.bg}`}
              >
                <Icon className={`size-4 ${item.tone}`} />
                <span className="text-sm text-zinc-200">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/4 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200/70">
          <span className="size-2 rounded-full bg-emerald-300/80" />
          The Silentra way
        </div>
        <div className="mt-6 grid gap-3">
          {silentraWay.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-full border border-white/8 px-4 py-3 backdrop-blur-xl ${item.bg}`}
              >
                <Icon className={`size-4 ${item.tone}`} />
                <span className="text-sm text-zinc-100">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
