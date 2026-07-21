import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Source_Sans_3,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientShell } from "@/components/client-shell";
import { LanguageProvider } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/server";
import { metadataForAuth } from "@/lib/site-metadata";

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
});
const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return metadataForAuth(Boolean(user));
  } catch {
    return metadataForAuth(false);
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full scroll-smooth antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        sourceSans3.variable,
        jetbrainsMonoHeading.variable,
      )}
    >
      <body className="min-h-full bg-black text-foreground">
        <LanguageProvider>
          <ClientShell>{children}</ClientShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
