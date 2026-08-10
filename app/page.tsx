import { SiteNavbar } from "@/components/site-navbar";
import { HeroSection } from "@/components/hero/hero-section";
import { ComparisonSection } from "@/components/hero/comparison-section";
import { CommandCenterSection } from "@/components/hero/command-center-section";
import { PricingSection } from "@/components/hero/pricing-section";
import { CtaSection } from "@/components/hero/cta-section";
import { FooterSection } from "@/components/hero/footer-section";

// Dados de demonstração deliberadamente realistas para que o visitante perceba valor
// antes de criar uma conta. O objetivo é reduzir a fricção e tornar o primeiro clique útil.
const services = [
  { id: "corte", name: "Corte", duration: "30 min", price: "15 €" },
  { id: "corte-barba", name: "Corte + Barba", duration: "45 min", price: "20 €" },
  { id: "barba", name: "Barba", duration: "20 min", price: "10 €" },
] as const;

const slots = ["09:00", "09:30", "10:00", "11:30", "12:00", "13:30"] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_22%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to_bottom,black,transparent_88%)",
        }}
      />

      <SiteNavbar />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <HeroSection services={services} slots={slots} />
        <ComparisonSection />
        <CommandCenterSection />
        <PricingSection />
        <CtaSection />
        <FooterSection />
      </main>
    </div>
  );
}
