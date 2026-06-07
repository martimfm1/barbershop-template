"use client"

export function ClientShell({ children }: { children: React.ReactNode }) {
return (
<main className="min-h-screen bg-zinc-950 pt-20 text-zinc-50">
    {children}
</main>
)
}