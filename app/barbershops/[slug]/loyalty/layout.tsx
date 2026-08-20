import LoyaltyMembershipActions from "./membership-actions";

export default async function LoyaltyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
        <div className="pointer-events-auto">
          <LoyaltyMembershipActions slug={slug} />
        </div>
      </div>
      {children}
    </div>
  );
}
