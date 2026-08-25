import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-3 pb-8 pt-16 text-foreground sm:px-5 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-9 w-72 bg-white/10" />
            <Skeleton className="h-4 w-52 bg-white/5" />
          </div>
          <Skeleton className="h-11 w-48 rounded-xl bg-white/10" />
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
              <Skeleton className="mt-4 h-3 w-20 bg-white/5" />
              <Skeleton className="mt-2 h-7 w-24 bg-white/10" />
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Skeleton className="h-5 w-44 bg-white/10" />
            <Skeleton className="mt-6 h-72 w-full rounded-2xl bg-white/[0.04]" />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Skeleton className="h-5 w-36 bg-white/10" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
