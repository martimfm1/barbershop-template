"use client"

import { Toaster } from "@/components/ui/sonner"

export function ClientShell({ children }: { children: React.ReactNode }) {
return (
<main className="min-h-screen text-zinc-50">
    {children}
    <Toaster richColors position="top-right" />
</main>
)
}