'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, List } from 'lucide-react';
import { AgendaCalendarView } from './agenda-calendar-view';
import { AgendaCalendarSkeleton } from './agenda-view-skeletons';
import { cn } from '@/lib/utils';

export default function AgendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const calendar = searchParams.get('view') === 'calendar';
  const viewKey = calendar ? 'calendar' : 'lines';

  return (
    <div className="relative min-w-0">
      <div className="mx-auto mb-3 flex w-full max-w-[100rem] justify-end px-0">
        <div
          className="relative inline-flex items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 p-1 backdrop-blur-xl"
          role="tablist"
          aria-label="Vista da agenda"
        >
          <Link
            href="/dashboard/agenda"
            role="tab"
            aria-selected={!calendar}
            className={cn(
              'relative z-10 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              !calendar ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {!calendar ? (
              <motion.span
                layoutId="agenda-view-pill"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }
                }
                className="absolute inset-0 -z-10 rounded-xl border border-white/[0.1] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.18)]"
                aria-hidden="true"
              />
            ) : null}
            <List className="size-3.5" />
            Linhas
          </Link>
          <Link
            href="/dashboard/agenda?view=calendar"
            role="tab"
            aria-selected={calendar}
            className={cn(
              'relative z-10 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              calendar ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {calendar ? (
              <motion.span
                layoutId="agenda-view-pill"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }
                }
                className="absolute inset-0 -z-10 rounded-xl border border-white/[0.1] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.18)]"
                aria-hidden="true"
              />
            ) : null}
            <CalendarDays className="size-3.5" />
            Calendário
          </Link>
        </div>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {calendar ? (
          <motion.div
            key="calendar"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 18, scale: 0.985, filter: 'blur(6px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14, scale: 0.99, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <AgendaCalendarStage />
          </motion.div>
        ) : (
          <motion.div
            key="lines"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18, scale: 0.985, filter: 'blur(6px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 14, scale: 0.99, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgendaCalendarStage() {
  return <AgendaCalendarView />;
}
