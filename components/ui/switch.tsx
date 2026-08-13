"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  disabled,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      disabled={disabled}
      className={cn(
        "group/switch relative inline-flex shrink-0 items-center rounded-full border outline-none transition-all duration-200 ease-out after:absolute after:-inset-2",
        "h-6 w-11 p-0.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.03),inset_0_2px_4px_rgb(0_0_0/0.18)]",
        "border-white/15 bg-white/[0.07] hover:border-white/25 hover:bg-white/[0.1]",
        "data-checked:border-emerald-400/50 data-checked:bg-emerald-500/90 data-checked:shadow-[0_0_0_3px_rgb(16_185_129/0.08),inset_0_1px_2px_rgb(255_255_255/0.18)]",
        "data-unchecked:bg-white/[0.05] data-unchecked:border-white/10",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        "data-disabled:cursor-not-allowed data-disabled:opacity-60 data-disabled:hover:border-white/10 data-disabled:hover:bg-white/[0.05]",
        size === "sm" && "h-5 w-9",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none relative z-10 flex size-5 items-center justify-center rounded-full bg-white shadow-[0_2px_7px_rgb(0_0_0/0.28)] ring-1 ring-black/5 transition-transform duration-200 ease-out",
          "data-unchecked:translate-x-0 data-checked:translate-x-5",
          size === "sm" && "size-4 data-checked:translate-x-4",
        )}
      >
        {disabled && <Lock className="size-2.5 text-zinc-500" aria-hidden="true" />}
      </SwitchPrimitive.Thumb>
      {disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-300 sm:inline-flex"
        >
          Pro
        </span>
      )}
    </SwitchPrimitive.Root>
  );
}

export { Switch };
