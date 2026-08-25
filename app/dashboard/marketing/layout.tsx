import type { ReactNode } from 'react';
import { MarketingWorkspace } from './marketing-workspace';

export default function MarketingLayout({ children: _children }: { children: ReactNode }) {
  void _children;
  return <MarketingWorkspace />;
}
