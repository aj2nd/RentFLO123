/**
 * Design: exact supplied owner dashboard artwork with transparent, accessible
 * functional connection zones. The owner image remains visually unaltered.
 */
import { useState } from "react";
import { Link } from "wouter";
import { BellRing, BookOpenText, FileSignature, Home, Menu, MessageSquare, ShieldCheck, UserRound, Wrench, X } from "lucide-react";
import ownerDashboardArtwork from "@assets/rentflo-owner-dashboard-reference.png";

function OwnerConnectionZone({ children, label, className }: { children: React.ReactNode; label: string; className: string }) {
  return <div className={`absolute z-20 ${className}`} aria-label={label}>{children}</div>;
}

export default function OwnerImageDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="dashboard-owner bg-[#020812] text-white">
      <div className="mx-auto w-full max-w-[640px] px-0 sm:px-5 sm:py-5">
        <section className="relative aspect-[853/1844] w-full overflow-hidden sm:rounded-[30px] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]" aria-label="RentFLO owner dashboard">
          <img src={ownerDashboardArtwork} alt="RentFLO owner dashboard" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" draggable={false} />

          <OwnerConnectionZone label="Open owner navigation" className="left-[7.2%] top-[5.5%] h-[4.4%] w-[11%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner navigation" onClick={() => setMenuOpen(true)} /></OwnerConnectionZone>
          <OwnerConnectionZone label="View owner notifications" className="left-[70.2%] top-[5.5%] h-[4.4%] w-[11%]"><Link href="/notifications" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View owner notifications" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Complete owner KYC" className="left-[8%] top-[14.1%] h-[7%] w-[18%]"><Link href="/verify" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Complete owner KYC verification" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Sign owner agreement" className="left-[29%] top-[14.1%] h-[7%] w-[23%]"><Link href="/agreement" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Sign owner rental agreement" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Review rent collection" className="left-[54%] top-[14.1%] h-[7%] w-[23%]"><Link href="/ledger" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Review rent collection" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Open upcoming payout details" className="left-[6.5%] top-[37.2%] h-[12.8%] w-[72.5%]"><Link href="/ledger" className="block h-full w-full rounded-[26px] focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open upcoming payout details" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View all owner collection details" className="left-[76%] top-[51.1%] h-[3.4%] w-[14%]"><Link href="/ledger" className="block h-full w-full rounded-lg focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View all owner collection details" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View active tenants" className="left-[6.4%] top-[53.3%] h-[8.8%] w-[22.8%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View active tenants in ledger" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View rent collected this month" className="left-[30.7%] top-[53.3%] h-[8.8%] w-[22.8%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View monthly rent collection" /></OwnerConnectionZone>
          <OwnerConnectionZone label="View total rent collected" className="left-[55%] top-[53.3%] h-[8.8%] w-[22.8%]"><Link href="/ledger" className="block h-full w-full rounded-3xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View total rent collection" /></OwnerConnectionZone>

          <OwnerConnectionZone label="Owner home" className="left-[5.1%] top-[77.2%] h-[5.8%] w-[16%]"><Link href="/owner" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Owner home" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner ledger" className="left-[21.5%] top-[77.2%] h-[5.8%] w-[16%]"><Link href="/ledger" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner ledger" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open repairs" className="left-[38%] top-[77.2%] h-[5.8%] w-[16%]"><Link href="/maintenance" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open repairs" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner messages" className="left-[54.5%] top-[77.2%] h-[5.8%] w-[16%]"><Link href="/messages" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner messages" /></OwnerConnectionZone>
          <OwnerConnectionZone label="Open owner profile" className="left-[71%] top-[77.2%] h-[5.8%] w-[16%]"><Link href="/profile" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open owner profile" /></OwnerConnectionZone>

          {menuOpen && <div className="absolute inset-0 z-40 bg-[#020815]/72 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Owner navigation menu">
            <div className="absolute left-0 top-0 h-full w-[78%] max-w-[420px] bg-[#0a1b31] px-[7%] py-[9%] shadow-[24px_0_56px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.22em] text-violet-300">RentFLO</p><h2 className="mt-1 text-xl font-semibold text-white">Owner menu</h2></div><button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/10" aria-label="Close menu"><X size={18} /></button></div>
              <nav className="mt-9 space-y-2" aria-label="Owner destinations">
                <Link href="/owner" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-100"><Home size={19} />Home</Link>
                <Link href="/ledger" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><BookOpenText size={19} />Ledger</Link>
                <Link href="/maintenance" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><Wrench size={19} />Repairs</Link>
                <Link href="/messages" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><MessageSquare size={19} />Messages</Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><BellRing size={19} />Notifications</Link>
                <Link href="/verify" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><ShieldCheck size={19} />KYC verification</Link>
                <Link href="/agreement" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><FileSignature size={19} />Agreement</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><UserRound size={19} />Profile</Link>
              </nav>
            </div>
            <button type="button" aria-label="Close menu" className="absolute right-0 top-0 h-full w-[22%]" onClick={() => setMenuOpen(false)} />
          </div>}
        </section>
      </div>
    </main>
  );
}
