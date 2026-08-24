'use client';

import { useEffect } from 'react';

export function ProductionLogGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const noop = () => undefined;
    console.log = noop;
    console.info = noop;
    console.debug = noop;
  }, []);

  return null;
}
