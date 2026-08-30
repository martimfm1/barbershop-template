'use client';

import { CalendarDays, List } from 'lucide-react';

function Shimmer({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-lg bg-white/[0.06] ${className ?? ''}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-[agenda-shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </span>
  );
}

export function AgendaLinesSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="A carregar agenda em linhas">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Shimmer className="size-9 rounded-xl" />
              <Shimmer className="h-8 w-10 rounded-lg" />
            </div>
            <Shimmer className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.075] bg-black/20 p-3 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Shimmer className="h-11 flex-1 rounded-xl" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <Shimmer key={index} className="h-10 w-20 shrink-0 rounded-xl" />
            ))}
          </div>
          <Shimmer className="h-10 w-24 shrink-0 rounded-xl" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-black/20">
        <div className="border-b border-white/[0.075] p-5">
          <Shimmer className="h-2.5 w-24" />
          <Shimmer className="mt-2 h-7 w-36" />
          <Shimmer className="mt-2 h-3 w-72 max-w-full" />
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4 md:grid-cols-[110px_1fr_140px]"
            >
              <Shimmer className="h-4 w-20" />
              <div className="space-y-2">
                <Shimmer className="h-4 w-40" />
                <Shimmer className="h-3 w-56 max-w-full" />
              </div>
              <Shimmer className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">A carregar marcações…</span>
    </div>
  );
}

export function AgendaCalendarSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]" role="status" aria-label="A carregar calendário">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="border-b border-white/[0.075] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Shimmer className="h-2.5 w-28" />
              <Shimmer className="mt-2 h-7 w-40" />
              <Shimmer className="mt-2 h-3 w-80 max-w-[60vw]" />
            </div>
            <div className="flex gap-2">
              <Shimmer className="size-10 rounded-xl" />
              <Shimmer className="h-10 w-20 rounded-xl" />
              <Shimmer className="size-10 rounded-xl" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Shimmer className="h-7 w-24 rounded-full" />
            <Shimmer className="h-7 w-24 rounded-full" />
            <Shimmer className="h-7 w-24 rounded-full" />
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-2 border-b border-white/[0.06] pb-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <Shimmer key={index} className="h-3 w-8 justify-self-center" />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 42 }).map((_, index) => (
              <div
                key={index}
                className="min-h-32 rounded-xl border border-white/[0.045] bg-white/[0.018] p-2 sm:min-h-36 sm:p-3"
              >
                <div className="flex items-center justify-between">
                  <Shimmer className="size-7 rounded-lg" />
                  <Shimmer className="h-3 w-4" />
                </div>
                <Shimmer className="mt-3 h-1.5 w-full rounded-full" />
                <Shimmer className="mt-2 h-2.5 w-20" />
                <div className="mt-2 space-y-1.5">
                  <Shimmer className="h-5 w-full rounded-md" />
                  <Shimmer className="h-5 w-4/5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <Shimmer className="h-2.5 w-24" />
        <Shimmer className="mt-2 h-7 w-52 max-w-full" />
        <Shimmer className="mt-2 h-3 w-32" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <Shimmer className="h-2.5 w-14" />
              <Shimmer className="mt-2 h-6 w-8" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-3">
              <Shimmer className="h-3 w-32" />
              <Shimmer className="mt-2 h-3 w-44 max-w-full" />
              <Shimmer className="mt-2 h-2.5 w-24" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">A carregar calendário…</span>
    </div>
  );
}

export function AgendaViewIcon({ calendar }: { calendar: boolean }) {
  return calendar ? <CalendarDays className="size-3.5" /> : <List className="size-3.5" />;
}
