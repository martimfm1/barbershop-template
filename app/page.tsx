import { SiteNavbar } from "@/components/site-navbar";
import { FooterSection } from "@/components/hero/footer-section";
import { ProTrialBanner } from "@/components/hero/pro-trial-banner";
import { SaaSHomepageV2 } from "@/components/hero/saas-homepage-v2";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 antialiased">
      <SiteNavbar />
      <ProTrialBanner />
      <SaaSHomepageV2 />
      <FooterSection />
    </div>
  );
}
