/**
 * Design: exact corrected owner dashboard artwork with transparent, accessible
 * functional connection zones. The owner image remains visually unaltered.
 */
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ownerDashboardArtwork from "@assets/rentflo-owner-dashboard-corrected-reference.jpeg";
import { useSidebar } from "@/contexts/SidebarContext";
import type { Agreement, User } from "@shared/schema";

function OwnerConnectionZone({ children, label, className }: { children: React.ReactNode; label: string; className: string }) {
  return <div className={`absolute z-20 ${className}`} aria-label={label}>{children}</div>;
}

export default function OwnerImageDashboard() {
  const { toggle } = useSidebar();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ agreement: Agreement | null }>({ queryKey: ["/api/agreements/mine"] });
  const completeKyc = Boolean(currentUser?.isVerified);
  const agreementSigned = agreementData?.agreement?.status === "FULLY_SIGNED" || agreementData?.agreement?.status === "OWNER_SIGNED";

  return (
    <main className="dashboard-owner bg-[#020812] text-white">
      <div className="mx-auto w-full max-w-[640px] px-0 sm:px-5 sm:py-5">
        <section className="relative aspect-[822/1735] w-full overflow-hidden sm:rounded-[30px] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]" aria-label="RentFLO owner dashboard">
          <img src={ownerDashboardArtwork} alt="RentFLO owner dashboard" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
          {completeKyc && <span data-testid="owner-kyc-complete" className="pointer-events-none absolute left-[16.8%] top-[12.8%] z-30 flex h-[2.8%] w-[5.8%] items-center justify-center rounded-full border border-white/80 bg-emerald-500 text-[clamp(9px,2.4vw,15px)] font-black leading-none text-white shadow-[0_0_14px_rgba(16,185,129,0.9)]" aria-label="KYC completed">✓</span>}
          {completeKyc && !agreementSigned && <span data-testid="owner-agreement-next" className="pointer-events-none absolute left-[29.6%] top-[10.8%] z-10 h-[7.6%] w-[25%] rounded-2xl border-2 border-violet-300/90 bg-violet-400/[0.14] shadow-[inset_0_0_24px_rgba(196,181,253,0.33),0_0_18px_rgba(139,92,246,0.62)]" aria-label="Sign Agreement is the next required step" />}

          <OwnerConnectionZone label="Open owner navigation" className="left-[5.5%] top-[2.1%] h-[4.3%] w-[11.2%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner navigation" onClick={toggle} /></OwnerConnectionZone>
          <OwnerConnectionZone label="View owner notifications" className="left-[76.1%] top-[2.1%] h-[4.3%] w-[11.2%]"><Link href="/notifications" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View owner notifications" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Complete owner KYC" className="left-[5.5%] top-[11.1%] h-[7%] w-[22%]"><Link href="/verify" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Complete owner KYC verification" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Sign owner agreement" className="left-[30%] top-[11.1%] h-[7%] w-[24%]"><Link href="/agreement" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Sign owner rental agreement" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Review rent collection" className="left-[56.5%] top-[11.1%] h-[7%] w-[27%]"><Link href="/ledger" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Review rent collection" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Open upcoming payout details" className="left-[5.5%] top-[37.5%] h-[14%] w-[78.5%]"><Link href="/ledger" className="block h-full w-full rounded-[26px] focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open upcoming payout details" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View all owner collection details" className="left-[76.5%] top-[52%] h-[3.5%] w-[14%]"><Link href="/ledger" className="block h-full w-full rounded-lg focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View all owner collection details" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View active tenants" className="left-[5.5%] top-[54.2%] h-[10%] w-[23%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View active tenants in ledger" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View rent collected this month" className="left-[31.5%] top-[54.2%] h-[10%] w-[23%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View monthly rent collection" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View total rent collected" className="left-[57.3%] top-[54.2%] h-[10%] w-[25.5%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View total rent collection" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Owner home" className="left-[5.2%] top-[90%] h-[9.7%] w-[15.5%]"><Link href="/owner" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Owner home" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner ledger" className="left-[21.8%] top-[90%] h-[9.7%] w-[15.5%]"><Link href="/ledger" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner ledger" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open repairs" className="left-[38.2%] top-[90%] h-[9.7%] w-[15.5%]"><Link href="/maintenance" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open repairs" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner messages" className="left-[54.7%] top-[90%] h-[9.7%] w-[15.5%]"><Link href="/messages" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner messages" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner profile" className="left-[71.2%] top-[90%] h-[9.7%] w-[15.5%]"><Link href="/profile" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner profile" /></OwnerConnectionZone>

        </section>
      </div>
    </main>
  );
}
