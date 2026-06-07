'use client';
import { Spotlight } from "@/components/ui/spotlight-new";
import { SiteNavbar } from "@/components/site-navbar";
import { IntroLoader } from "@/components/intro-loader";
import { useState } from "react";
import { motion } from "motion/react";

export default function LandingPage() {
  const [showContent, setShowContent] = useState(false);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 antialiased overflow-hidden">
      <IntroLoader onComplete={() => setShowContent(true)} />
      <SiteNavbar />
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 12 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      ></motion.main>
        <section id="home" className="min-h-screen w-full">
          <div className="min-h-[70vh] sm:min-h-[80vh] w-full rounded-md flex items-start md:items-center justify-center bg-grid-white/[0.02] relative overflow-hidden py-16 sm:py-20">
            <Spotlight />
            <div className="p-4 max-w-3xl mx-auto relative z-10 w-full pt-20 md:pt-0">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
                Silentra <br /> barbershop template
              </h1>
              <p className="mt-4 font-normal text-base sm:text-lg text-neutral-300 max-w-xl text-center mx-auto">
                lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec venenatis, dolor in finibus malesuada, lectus ipsum porta nunc.
              </p>
            </div>
          </div>
        </section>
    </div>
  );
}