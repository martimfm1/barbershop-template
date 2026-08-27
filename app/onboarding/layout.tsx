import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurar Barbearia | Silentra',
  description:
    'Configura a tua barbearia e prepara o espaço de gestão na Silentra.',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
