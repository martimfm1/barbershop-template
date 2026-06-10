"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, Phone, User, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StarfieldBackground } from "@/components/ui/starfield";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SiteNavbar } from "@/components/site-navbar";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => setIsSubmitting(false), 700);
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden antialiased selection:bg-zinc-50 selection:text-zinc-950">
        <StarfieldBackground>
          <SiteNavbar />

          <section className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-12 sm:px-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:max-w-6xl lg:mx-auto lg:min-h-screen lg:py-20 w-full">
            {/* Left Column (Desktop Only) */}
            <div className="hidden lg:flex flex-col items-start text-left space-y-5">
              <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 select-none shadow-inner">
                Barbershop reserved area
              </Badge>
              <h1 className="max-w-xl font-heading text-4xl xl:text-5xl font-semibold leading-[1.15] text-zinc-50 tracking-tight">
                Manage bookings, clients, and operations in one place.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-zinc-400 font-normal">
                Sign in to your account or create barbershop access to start
                receiving automated WhatsApp bookings seamlessly.
              </p>
            </div>

            {/* Mobile Header Hero */}
            <div className="mb-8 text-center lg:hidden max-w-sm mx-auto">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 inline-block">
                Reserved Area
              </p>
              <h1 className="font-heading text-2xl font-semibold text-zinc-50 tracking-tight">
                Manage your barbershop
              </h1>
            </div>

            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="w-full max-w-[440px] lg:max-w-[460px] mx-auto border border-white/10 bg-zinc-950/40 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl overflow-hidden focus-within:border-white/20 transition-colors"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <motion.div layout="position" className="w-full">
                  <CardHeader className="gap-3 pb-2 px-5 sm:px-6 pt-5 sm:pt-6">
                    {/* Fluid Tab Toggle — div/button para evitar conflitos com TabsList do shadcn */}
                    <div className="relative grid w-full grid-cols-2 rounded-full border border-white/10 bg-black/50 p-1 h-11 items-center overflow-hidden select-none">
                      {(["login", "register"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className="cursor-pointer relative h-9 rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
                        >
                          {activeTab === tab && (
                            <motion.div
                              layoutId="active-tab-indicator"
                              className="absolute inset-0 bg-zinc-50 rounded-full shadow-lg"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 32,
                              }}
                            />
                          )}
                          <span
                            className={cn(
                              "relative z-10 transition-colors duration-300",
                              activeTab === tab
                                ? "text-zinc-950"
                                : "text-zinc-400 hover:text-zinc-200",
                            )}
                          >
                            {tab === "login" ? "Login" : "Register"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Animated Text Headings */}
                    <div className="overflow-hidden mt-1 min-h-[46px]">
                      <AnimatePresence mode="wait">
                        {activeTab === "login" ? (
                          <motion.div
                            key="login-text"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <CardTitle className="font-heading text-lg sm:text-xl text-zinc-50 tracking-tight">
                              Welcome back
                            </CardTitle>
                            <CardDescription className="mt-0.5 text-xs text-zinc-400">
                              Access your business credentials.
                            </CardDescription>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="register-text"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <CardTitle className="font-heading text-lg sm:text-xl text-zinc-50 tracking-tight">
                              Create workspace
                            </CardTitle>
                            <CardDescription className="mt-0.5 text-xs text-zinc-400">
                              Set up your access terminal and dashboard.
                            </CardDescription>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardHeader>
                </motion.div>

                {/* ── CARD CONTENT FORM VIEW ── */}
                <CardContent className="px-5 sm:px-6 pb-6 pt-1">
                  <AnimatePresence mode="wait">
                    {/* ── FORMULÁRIO LOGIN ── */}
                    {activeTab === "login" && (
                      <TabsContent
                        value="login"
                        forceMount
                        className="mt-0 focus-visible:outline-none"
                      >
                        <motion.form
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="grid gap-3.5"
                          onSubmit={handleSubmit}
                        >
                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="login-email"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Email Address
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group pt-0">
                                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="admin@barbershop.pt"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Use your verified organization email
                                      address.
                                    </TooltipContent>
                                  </Tooltip>
                                  <Info className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="login-password"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Password
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group">
                                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Minimum 8 characters. Case-sensitive.
                                    </TooltipContent>
                                  </Tooltip>
                                  <Info className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          {/* UX Balancer: Linha utilitária para preenchimento de espaço e features reais */}
                          <div className="flex items-center justify-between text-xs py-0.5">
                            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
                              <Checkbox
                                id="remember"
                                className="size-3.5 rounded border-white/20 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-950"
                              />
                              <span>Remember me</span>
                            </label>
                            <button
                              type="button"
                              className="text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
                            >
                              Forgot password?
                            </button>
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all shadow-md mt-1"
                          >
                            {isSubmitting ? (
                              <Spinner className="size-4 text-zinc-950" />
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                Sign In to Dashboard{" "}
                                <ArrowRight className="size-4" />
                              </span>
                            )}
                          </Button>
                        </motion.form>
                      </TabsContent>
                    )}

                    {/* ── FORMULÁRIO REGISTO ── */}
                    {activeTab === "register" && (
                      <TabsContent
                        value="register"
                        forceMount
                        className="mt-0 focus-visible:outline-none"
                      >
                        <motion.form
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="grid gap-3"
                          onSubmit={handleSubmit}
                        >
                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="reg-name"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Full Name
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group">
                                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                  <Input
                                    id="reg-name"
                                    name="name"
                                    required
                                    placeholder="Ex: Graham Silva"
                                    className="h-11 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                  />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="reg-email"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Email
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group">
                                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="admin@barbershop.pt"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      This will be your workspace master owner
                                      access key.
                                    </TooltipContent>
                                  </Tooltip>
                                  <Info className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="reg-phone"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Mobile Phone
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group">
                                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        id="reg-phone"
                                        name="phone"
                                        inputMode="tel"
                                        required
                                        defaultValue="351"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Include country code. Used strictly for
                                      secure API notifications.
                                    </TooltipContent>
                                  </Tooltip>
                                  <Info className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          <Field>
                            <FieldGroup className="grid gap-1">
                              <FieldLabel>
                                <Label
                                  htmlFor="reg-password"
                                  className="text-xs font-medium text-zinc-400"
                                >
                                  Password
                                </Label>
                              </FieldLabel>
                              <FieldContent>
                                <div className="relative group">
                                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        id="reg-password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Combine numbers, symbols and capital
                                      letters.
                                    </TooltipContent>
                                  </Tooltip>
                                  <Info className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

                          {/* Terms & Drawer Agreement */}
                          <div className="flex items-start gap-2.5 py-1">
                            <Checkbox
                              id="terms"
                              checked={acceptedTerms}
                              onCheckedChange={(v) => setAcceptedTerms(!!v)}
                              className="mt-0.5 size-3.5 rounded border-white/20 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-950"
                            />
                            <label
                              htmlFor="terms"
                              className="text-xs text-zinc-400 leading-snug cursor-pointer select-none"
                            >
                              I agree to the{" "}
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <button
                                    type="button"
                                    className="font-semibold text-zinc-100 underline underline-offset-4 hover:text-white transition-colors focus:outline-none"
                                  >
                                    Terms & Conditions
                                  </button>
                                </DrawerTrigger>
                                <DrawerContent className="border-white/10 bg-zinc-950 text-zinc-50 max-w-md mx-auto rounded-t-2xl">
                                  <DrawerHeader>
                                    <DrawerTitle className="font-heading text-lg">
                                      Terms & Conditions
                                    </DrawerTitle>
                                    <DrawerDescription className="text-zinc-400 text-xs">
                                      Graham Barber platform — last updated June
                                      2025
                                    </DrawerDescription>
                                  </DrawerHeader>
                                  <div className="px-5 pb-5 space-y-3.5 text-xs text-zinc-400 max-h-60 overflow-y-auto leading-relaxed scrollbar-thin">
                                    <p>
                                      By creating an account, you agree to use
                                      the platform solely for managing
                                      barbershop operations. Your data is stored
                                      securely and never shared with third
                                      parties.
                                    </p>
                                    <p>
                                      WhatsApp notifications are sent via our
                                      automated system. Standard message rates
                                      from your provider may apply. You may opt
                                      out at any time from your account
                                      settings.
                                    </p>
                                    <p>
                                      Account access is restricted to authorised
                                      barbershop staff. Sharing credentials is
                                      prohibited. Graham Barber reserves the
                                      right to suspend accounts found in
                                      violation of these terms.
                                    </p>
                                  </div>
                                  <DrawerFooter className="flex-row gap-3 p-5 border-t border-white/5 bg-zinc-900/50">
                                    <DrawerClose asChild>
                                      <Button
                                        type="button"
                                        className="flex-1 rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white"
                                        onClick={() => setAcceptedTerms(true)}
                                      >
                                        Accept & close
                                      </Button>
                                    </DrawerClose>
                                    <DrawerClose asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-full border-white/10 bg-white/5 text-xs text-zinc-100"
                                      >
                                        Close
                                      </Button>
                                    </DrawerClose>
                                  </DrawerFooter>
                                </DrawerContent>
                              </Drawer>
                            </label>
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting || !acceptedTerms}
                            className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md mt-1"
                          >
                            {isSubmitting ? (
                              <Spinner className="size-4 text-zinc-950" />
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                Initialize Workspace{" "}
                                <ArrowRight className="size-4" />
                              </span>
                            )}
                          </Button>
                        </motion.form>
                      </TabsContent>
                    )}
                  </AnimatePresence>

                  {/* Footer Element within morphing container */}
                  <motion.div layout="position" className="w-full">
                    <Separator className="my-4 bg-white/10" />
                    <Button
                      asChild
                      variant="link"
                      className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors h-auto p-0"
                    >
                      <Link href="/">Back to homepage</Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Tabs>
            </motion.div>
          </section>
        </StarfieldBackground>
      </main>
    </TooltipProvider>
  );
}
