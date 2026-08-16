import Link from "next/link";
import { SiteNavbar } from "@/components/site-navbar";
import { MyBookingsPage } from "@/components/customer-portal/my-bookings-page";
import { LoyaltySummary } from "@/components/customer-portal/loyalty-summary";

export default function CustomerBookingsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <LoyaltySummary />
        </div>
        <MyBookingsPage />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-zinc-600 sm:px-6 lg:px-8">
        <Link href="/barbershops" className="hover:text-zinc-400">
          Explorar barbearias
        </Link>
      </footer>
    </div>
  );
}
