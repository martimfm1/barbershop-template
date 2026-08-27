'use client';

import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-zinc-50">
      <QueryProvider>{children}</QueryProvider>
      <Toaster richColors position="top-right" />
    </div>
  );
}
