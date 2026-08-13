import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "min-h-11 h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-base shadow-sm transition-[color,box-shadow,background-color,border-color] outline-none placeholder:text-muted-foreground/75 hover:border-white/[0.14] focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.055] focus-visible:ring-4 focus-visible:ring-emerald-400/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-white/[0.025]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
