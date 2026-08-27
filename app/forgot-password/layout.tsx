import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar Palavra-passe | Silentra',
  description:
    'Recupera o acesso à tua conta Silentra através do fluxo seguro de recuperação de palavra-passe.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
