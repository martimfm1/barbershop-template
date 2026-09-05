import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import {
  Geist,
  Geist_Mono,
  Source_Sans_3,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import './silentra-responsive.css';
import { cn } from '@/lib/utils';
import { ClientShell } from '@/components/client-shell';
import { ProductionLogGuard } from '@/app/production-log-guard';
import { LanguageProvider } from '@/context/LanguageContext';
import { guestMetadata } from '@/lib/site-metadata';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-heading',
});
const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
});
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = guestMetadata;
export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get('locale')?.value;
  const initialLocale = storedLocale === 'en' ? 'en' : 'pt';
  const enableVercelTelemetry = process.env.NODE_ENV === 'production';

  return (
    <html
      lang={initialLocale === 'pt' ? 'pt-PT' : 'en'}
      dir="ltr"
      className={cn(
        'dark h-full scroll-smooth antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        sourceSans3.variable,
        jetbrainsMonoHeading.variable,
      )}
    >
      <body className="min-h-full bg-black text-foreground">
        <LanguageProvider initialLocale={initialLocale}>
          <ProductionLogGuard />
          {enableVercelTelemetry ? <SpeedInsights /> : null}
          {enableVercelTelemetry ? <Analytics /> : null}
          <ClientShell>{children}</ClientShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
