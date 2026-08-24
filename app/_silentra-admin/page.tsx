import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlatformAdminContext } from '@/lib/internal/platform-admin';
import PlatformAdminConsole from './platform-admin-console';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Silentra Internal',
  robots: { index: false, follow: false },
};

export default async function SilentraAdminPage() {
  const context = await getPlatformAdminContext();
  if (!context) notFound();

  return <PlatformAdminConsole />;
}
