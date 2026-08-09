"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbershopProvider>
      <DashboardSidebar />
      <div className="min-w-0 pb-20 lg:pb-0 lg:pl-64">{children}</div>
    </BarbershopProvider>
  );
}
