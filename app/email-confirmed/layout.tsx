import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Confirmado | Silentra',
  description: 'O teu email foi confirmado e a tua conta Silentra está pronta.',
  robots: { index: false, follow: false },
};

export default function EmailConfirmedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
