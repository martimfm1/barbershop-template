"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowRight, LockKeyhole, Mail, Phone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "register"

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    window.setTimeout(() => setIsSubmitting(false), 700)
  }

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-28 text-foreground sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            Graham Barber reserved area
          </p>
          <h1 className="max-w-xl font-heading text-6xl font-semibold leading-none text-zinc-50">
            Manage bookings, clients, and operations in one place.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
            Sign in to your account or create barbershop access to start receiving automated WhatsApp bookings.
          </p>
          </div>

        <Card className="mx-auto w-full max-w-xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader className="gap-4">
            <div className="grid grid-cols-2 rounded-full border border-white/10 bg-black/20 p-1">
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "h-11 rounded-full text-sm font-semibold transition-all",
                    mode === item
                      ? "bg-zinc-50 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100"
                  )}
                >
                  {item === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>
            <div>
              <CardTitle className="font-heading text-4xl text-zinc-50">
                {mode === "login" ? "Sign in" : "Create account"}
              </CardTitle>
              <CardDescription className="mt-2 text-zinc-400">
                {mode === "login"
                  ? "Use your barbershop credentials."
                  : "Set up the first access to activate the dashboard."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Ex: Graham Silva"
                      className="h-12 border-white/10 bg-white/5 pl-11 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-white/10"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@grahambarber.pt"
                    className="h-12 border-white/10 bg-white/5 pl-11 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-white/10"
                  />
                </div>
              </div>

              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="phone">Mobile phone number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="tel"
                      required
                      defaultValue="351"
                      className="h-12 border-white/10 bg-white/5 pl-11 text-zinc-50 focus-visible:border-white/40 focus-visible:ring-white/10"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="h-12 border-white/10 bg-white/5 pl-11 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-white/10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 rounded-full bg-zinc-50 font-bold text-zinc-950 hover:bg-white"
              >
                {isSubmitting
                  ? "Processing..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <Separator className="my-6 bg-white/10" />

            <p className="text-center text-sm text-zinc-400">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-zinc-100 underline-offset-4 hover:underline"
              >
                {mode === "login" ? "Register" : "Back to login"}
              </button>
            </p>

            <Button asChild variant="link" className="mt-3 w-full text-zinc-400">
              <Link href="/">Back to homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
