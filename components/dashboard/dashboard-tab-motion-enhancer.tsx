'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const INDICATOR_ATTRIBUTE = 'data-dashboard-tab-indicator';
const SIDEBAR_INDICATOR_ATTRIBUTE = 'data-dashboard-sidebar-indicator';

const sidebarSelector = 'nav[aria-label="Navegação principal"]';

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

function enhanceSidebar(nav: HTMLElement) {
  const items = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>(':scope > a, :scope > div > a'),
  );
  if (items.length < 2) return () => {};

  nav.style.position = 'relative';

  items.forEach((item) => {
    item.style.position = 'relative';
    item.style.zIndex = '1';
    item.style.backgroundColor = 'transparent';
    item.style.transition = 'color 180ms ease';
  });

  let indicator = nav.querySelector<HTMLElement>(
    `:scope > [${SIDEBAR_INDICATOR_ATTRIBUTE}]`,
  );

  if (!indicator) {
    indicator = document.createElement('span');
    indicator.setAttribute(SIDEBAR_INDICATOR_ATTRIBUTE, 'true');
    indicator.setAttribute('aria-hidden', 'true');
    Object.assign(indicator.style, {
      position: 'absolute',
      left: '12px',
      top: '0',
      width: '0',
      height: '44px',
      pointerEvents: 'none',
      zIndex: '0',
      border: '1px solid rgba(255,255,255,0.09)',
      background:
        'linear-gradient(90deg, rgba(255,255,255,0.095), rgba(255,255,255,0.045))',
      boxShadow:
        '0 8px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
      borderRadius: '12px',
      opacity: '0',
      transformOrigin: 'center',
      willChange: 'transform,width,height,opacity',
    });
    nav.prepend(indicator);
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  indicator.style.transition = reducedMotion
    ? 'none'
    : 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1), width 460ms cubic-bezier(0.22, 1, 0.36, 1), height 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease';

  const sync = () => {
    const active = items.find((item) => item.getAttribute('aria-current') === 'page');
    if (!active || !indicator) {
      if (indicator) indicator.style.opacity = '0';
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    const x = itemRect.left - navRect.left;
    const y = itemRect.top - navRect.top + nav.scrollTop;

    indicator.style.opacity = '1';
    indicator.style.width = `${itemRect.width}px`;
    indicator.style.height = `${itemRect.height}px`;
    indicator.style.transform = `translate3d(${x - 12}px, ${y}px, 0)`;
  };

  sync();
  const mutationObserver = new MutationObserver(sync);
  items.forEach((item) =>
    mutationObserver.observe(item, {
      attributes: true,
      attributeFilter: ['aria-current'],
    }),
  );
  const resizeObserver = new ResizeObserver(sync);
  resizeObserver.observe(nav);
  items.forEach((item) => resizeObserver.observe(item));
  nav.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });

  return () => {
    mutationObserver.disconnect();
    resizeObserver.disconnect();
    nav.removeEventListener('scroll', sync);
    window.removeEventListener('resize', sync);
  };
}

export function DashboardTabMotionEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups = new Map<HTMLElement, () => void>();

    const scan = () => {
      const elements = [
        ...Array.from(
          document.querySelectorAll<HTMLElement>('[role="tablist"]'),
        ),
        ...Array.from(document.querySelectorAll<HTMLElement>(sidebarSelector)),
      ];

      elements.forEach((element) => {
        if (cleanups.has(element)) return;
        const cleanup = element.matches(sidebarSelector)
          ? enhanceSidebar(element)
          : enhanceTabList(element);
        cleanups.set(element, cleanup);
      });

      for (const [element, cleanup] of cleanups) {
        if (!document.contains(element)) {
          cleanup();
          cleanups.delete(element);
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
