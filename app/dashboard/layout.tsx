"use client";

import { usePathname } from "next/navigation";
import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";
import { BarbershopVisibilitySetting } from "@/components/dashboard/barbershop-visibility-setting";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsPage = pathname === "/dashboard/settings";

  return (
    <BarbershopProvider>
      <DashboardTopBar />
      <DashboardSidebar />
      <div className="lg:pl-64 min-w-0 pb-4 pt-16">
        {isSettingsPage ? <BarbershopVisibilitySetting /> : null}
        {children}
      </div>
    </BarbershopProvider>
  );
}
