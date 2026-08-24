import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  return React.useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mql.addEventListener('change', callback);

      return () => mql.removeEventListener('change', callback);
    },
    () => {
      if (typeof window === 'undefined') {
        return false;
      }

      return window.innerWidth < MOBILE_BREAKPOINT;
    },
    () => false,
  );
}
