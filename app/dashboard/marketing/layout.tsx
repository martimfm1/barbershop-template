import type { ReactNode } from 'react';
import { CampaignControls } from './campaign-controls';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 sm:pt-6">
        <CampaignControls />
      </div>
      {children}
    </>
  );
}
