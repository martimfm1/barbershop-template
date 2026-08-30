'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function getSection(pathname: string) {
  return pathname.replace(/^\/dashboard\/?/, '').split('/')[0] || 'home';
}

function getTransitionKey(pathname: string, searchParams: URLSearchParams) {
  if (pathname === '/dashboard/agenda') {
    return `${pathname}?view=${searchParams.get('view') === 'calendar' ? 'calendar' : 'lines'}`;
  }
  return pathname;
}

function getDirection(key: string) {
  return key.includes('view=calendar') ? 1 : -1;
}

export function DashboardPageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const section = getSection(pathname);
  const transitionKey = getTransitionKey(pathname, searchParams);
  const direction = getDirection(transitionKey);

  return (
    <div className={cn('grid min-w-0', className)}>
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={transitionKey}
          custom={direction}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  x: direction * 28,
                  y: 7,
                  scale: 0.985,
                  filter: 'blur(7px)',
                }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  x: direction * -18,
                  y: -4,
                  scale: 0.992,
                  filter: 'blur(4px)',
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.12 }
              : {
                  opacity: { duration: 0.2, ease: 'easeOut' },
                  x: { type: 'spring', stiffness: 360, damping: 31, mass: 0.72 },
                  y: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 0.24, ease: 'easeOut' },
                }
          }
          className="col-start-1 row-start-1 min-w-0 will-change-transform"
          data-dashboard-section={section}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
