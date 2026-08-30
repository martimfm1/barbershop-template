'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function getSection(pathname: string) {
  return pathname.replace(/^\/dashboard\/?/, '').split('/')[0] || 'home';
}

export function DashboardPageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const section = getSection(pathname);

  return (
    <div className={cn('grid min-w-0', className)}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={pathname}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(5px)' }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -10, scale: 0.99, filter: 'blur(3px)' }
          }
          transition={
            reducedMotion
              ? { duration: 0.12 }
              : {
                  opacity: { duration: 0.2, ease: 'easeOut' },
                  y: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
                  scale: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 0.26, ease: 'easeOut' },
                }
          }
          className="col-start-1 row-start-1 min-w-0"
          data-dashboard-section={section}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
