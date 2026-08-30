'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, List } from 'lucide-react';
import { AgendaCalendarView } from './agenda-calendar-view';
import { cn } from '@/lib/utils';

export default function AgendaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const calendar = searchParams.get('view') === 'calendar';

  return (
    <div className="relative min-w-0">
      <div className="mx-auto mb-3 flex w-full max-w-[100rem] justify-center px-0 sm:justify-end">
        <div className="relative inline-flex w-full max-w-sm items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25 p-1 shadow-[0_12px_36px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:w-auto" role="tablist" aria-label="Vista da agenda">
          <Link href="/dashboard/agenda" role="tab" aria-selected={!calendar} className={cn('relative z-10 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 sm:flex-none', !calendar ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
            {!calendar ? <ActiveViewPill reduceMotion={Boolean(reduceMotion)} /> : null}
            <List className="size-3.5" aria-hidden="true" />
            Linhas
          </Link>
          <Link href="/dashboard/agenda?view=calendar" role="tab" aria-selected={calendar} className={cn('relative z-10 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 sm:flex-none', calendar ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
            {calendar ? <ActiveViewPill reduceMotion={Boolean(reduceMotion)} /> : null}
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Calendário
          </Link>
        </div>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {calendar ? (
          <motion.div key="calendar" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 22, scale: 0.982, filter: 'blur(5px)' }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.99, filter: 'blur(3px)' }} transition={reduceMotion ? { duration: 0.1 } : { opacity: { duration: 0.18, ease: 'easeOut' }, x: { type: 'spring', stiffness: 360, damping: 32, mass: 0.75 }, scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, filter: { duration: 0.22, ease: 'easeOut' } }} className="min-w-0">
            <AgendaCalendarView />
          </motion.div>
        ) : (
          <motion.div key="lines" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -22, scale: 0.982, filter: 'blur(5px)' }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.99, filter: 'blur(3px)' }} transition={reduceMotion ? { duration: 0.1 } : { opacity: { duration: 0.18, ease: 'easeOut' }, x: { type: 'spring', stiffness: 360, damping: 32, mass: 0.75 }, scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, filter: { duration: 0.22, ease: 'easeOut' } }} className="min-w-0">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveViewPill({ reduceMotion }: { reduceMotion: boolean }) {
  return <motion.span layoutId="agenda-view-pill" transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }} className="absolute inset-0 -z-10 rounded-xl border border-white/[0.1] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.2)]" aria-hidden="true" />;
}
