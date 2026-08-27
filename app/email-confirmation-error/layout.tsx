import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Erro na Confirmação do Email | Silentra',
  description:
    'Não foi possível confirmar o email. Consulta o estado da tua conta e tenta novamente.',
  robots: { index: false, follow: false },
};

export default function EmailConfirmationErrorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
