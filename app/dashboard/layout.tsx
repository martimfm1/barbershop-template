"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardTopBar />
      <DashboardSidebar />
      <div className="dashboard-content min-w-0 pt-16 lg:pl-64">
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
