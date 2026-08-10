"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbershopProvider>
      <DashboardTopBar />
      <DashboardSidebar />
      <div className="lg:pl-64 min-w-0 pb-4 pt-16">{children}</div>
    </BarbershopProvider>
  );
}
