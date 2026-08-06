"use client";

import { BarbershopProvider } from "@/context/BarbershopContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <BarbershopProvider>{children}</BarbershopProvider>;
}
