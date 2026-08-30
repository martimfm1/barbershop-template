'use client';

import { usePathname } from 'next/navigation';
import { BarbershopProvider } from '@/context/BarbershopContext';
import { DashboardTopBar } from '@/app/dashboard/_components/DashboardTopBar';
import { DashboardSidebar } from '@/app/dashboard/_components/DashboardSidebar';
import { Spotlight } from '@/components/aceternity/spotlight';
import { DashboardTabMotionEnhancer } from '@/components/dashboard/dashboard-tab-motion-enhancer';
import { DashboardPageTransition } from '@/components/dashboard/dashboard-page-transition';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith('/dashboard/settings');

  return (
    <div className="silentra-dashboard-shell">
      <DashboardTabMotionEnhancer />
      {!isSettingsPage && <DashboardTopBar />}
      <DashboardSidebar />
      <div
        className={`dashboard-content silentra-dashboard-main min-w-0 lg:pl-64 ${
          isSettingsPage ? 'pt-0' : 'pt-2'
        }`}
      >
        <DashboardPageTransition>
          <main className="dashboard-page mx-auto max-w-[1600px] py-5 sm:py-7">
            {children}
          </main>
        </DashboardPageTransition>
      </div>
    </div>
  );
}

export default function DashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BarbershopProvider>
      <Spotlight className="opacity-80" />
      <DashboardContent>{children}</DashboardContent>
    </BarbershopProvider>
  );
}
