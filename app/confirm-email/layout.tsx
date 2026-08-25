import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirmar Email | Silentra',
  description: 'Confirma o teu endereço de email para ativar a conta Silentra.',
  robots: { index: false, follow: false },
};

export default function ConfirmEmailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
