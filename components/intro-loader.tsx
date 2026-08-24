'use client';
import { motion, AnimatePresence } from 'motion/react';
import { BarberIcon } from '@/components/BarberIcon';
import { useEffect, useState } from 'react';
export function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="fixed inset-0 z-999 flex flex-col items-center justify-center bg-zinc-950"
        >
          <motion.div
            layoutId="brand-logo"
            transition={{
              type: 'spring',
              stiffness: 70,
              damping: 15,
              duration: 0.8,
            }}
          >
            <BarberIcon className="size-24" />
          </motion.div>
          <motion.span
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="mt-6 text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse"
          >
            Preparing experience...
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
