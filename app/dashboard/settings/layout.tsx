import type { ReactNode } from 'react';
import { SettingsAmenitiesIntegration } from './settings-amenities-integration';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsAmenitiesIntegration>{children}</SettingsAmenitiesIntegration>;
}
