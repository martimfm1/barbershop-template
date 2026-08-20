"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

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
    const handleLeave = () => { card.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg)"; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-zinc-950 text-zinc-50 antialiased" style={{ minHeight: "100dvh" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom,black,transparent 88%)" }} />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 sm:px-6" style={{ minHeight: "100dvh", paddingTop: "5rem", paddingBottom: "2rem" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="w-full">
          <div ref={cardRef} style={{ transition: "transform 0.18s ease-out", willChange: "transform" }} className="rounded-3xl border border-white/10 bg-zinc-900/60 p-3 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl sm:p-8">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-zinc-300 backdrop-blur-xl sm:mb-8">
                <Sparkles className="size-3.5 shrink-0 text-zinc-100" aria-hidden="true" />
                <span>{t("notFound.status")}</span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }}>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{t("notFound.statusCode")}</p>
                <h1 className="select-none font-semibold leading-none tracking-[-0.06em]" style={{ fontSize: "clamp(5rem, 22vw, 10rem)", background: "linear-gradient(135deg, #fafafa 0%, #52525b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</h1>
              </motion.div>

              <div className="my-5 h-px w-full bg-white/5 sm:my-6" />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="mb-6 space-y-2 sm:mb-8">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-100 sm:text-xl">{t("notFound.title")}</h2>
                <p className="text-sm leading-6 text-zinc-400">{t("notFound.description")}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Link href="/" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-300 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-zinc-100 active:scale-[0.98] sm:w-auto sm:py-2.5">
                  <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  {t("notFound.backHome")}
                </Link>
              </motion.div>
            </div>

            <div className="mt-3 flex items-center justify-between px-1 sm:mt-4">
              <p className="font-mono text-[11px] tracking-wide text-zinc-600">{t("notFound.footer")}</p>
              <div className="flex items-center gap-1.5" aria-hidden="true">
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
