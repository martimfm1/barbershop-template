import { Skeleton } from '@/components/ui/skeleton';

export default function TeamLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 p-4 pt-16 text-zinc-100 sm:p-6 sm:pt-16 lg:p-8 lg:pt-16">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="h-9 w-28 bg-white/10" />
          <Skeleton className="h-4 w-full max-w-xl bg-white/5" />
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <Skeleton className="h-3 w-28 bg-white/5" />
              <Skeleton className="mt-3 h-8 w-24 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-36 bg-white/5" />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-11 rounded-xl bg-white/[0.04]" />
          ))}
        </div>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-white/5 bg-white/[0.04] p-4">
              <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
              <Skeleton className="mt-4 h-4 w-32 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-24 bg-white/5" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
