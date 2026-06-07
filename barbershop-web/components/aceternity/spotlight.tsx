import { cn } from "@/lib/utils"

export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -top-32 left-0 h-[36rem] w-[56rem] rotate-[-12deg] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),rgba(161,161,170,0.08)_38%,transparent_70%)] blur-3xl",
        className
      )}
      aria-hidden="true"
    />
  )
}
