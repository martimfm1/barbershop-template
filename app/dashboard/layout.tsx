"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbershopProvider>
      <DashboardSidebar />
      <DashboardTopBar />
      <div className="min-w-0 pb-20 pt-16 lg:pb-0 lg:pl-64 lg:pt-16">{children}</div>
    </BarbershopProvider>
  );
}
