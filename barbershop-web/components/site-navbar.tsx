"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BarberIcon } from "@/components/BarberIcon"
import { motion } from "motion/react"
import { MenuIcon } from "@/components/MenuIcon"

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
]

export function SiteNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-500">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          <Link href="/" className="flex items-center gap-3">
            <motion.div
              layoutId="brand-logo"
              className="flex items-center justify-center text-zinc-100"
            >
              <BarberIcon className="size-8" />
            </motion.div>
            <span className="text-zinc-100 font-heading text-xl font-semibold">
              Silentra
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="hidden border-white/15 bg-white/5 text-zinc-100 hover:border-white/30 hover:bg-white/10 sm:inline-flex"
            >
              <Link href="/login">Sign In</Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="relative z-60 cursor-pointer border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white"
            >
              <MenuIcon open={open} className="size-6" />
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-zinc-950/95 px-4 py-5 sm:px-6 sm:py-6 text-zinc-50 backdrop-blur-2xl transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right",
          open
            ? "pointer-events-auto opacity-100 scale-100 translate-y-0"
            : "pointer-events-none opacity-0 scale-95 -translate-y-4"
        )}
        style={{
          clipPath: open
            ? "circle(150% at calc(100% - 2rem) 2rem)"
            : "circle(0% at calc(100% - 2rem) 2rem)",
        }}
        aria-hidden={!open}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
          <div className="grid gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group border-b border-white/10 py-4 font-heading text-4xl font-semibold tracking-tight text-zinc-100 transition-colors hover:text-white sm:text-6xl"
              >
                <span className="mr-4 inline-block text-base text-zinc-500 transition-transform group-hover:translate-x-2 group-hover:text-zinc-200">
                  /
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}