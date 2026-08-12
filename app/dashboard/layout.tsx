"use client";

import { usePathname } from "next/navigation";
import { BarbershopProvider, useBarbershop } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";
import { BarbershopVisibilitySetting } from "@/components/dashboard/barbershop-visibility-setting";
import { SettingsLocationPanel } from "@/components/dashboard/settings-location-panel";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { barbershopId } = useBarbershop();
  const isSettingsPage = pathname === "/dashboard/settings";

  return (
    <>
      <DashboardTopBar />
      <DashboardSidebar />
      <div className="min-w-0 pb-4 pt-16 lg:pl-64">
        {isSettingsPage && barbershopId ? (
          <div className="mx-auto max-w-6xl space-y-6 px-4 pt-4 sm:px-6 lg:px-8">
            <SettingsLocationPanel barbershopId={barbershopId} />
            <BarbershopVisibilitySetting />
          </div>
        ) : null}
        {children}
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbershopProvider>
      <DashboardContent>{children}</DashboardContent>
    </BarbershopProvider>
  );
}
