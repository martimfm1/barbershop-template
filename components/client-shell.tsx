'use client';

import { Toaster } from '@/components/ui/sonner';
import { DynamicMetadata } from '@/components/dynamic-metadata';
import { QueryProvider } from '@/components/providers/query-provider';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-zinc-50">
      <DynamicMetadata />
      <QueryProvider>{children}</QueryProvider>
      <Toaster richColors position="top-right" />
    </main>
  );
}
