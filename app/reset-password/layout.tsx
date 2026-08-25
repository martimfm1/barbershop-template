import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Definir Nova Palavra-passe | Silentra',
  description:
    'Define uma nova palavra-passe para a tua conta Silentra.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
