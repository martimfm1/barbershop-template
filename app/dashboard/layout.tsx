"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";
import { DashboardTopBar } from "@/app/dashboard/_components/DashboardTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbershopProvider>
      <DashboardTopBar />
      <div className="min-w-0 pb-4 pt-16">{children}</div>
    </BarbershopProvider>
  );
}
