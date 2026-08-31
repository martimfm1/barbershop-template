'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, List } from 'lucide-react';
import { AgendaCalendarView } from './agenda-calendar-view';
import { cn } from '@/lib/utils';

export default function AgendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const calendar = searchParams.get('view') === 'calendar';

  return (
    <div className="relative mt-12 w-full min-w-0">
      <div className="mx-auto mb-3 flex w-full max-w-[100rem] flex-col items-center justify-between gap-4 px-1 sm:flex-row sm:px-0">
        {/* LADO ESQUERDO: Título e Descrição */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="silentra-page-title">Agenda</h1>
            <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
              Gere e visualiza todas as tuas marcações e horários.
            </p>
          </div>
        </div>

        {/* LADO DIREITO: Navegação */}
        <nav
          aria-label="Vista da agenda"
          className="isolate inline-grid w-full max-w-sm grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/30 p-1 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:w-fit sm:max-w-none"
        >
          <Link
            href="/dashboard/agenda"
            aria-current={!calendar ? 'page' : undefined}
            aria-label="Ver agenda em linhas"
            className={cn(
              'relative isolate inline-flex min-h-12 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-[color,background-color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/90 focus-visible:ring-inset',
              !calendar
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
            )}
          >
            {!calendar ? (
              <ActiveViewPill reduceMotion={Boolean(reduceMotion)} />
            ) : null}
            <List
              className="relative z-10 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="relative z-10 truncate">Linhas</span>
          </Link>

          <Link
            href="/dashboard/agenda?view=calendar"
            aria-current={calendar ? 'page' : undefined}
            aria-label="Ver agenda em calendário"
            className={cn(
              'relative isolate inline-flex min-h-12 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-[color,background-color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/90 focus-visible:ring-inset',
              calendar
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
            )}
          >
            {calendar ? (
              <ActiveViewPill reduceMotion={Boolean(reduceMotion)} />
            ) : null}
            <CalendarDays
              className="relative z-10 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="relative z-10 truncate">Calendário</span>
          </Link>
        </nav>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {calendar ? (
          <motion.div
            key="calendar"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 22, scale: 0.982, filter: 'blur(5px)' }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -16, scale: 0.99, filter: 'blur(3px)' }
            }
            transition={
              reduceMotion
                ? { duration: 0.1 }
                : {
                    opacity: { duration: 0.18, ease: 'easeOut' },
                    x: {
                      type: 'spring',
                      stiffness: 360,
                      damping: 32,
                      mass: 0.75,
                    },
                    scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    filter: { duration: 0.22, ease: 'easeOut' },
                  }
            }
            className="min-w-0"
          >
            <AgendaCalendarView />
          </motion.div>
        ) : (
          <motion.div
            key="lines"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -22, scale: 0.982, filter: 'blur(5px)' }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 16, scale: 0.99, filter: 'blur(3px)' }
            }
            transition={
              reduceMotion
                ? { duration: 0.1 }
                : {
                    opacity: { duration: 0.18, ease: 'easeOut' },
                    x: {
                      type: 'spring',
                      stiffness: 360,
                      damping: 32,
                      mass: 0.75,
                    },
                    scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    filter: { duration: 0.22, ease: 'easeOut' },
                  }
            }
            className="min-w-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveViewPill({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.span
      layoutId="agenda-view-pill"
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }
      }
      className="absolute inset-0 z-0 rounded-xl border border-emerald-400/15 bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_20px_rgba(0,0,0,0.18)]"
      aria-hidden="true"
    />
  );
}