'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, List } from 'lucide-react';
import { AgendaCalendarView } from './agenda-calendar-view';

export default function AgendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const searchParams = useSearchParams();
  const calendar = searchParams.get('view') === 'calendar';

  return (
    <div className="relative">
      <div className="mx-auto mb-3 flex w-full max-w-[100rem] justify-end px-0">
        <div
          className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-black/20 p-1 backdrop-blur-xl"
          role="tablist"
          aria-label="Vista da agenda"
        >
          <Link
            href="/dashboard/agenda"
            role="tab"
            aria-selected={!calendar}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
              !calendar
                ? 'bg-white/[0.09] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
            }`}
          >
            <List className="size-3.5" />
            Linhas
          </Link>
          <Link
            href="/dashboard/agenda?view=calendar"
            role="tab"
            aria-selected={calendar}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
              calendar
                ? 'bg-white/[0.09] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
            }`}
          >
            <CalendarDays className="size-3.5" />
            Calendário
          </Link>
        </div>
      </div>

      {calendar ? <AgendaCalendarView /> : children}
    </div>
  );
}
