import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full min-w-0 resize-y rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-base shadow-sm transition-[color,box-shadow,background-color,border-color] outline-none placeholder:text-muted-foreground/75 hover:border-white/[0.14] focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.055] focus-visible:ring-4 focus-visible:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-white/[0.025]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
