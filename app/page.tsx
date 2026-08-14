import { SiteNavbar } from "@/components/site-navbar";
import { FooterSection } from "@/components/hero/footer-section";
import { SaaSHomepage } from "@/components/hero/saas-homepage";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_22%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to_bottom,black,transparent_90%)",
        }}
      />

      <SiteNavbar />

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-0 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <SaaSHomepage />
      </main>

      <FooterSection />
    </div>
  );
}
