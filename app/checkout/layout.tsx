import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — Subscrição Silentra',
  description:
    'Conclui a subscrição da Silentra e ativa o plano da tua barbearia.',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
