'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function DashboardTopBar() {
  const [now, setNow] = useState<Date | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const time = now
    ? now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-zinc-950/55 backdrop-blur-xl lg:left-64"
      aria-label={t('dashboard.mainNavigation')}
    >
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={t('dashboard.backToSite')}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('dashboard.backToSite')}</span>
        </Link>
        <div
          className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-zinc-200"
          aria-label={
            now
              ? t('dashboard.currentTime', { time })
              : t('dashboard.checkingTime')
          }
        >
          <Clock3 className="size-4 text-emerald-400" aria-hidden="true" />
          <time
            className="font-mono text-sm font-medium tabular-nums"
            dateTime={now?.toISOString()}
            suppressHydrationWarning
          >
            {time}
          </time>
        </div>
      </div>
    </header>
  );
}
