'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const INDICATOR_ATTRIBUTE = 'data-dashboard-tab-indicator';

function enhanceTabList(tabList: HTMLElement) {
  const tabs = Array.from(
    tabList.querySelectorAll<HTMLElement>(':scope > [role="tab"]'),
  );
  if (tabs.length < 2) return () => {};

  tabList.style.position = 'relative';

  tabs.forEach((tab) => {
    tab.style.position = 'relative';
    tab.style.zIndex = '1';
    tab.style.backgroundColor = 'transparent';
  });

  let indicator = tabList.querySelector<HTMLElement>(
    `:scope > [${INDICATOR_ATTRIBUTE}]`,
  );

  if (!indicator) {
    indicator = document.createElement('span');
    indicator.setAttribute(INDICATOR_ATTRIBUTE, 'true');
    indicator.setAttribute('aria-hidden', 'true');
    Object.assign(indicator.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      pointerEvents: 'none',
      zIndex: '0',
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.08)',
      boxShadow:
        '0 8px 30px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
      borderRadius: '0.75rem',
      transformOrigin: 'center',
      willChange: 'transform,width,height',
    });
    tabList.prepend(indicator);
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  indicator.style.transition = reducedMotion
    ? 'none'
    : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease';

  const sync = () => {
    const active = tabs.find(
      (tab) =>
        tab.getAttribute('aria-selected') === 'true' ||
        tab.getAttribute('data-state') === 'active',
    );

    if (!active || !indicator) {
      if (indicator) indicator.style.opacity = '0';
      return;
    }

    const listRect = tabList.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    const x = tabRect.left - listRect.left + tabList.scrollLeft;
    const y = tabRect.top - listRect.top + tabList.scrollTop;

    indicator.style.opacity = '1';
    indicator.style.width = `${tabRect.width}px`;
    indicator.style.height = `${tabRect.height}px`;
    indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  sync();

  const mutationObserver = new MutationObserver(sync);
  tabs.forEach((tab) =>
    mutationObserver.observe(tab, {
      attributes: true,
      attributeFilter: ['aria-selected', 'data-state'],
    }),
  );

  const resizeObserver = new ResizeObserver(sync);
  resizeObserver.observe(tabList);
  tabs.forEach((tab) => resizeObserver.observe(tab));

  tabList.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });

  return () => {
    mutationObserver.disconnect();
    resizeObserver.disconnect();
    tabList.removeEventListener('scroll', sync);
    window.removeEventListener('resize', sync);
  };
}

export function DashboardTabMotionEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups = new Map<HTMLElement, () => void>();

    const scan = () => {
      const tabLists = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="tablist"]:not([data-dashboard-tab-motion="native"])',
        ),
      );

      tabLists.forEach((tabList) => {
        if (cleanups.has(tabList)) return;
        cleanups.set(tabList, enhanceTabList(tabList));
      });

      for (const [tabList, cleanup] of cleanups) {
        if (!document.contains(tabList)) {
          cleanup();
          cleanups.delete(tabList);
        }
      }
    };

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, [pathname]);

  return null;
}
