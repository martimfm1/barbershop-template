'use client';

import { usePathname } from 'next/navigation';
import { BarbershopProvider } from '@/context/BarbershopContext';
import { DashboardTopBar } from '@/app/dashboard/_components/DashboardTopBar';
import { DashboardSidebar } from '@/app/dashboard/_components/DashboardSidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith('/dashboard/settings');

  return (
    <div className="silentra-dashboard-shell">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-[18%] top-[-12rem] size-[28rem] rounded-full bg-emerald-400/[0.025] blur-3xl" />
        <div className="absolute right-[-10rem] top-[18%] size-[24rem] rounded-full bg-white/[0.018] blur-3xl" />
      </div>
      {!isSettingsPage && <DashboardTopBar />}
      <DashboardSidebar />
      <div
        className={`dashboard-content silentra-dashboard-main min-w-0 lg:pl-64 ${
          isSettingsPage ? 'pt-0' : 'pt-16'
        }`}
      >
        <main className="dashboard-page mx-auto max-w-[1600px] py-5 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BarbershopProvider>
      <DashboardContent>{children}</DashboardContent>
    </BarbershopProvider>
  );
}
