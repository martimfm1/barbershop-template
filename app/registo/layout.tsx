import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta | Silentra',
  description:
    'Cria a conta da tua barbearia e começa a gerir marcações, clientes e serviços com a Silentra.',
  robots: { index: false, follow: false },
};

export default function RegistoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
