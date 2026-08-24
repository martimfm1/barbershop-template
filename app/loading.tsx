'use client';

import { motion } from 'motion/react';
import { BarberIcon } from '@/components/BarberIcon';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_42%)] opacity-70" />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full border border-white/8"
        style={{ height: '32rem', width: '32rem' }}
        animate={{ rotate: 360, opacity: [0.28, 0.6, 0.28] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full border border-white/6"
        style={{ height: '22rem', width: '22rem' }}
        animate={{ rotate: -360, opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <motion.div
          animate={{ opacity: [0.72, 1, 0.72], scale: [0.96, 1, 0.96] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative text-white"
        >
          <motion.div
            aria-hidden="true"
            className="absolute -inset-4 rounded-full bg-white/5 blur-2xl"
            animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.96, 1.05, 0.96] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <BarberIcon className="size-24 sm:size-28" />
        </motion.div>

        <div className="space-y-3">
          <motion.div
            className="mx-auto flex items-center justify-center gap-2"
            initial="hidden"
            animate="visible"
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="size-2 rounded-full bg-white/70"
                animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.18,
                }}
              />
            ))}
          </motion.div>

          <div className="space-y-1">
            <p className="font-heading text-sm tracking-[0.35em] text-white/80 uppercase">
              Silentra
            </p>
            <span className="block text-xs tracking-[0.3em] text-zinc-500 uppercase">
              Preparing experience...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
