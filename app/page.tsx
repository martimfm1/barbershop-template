import { SiteNavbar } from '@/components/site-navbar';
import { FooterSection } from '@/components/hero/footer-section';
import { LocalizedHomepage } from '@/components/hero/localized-homepage';
import { LocalizedPricingSection } from '@/components/hero/localized-pricing-section';

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
