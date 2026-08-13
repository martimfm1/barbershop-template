"use client";

import { usePathname } from "next/navigation";
import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith("/dashboard/settings");

  return (
    <>
      {!isSettingsPage && <DashboardTopBar />}
      <DashboardSidebar />
      <div
        className={`dashboard-content min-w-0 lg:pl-64 ${
          isSettingsPage ? "pt-0" : "pt-16"
        }`}
      >
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
