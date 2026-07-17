"use client";

import { motion } from "motion/react";
import { BarberIcon } from "@/components/BarberIcon";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [0.98, 1, 0.98],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-white"
        >
          <BarberIcon className="size-24" />
        </motion.div>

        <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse">
          Preparing experience...
        </span>
      </div>
    </div>
  );
}
