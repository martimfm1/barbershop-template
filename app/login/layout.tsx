import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar ou Criar Conta | Silentra',
  description:
    'Entra na tua conta Silentra ou cria o workspace da tua barbearia para começar a gerir marcações e clientes.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
