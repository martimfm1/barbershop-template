import type { Metadata } from 'next';
import { SiteNavbar } from '@/components/site-navbar';
import { FooterSection } from '@/components/hero/footer-section';
import { LocalizedHomepage } from '@/components/hero/localized-homepage';
import { LocalizedPricingSection } from '@/components/hero/localized-pricing-section';

export const metadata: Metadata = {
  title: 'Gestão e Agendamento Online para Barbearias | Silentra',
  description:
    'Gere a tua barbearia, receba marcações online e acompanha clientes, equipa e receita num único painel com a Silentra.',
  alternates: {
    canonical: 'https://barbers.silentra.me/',
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 antialiased">
      <SiteNavbar />
      <LocalizedHomepage />
      <LocalizedPricingSection />
      <FooterSection />
    </div>
  );
}
