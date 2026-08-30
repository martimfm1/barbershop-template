'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Mirrors the visual hierarchy of DashboardSidebar from top to bottom.
 * Lower items enter from the floor; higher items enter from the ceiling.
 */
const DASHBOARD_HIERARCHY = [
  '/dashboard',
  '/dashboard/agenda',
  '/dashboard/clientes',
  '/dashboard/qr-code',
  '/dashboard/servicos',
  '/dashboard/equipa',
  '/dashboard/comunicacao',
  '/dashboard/mensagens',
  '/dashboard/marketing',
  '/dashboard/mensagens/birthdays',
  '/dashboard/analytics',
  '/dashboard/loyalty',
  '/dashboard/pos',
  '/dashboard/billing',
  '/dashboard/settings',
] as const;

function getSection(pathname: string) {
  return pathname.replace(/^\/dashboard\/?/, '').split('/')[0] || 'home';
}

function getHierarchyIndex(pathname: string) {
  const exact = DASHBOARD_HIERARCHY.indexOf(
    pathname as (typeof DASHBOARD_HIERARCHY)[number],
  );
  if (exact !== -1) return exact;

  let bestIndex = 0;
  let bestLength = 0;

  DASHBOARD_HIERARCHY.forEach((item, index) => {
    if (
      item !== '/dashboard' &&
      pathname.startsWith(`${item}/`) &&
      item.length > bestLength
    ) {
      bestIndex = index;
      bestLength = item.length;
    }
  });

  return bestIndex;
}

function getTransitionKey(pathname: string, searchParams: URLSearchParams) {
  if (pathname === '/dashboard/agenda') {
    return `${pathname}?view=${searchParams.get('view') === 'calendar' ? 'calendar' : 'lines'}`;
  }
  return pathname;
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
  const currentIndex = getHierarchyIndex(pathname);
  const previousIndexRef = useRef(currentIndex);
  const previousKeyRef = useRef(transitionKey);

  const movingInHierarchy = currentIndex - previousIndexRef.current;
  const direction =
    previousKeyRef.current === transitionKey
      ? 1
      : movingInHierarchy === 0
        ? transitionKey.includes('view=calendar')
          ? 1
          : -1
        : movingInHierarchy > 0
          ? 1
          : -1;

  useEffect(() => {
    previousIndexRef.current = currentIndex;
    previousKeyRef.current = transitionKey;
  }, [currentIndex, transitionKey]);

  return (
    <div
      className={cn('grid min-w-0 [perspective:1400px]', className)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={transitionKey}
          custom={direction}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: direction > 0 ? 72 : -72,
                  scale: 0.965,
                  rotateX: direction > 0 ? -7 : 7,
                  transformOrigin: direction > 0 ? '50% 0%' : '50% 100%',
                  filter: 'blur(8px)',
                }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotateX: 0,
                  filter: 'blur(0px)',
                }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: direction > 0 ? -48 : 48,
                  scale: 0.975,
                  rotateX: direction > 0 ? 6 : -6,
                  transformOrigin: direction > 0 ? '50% 100%' : '50% 0%',
                  filter: 'blur(6px)',
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.12 }
              : {
                  opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                  y: { type: 'spring', stiffness: 280, damping: 30, mass: 0.78 },
                  scale: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                  rotateX: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 0.28, ease: 'easeOut' },
                }
          }
          className="col-start-1 row-start-1 min-w-0 will-change-transform [backface-visibility:hidden]"
          data-dashboard-section={section}
          data-dashboard-direction={direction > 0 ? 'down' : 'up'}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
