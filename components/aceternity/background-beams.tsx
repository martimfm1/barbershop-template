import { cn } from "@/lib/utils"

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-80",
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_62%)] blur-2xl" />
      <div className="aceternity-beam aceternity-beam-one" />
      <div className="aceternity-beam aceternity-beam-two" />
      <div className="aceternity-beam aceternity-beam-three" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_12%,transparent_72%)]" />
    </div>
  )
}
