"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Phone,
  User,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SiteNavbar } from "@/components/site-navbar";
import { TermsDrawer } from "@/components/legal/terms-drawer";
import { useLanguage } from "@/context/LanguageContext";
import { handleLogin, handleRegister } from "./services/auth-handles";

export default function LoginPage() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    const requestedEmail = params.get("email");

    // Defer state updates so the first client render matches the server HTML.
    queueMicrotask(() => {
      if (requestedTab === "register") setActiveTab("register");
      if (requestedEmail) setLoginEmail(requestedEmail);
    });
  }, []);

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden antialiased selection:bg-zinc-50 selection:text-zinc-950">
        <StarfieldBackground>
          <SiteNavbar />

          <section className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-12 sm:px-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:max-w-6xl lg:mx-auto lg:min-h-screen lg:py-20 w-full">
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
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="w-full max-w-[440px] lg:max-w-[460px] mx-auto border border-white/10 bg-zinc-950/40 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl overflow-hidden focus-within:border-white/20 transition-colors"
            >
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v);
                  setErrorMsg(null);
                }}
                className="w-full"
              >
                <motion.div layout="position" className="w-full">
                  <CardHeader className="gap-3 pb-2 px-5 sm:px-6 pt-5 sm:pt-6">
                    <div className="relative grid w-full grid-cols-2 rounded-full border border-white/10 bg-black/50 p-1 h-11 items-center overflow-hidden select-none">
                      {(["login", "register"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab);
                            setErrorMsg(null);
                          }}
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

                    <div className="overflow-hidden mt-1 min-h-[46px]">
                      <AnimatePresence mode="wait">
                        {activeTab === "login" ? (
                          <motion.div
                            key="login-text"
                            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                            transition={{ duration: 0.18 }}
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
                            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                            transition={{ duration: 0.18 }}
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

                <CardContent className="px-5 sm:px-6 pb-6 pt-1">
                  <AnimatePresence mode="wait">
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        className="p-3 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl font-medium mb-3 text-center"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {activeTab === "login" ? (
                      <TabsContent
                        value="login"
                        forceMount
                        key="login-tab"
                        className="mt-0 focus-visible:outline-none"
                      >
                        <motion.form
                          key="login-form"
                          initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="grid gap-3.5"
                          onSubmit={(e) => handleLogin({ event: e, setIsSubmitting, setErrorMsg })}
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
                                        value={loginEmail}
                                        onChange={(event) => setLoginEmail(event.target.value)}
                                        placeholder="admin@barbershop.pt"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Use your verified organization email address.
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
                                        type={showLoginPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-12 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Minimum 8 characters. Case-sensitive.
                                    </TooltipContent>
                                  </Tooltip>
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                  >
                                    {showLoginPassword ? (
                                      <EyeOff className="size-4" />
                                    ) : (
                                      <Eye className="size-4" />
                                    )}
                                  </button>
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

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
                            className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md mt-1"
                          >
                            {isSubmitting ? (
                              <Spinner className="size-4 text-zinc-950" />
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                Sign In to Dashboard <ArrowRight className="size-4" />
                              </span>
                            )}
                          </Button>
                        </motion.form>
                      </TabsContent>
                    ) : (
                      <TabsContent
                        value="register"
                        forceMount
                        key="register-tab"
                        className="mt-0 focus-visible:outline-none"
                      >
                        <motion.form
                          key="register-form"
                          initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, x: 16, filter: "blur(4px)" }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="grid gap-3"
                          onSubmit={(e) =>
                            handleRegister({
                              event: e,
                              setIsSubmitting,
                              setErrorMsg,
                              acceptedTerms,
                              termsErrorMessage: t("legal.acceptRequired", {
                                defaultValue:
                                  "You must accept the terms and conditions.",
                              }),
                            })
                          }
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
                                      This will be your workspace master owner access key.
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
                                      Include country code. Used strictly for secure API notifications.
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
                                        type={showRegisterPassword ? "text" : "password"}
                                        required
                                        minLength={12}
                                        placeholder="••••••••"
                                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 pr-12 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/5 transition-all rounded-xl"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Usa pelo menos 12 caracteres, incluindo letras, números e símbolos.
                                    </TooltipContent>
                                  </Tooltip>
                                  <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                  >
                                    {showRegisterPassword ? (
                                      <EyeOff className="size-4" />
                                    ) : (
                                      <Eye className="size-4" />
                                    )}
                                  </button>
                                </div>
                              </FieldContent>
                            </FieldGroup>
                          </Field>

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
                              {t("legal.agreePrefix", {
                                defaultValue: "I agree to the",
                              })}{" "}
                              <TermsDrawer
                                trigger={
                                  <button
                                    type="button"
                                    className="font-semibold text-zinc-100 underline underline-offset-4 transition-colors hover:text-white focus:outline-none"
                                  >
                                    {t("legal.termsLink", {
                                      defaultValue: "Terms & Conditions",
                                    })}
                                  </button>
                                }
                              />
                            </label>
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md mt-1"
                          >
                            {isSubmitting ? (
                              <Spinner className="size-4 text-zinc-950" />
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                Create Workspace <ArrowRight className="size-4" />
                              </span>
                            )}
                          </Button>
                        </motion.form>
                      </TabsContent>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Tabs>
            </motion.div>
          </section>
        </StarfieldBackground>
      </main>
    </TooltipProvider>
  );
}
