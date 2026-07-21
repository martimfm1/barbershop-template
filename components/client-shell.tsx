"use client";

import { Toaster } from "@/components/ui/sonner";
import { DynamicMetadata } from "@/components/dynamic-metadata";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-zinc-50">
      <DynamicMetadata />
      {children}
      <Toaster richColors position="top-right" />
    </main>
  );
}