"use client";

import { useEffect, useState, useId } from "react";
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
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginEmailHintId = useId();
  const loginPassHintId = useId();
  const regEmailHintId = useId();
  const regPhoneHintId = useId();
  const regPassHintId = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    const requestedEmail = params.get("email");

    queueMicrotask(() => {
      if (requestedTab === "register") setActiveTab("register");
      if (requestedEmail) setLoginEmail(requestedEmail);
    });
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <main className="min-h-dvh w-full bg-background text-foreground flex flex-col antialiased selection:bg-zinc-50 selection:text-zinc-950">
        <StarfieldBackground>
          <div className="flex flex-col min-h-dvh w-full">
            <SiteNavbar />

            <section className="flex-1 w-full flex flex-col justify-center items-center px-4 pt-10 pb-12 sm:px-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:max-w-6xl lg:mx-auto lg:py-16">
              
              {/* Lado Esquerdo (Desktop) */}
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

              {/* Cabeçalho Mobile */}
              <div className="mb-6 text-center lg:hidden max-w-sm mx-auto">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 bg-white/5 px-3 py-0.5 rounded-full border border-white/10 inline-block">
                  Reserved Area
                </p>
                <h1 className="font-heading text-xl font-semibold text-zinc-50 tracking-tight">
                  Manage your barbershop
                </h1>
              </div>

              {/* Card sem scroll interno (altura natural) */}
              <div className="w-full max-w-[440px] lg:max-w-[460px] mx-auto border border-white/10 bg-zinc-950/85 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl focus-within:border-white/20 transition-colors flex flex-col">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as "login" | "register");
                    setErrorMsg(null);
                  }}
                  className="w-full flex flex-col"
                >
                  <CardHeader className="shrink-0 gap-3 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <div
                      role="tablist"
                      aria-label="Opções de acesso"
                      className="relative grid w-full grid-cols-2 rounded-full border border-white/10 bg-black/50 p-1 min-h-[40px] items-center select-none"
                    >
                      {(["login", "register"] as const).map((tab) => (
                        <button
                          key={tab}
                          id={`tab-${tab}`}
                          role="tab"
                          aria-selected={activeTab === tab}
                          aria-controls={`panel-${tab}`}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab);
                            setErrorMsg(null);
                          }}
                          className="cursor-pointer relative min-h-[32px] h-full w-full rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-colors"
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
                              "relative z-10 transition-colors duration-300 flex items-center justify-center h-full",
                              activeTab === tab
                                ? "text-zinc-950 font-bold"
                                : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            {tab === "login" ? "Login" : "Register"}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="overflow-hidden mt-1 min-h-[40px]">
                      <AnimatePresence mode="wait">
                        {activeTab === "login" ? (
                          <motion.div
                            key="login-text"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <CardTitle className="font-heading text-lg text-zinc-50 tracking-tight">
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
                            <CardTitle className="font-heading text-lg text-zinc-50 tracking-tight">
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

                  <CardContent className="px-4 sm:px-6 pb-6 pt-1">
                    <AnimatePresence mode="wait">
                      {errorMsg && (
                        <motion.div
                          role="alert"
                          aria-live="assertive"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl font-medium mb-3 text-center"
                        >
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {activeTab === "login" ? (
                        <TabsContent
                          value="login"
                          id="panel-login"
                          aria-labelledby="tab-login"
                          forceMount
                          key="login-tab"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <motion.form
                            key="login-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="grid gap-3.5"
                            onSubmit={(e) =>
                              handleLogin({ event: e, setIsSubmitting, setErrorMsg })
                            }
                          >
                            <Field>
                              <FieldGroup className="grid gap-1">
                                <FieldLabel>
                                  <Label
                                    htmlFor="login-email"
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Email Address
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="login-email"
                                      name="email"
                                      type="email"
                                      required
                                      autoComplete="email"
                                      value={loginEmail}
                                      aria-describedby={loginEmailHintId}
                                      onChange={(event) =>
                                        setLoginEmail(event.target.value)
                                      }
                                      placeholder="admin@barbershop.pt"
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 pr-10 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
                                    />

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          tabIndex={-1}
                                          aria-label="Mais informações sobre o e-mail"
                                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                                        >
                                          <Info className="size-3.5" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        id={loginEmailHintId}
                                        side="top"
                                      >
                                        Use your verified organization email
                                        address.
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </FieldContent>
                              </FieldGroup>
                            </Field>

                            <Field>
                              <FieldGroup className="grid gap-1">
                                <FieldLabel>
                                  <Label
                                    htmlFor="login-password"
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Password
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="login-password"
                                      name="password"
                                      type={
                                        showLoginPassword ? "text" : "password"
                                      }
                                      required
                                      autoComplete="current-password"
                                      aria-describedby={loginPassHintId}
                                      placeholder="••••••••"
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 pr-12 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowLoginPassword(!showLoginPassword)
                                      }
                                      aria-label={
                                        showLoginPassword
                                          ? "Ocultar palavra-passe"
                                          : "Mostrar palavra-passe"
                                      }
                                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg transition-colors"
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

                            <div className="flex items-center justify-between text-xs pt-0.5 pb-0.5">
                              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer select-none py-1">
                                <Checkbox
                                  id="remember"
                                  className="size-4 rounded border-white/30 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-950"
                                />
                                <span className="text-xs">Remember me</span>
                              </label>

                              <a
                                href="/forgot-password"
                                className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors font-medium px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md hover:underline"
                              >
                                Forgot password?
                              </a>
                            </div>

                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all shadow-md mt-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                            >
                              {isSubmitting ? (
                                <Spinner className="size-4 text-zinc-950" />
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  Sign In to Dashboard <ArrowRight className="size-4" />
                                </span>
                              )}
                            </Button>
                          </motion.form>
                        </TabsContent>
                      ) : (
                        <TabsContent
                          value="register"
                          id="panel-register"
                          aria-labelledby="tab-register"
                          forceMount
                          key="register-tab"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <motion.form
                            key="register-form"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
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
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Full Name
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="reg-name"
                                      name="name"
                                      required
                                      autoComplete="name"
                                      placeholder="Ex: Graham Silva"
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
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
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Email
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="reg-email"
                                      name="email"
                                      type="email"
                                      required
                                      autoComplete="email"
                                      aria-describedby={regEmailHintId}
                                      placeholder="admin@barbershop.pt"
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
                                    />
                                  </div>
                                </FieldContent>
                              </FieldGroup>
                            </Field>

                            <Field>
                              <FieldGroup className="grid gap-1">
                                <FieldLabel>
                                  <Label
                                    htmlFor="reg-phone"
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Mobile Phone
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="reg-phone"
                                      name="phone"
                                      type="tel"
                                      inputMode="tel"
                                      required
                                      autoComplete="tel"
                                      defaultValue="+351"
                                      aria-describedby={regPhoneHintId}
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
                                    />
                                  </div>
                                </FieldContent>
                              </FieldGroup>
                            </Field>

                            <Field>
                              <FieldGroup className="grid gap-1">
                                <FieldLabel>
                                  <Label
                                    htmlFor="reg-password"
                                    className="text-xs font-medium text-zinc-300"
                                  >
                                    Password
                                  </Label>
                                </FieldLabel>
                                <FieldContent>
                                  <div className="relative group">
                                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-100 transition-colors" />
                                    <Input
                                      id="reg-password"
                                      name="password"
                                      type={
                                        showRegisterPassword ? "text" : "password"
                                      }
                                      required
                                      minLength={12}
                                      autoComplete="new-password"
                                      aria-describedby={regPassHintId}
                                      placeholder="••••••••"
                                      className="h-11 text-base sm:text-xs border-white/10 bg-white/5 pl-10 pr-12 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20 transition-all rounded-xl"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowRegisterPassword(!showRegisterPassword)
                                      }
                                      aria-label={
                                        showRegisterPassword
                                          ? "Ocultar palavra-passe"
                                          : "Mostrar palavra-passe"
                                      }
                                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg transition-colors"
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

                            <div className="flex items-start gap-3 py-1">
                              <label
                                htmlFor="terms"
                                className="flex items-start gap-3 text-xs text-zinc-300 leading-relaxed cursor-pointer select-none py-0.5"
                              >
                                <Checkbox
                                  id="terms"
                                  checked={acceptedTerms}
                                  onCheckedChange={(v) => setAcceptedTerms(!!v)}
                                  className="mt-0.5 size-4 rounded border-white/30 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-950 shrink-0"
                                />
                                <span>
                                  {t("legal.agreePrefix", {
                                    defaultValue: "I agree to the",
                                  })}{" "}
                                  <TermsDrawer
                                    trigger={
                                      <button
                                        type="button"
                                        className="font-semibold text-zinc-100 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
                                      >
                                        {t("legal.termsLink", {
                                          defaultValue: "Terms & Conditions",
                                        })}
                                      </button>
                                    }
                                  />
                                </span>
                              </label>
                            </div>

                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all shadow-md mt-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shrink-0"
                            >
                              {isSubmitting ? (
                                <Spinner className="size-4 text-zinc-950" />
                              ) : (
                                <span className="flex items-center justify-center gap-2">
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
              </div>
            </section>
          </div>
        </StarfieldBackground>
      </main>
    </TooltipProvider>
  );
}