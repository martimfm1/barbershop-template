import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlatformAdminContext } from "@/lib/internal/platform-admin";
import LoyaltyPointsConsole from "./points-console";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Silentra Internal — Loyalty",
  robots: { index: false, follow: false },
};

export default async function SilentraAdminLoyaltyPage() {
  const context = await getPlatformAdminContext();
  if (!context) notFound();
  return <LoyaltyPointsConsole />;
}
