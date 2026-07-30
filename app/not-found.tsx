"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      card.style.transform = `perspective(1200px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
    };

    const handleLeave = () => {
      card.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg)";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-zinc-950 text-zinc-50 antialiased" style={{ minHeight: "100dvh" }}>

      {/* Background — identical to landing */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_22%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom,black,transparent 88%)",
        }}
      />

      <main
        className="relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 sm:px-6"
        style={{ minHeight: "100dvh", paddingTop: "5rem", paddingBottom: "2rem" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full"
        >
          {/* Outer card */}
          <div
            ref={cardRef}
            style={{ transition: "transform 0.18s ease-out", willChange: "transform" }}
            className="rounded-3xl border border-white/10 bg-zinc-900/60 p-3 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4"
          >
            {/* Inner card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl sm:p-8">

              {/* Status pill */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-zinc-300 backdrop-blur-xl mb-6 sm:mb-8"
              >
                <Sparkles className="size-3.5 text-zinc-100 shrink-0" />
                <span>HTTP 404 · Page not found</span>
              </motion.div>

              {/* Code display */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
              >
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
                  Status code
                </p>
                <h1
                  className="font-semibold tracking-[-0.06em] leading-none select-none"
                  style={{
                    fontSize: "clamp(5rem, 22vw, 10rem)",
                    background: "linear-gradient(135deg, #fafafa 0%, #52525b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  404
                </h1>
              </motion.div>

              {/* Divider */}
              <div className="my-5 sm:my-6 h-px w-full bg-white/5" />

              {/* Copy */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="space-y-2 mb-6 sm:mb-8"
              >
                <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.03em] text-zinc-100">
                  This page doesn't exist
                </h2>
                <p className="text-sm leading-6 text-zinc-400">
                  The route you requested was not found. It may have been moved, deleted, or the URL may be incorrect.
                </p>
              </motion.div>

              {/* CTAs — stacked on mobile, inline on sm+ */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="flex flex-col gap-2 sm:flex-row sm:gap-3"
              >

                <Link
                  href="/"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-300 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-zinc-100 active:scale-[0.98] sm:w-auto sm:py-2.5"
                >
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                  Back to Home
                </Link>
              </motion.div>

            </div>

            {/* Footer row */}
            <div className="mt-3 flex items-center justify-between px-1 sm:mt-4">
              <p className="text-[11px] text-zinc-600 font-mono tracking-wide">
                silentra.io · not found
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}