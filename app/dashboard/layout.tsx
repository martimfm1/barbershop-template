import type { Metadata } from 'next';
import { authenticatedMetadata } from '@/lib/site-metadata';
import DashboardContentLayout from './dashboard-content';

export const metadata: Metadata = authenticatedMetadata;

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardContentLayout>{children}</DashboardContentLayout>;
}
