/**
 * Design: exact supplied tenant dashboard artwork, with accessible interaction
 * zones and an in-flow functional navigation bar beneath the artwork.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Home, MessageSquare, UserRound, Wrench, X } from "lucide-react";
import { useLedgers } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { PayRentButton } from "@/components/PayRentButton";
import { LegalFooter } from "@/components/LegalFooter";
import type { Agreement, User } from "@shared/schema";
import tenantDashboardArtwork from "@assets/rentflo-tenant-dashboard-updated-reference.jpeg";

const RENTFLO_VPA = "8891266898-3@ybl";
type AmountChoice = "full" | "half" | "custom" | "other";
type PaymentMethod = "apple" | "upi" | "phonepe" | "gpay" | "paytm";

function ConnectionZone({ children, label, className }: { children: React.ReactNode; label: string; className: string }) {
  return <div className={`absolute z-20 ${className}`} aria-label={label}>{children}</div>;
}

function TenantHomeBottomNav() {
  const items = [
    { href: "/tenant", label: "Home", icon: <Home size={21} strokeWidth={1.8} />, active: true },
    { href: "/ledger", label: "Ledger", icon: <BookOpen size={21} strokeWidth={1.8} /> },
    { href: "/maintenance", label: "Repairs", icon: <Wrench size={21} strokeWidth={1.8} /> },
    { href: "/messages", label: "Messages", icon: <MessageSquare size={21} strokeWidth={1.8} /> },
    { href: "/profile", label: "Profile", icon: <UserRound size={21} strokeWidth={1.8} /> },
  ];

  return <nav className="bg-[#061427] px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3" aria-label="Tenant navigation">
    <div className="flex items-center justify-between rounded-[30px] border border-white/[0.15] bg-[#091b30]/80 px-2 py-2 shadow-[0_12px_26px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      {items.map((item) => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[9px] font-medium uppercase tracking-[0.06em] transition-colors ${item.active ? "text-violet-300" : "text-slate-300 hover:text-white"}`}>
        {item.icon}<span className="truncate">{item.label}</span>
      </Link>)}
    </div>
  </nav>;
}

export default function TenantDashboard() {
  const { data: ledgers } = useLedgers();
  const { user } = useAuth();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ agreement: Agreement | null }>({ queryKey: ["/api/agreements/mine"] });
  const [amountChoice, setAmountChoice] = useState<AmountChoice>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("phonepe");
  const [otherAmount, setOtherAmount] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const unpaidLedger = ledgers?.find((ledger) => ledger.amountCollected < ledger.property.monthlyRent);
  const property = unpaidLedger?.property ?? ledgers?.[0]?.property ?? null;
  const totalDue = property?.monthlyRent ?? 48500;
  const amountPaid = unpaidLedger?.amountCollected ?? 0;
  const remaining = Math.max(totalDue - amountPaid, 0);
  const selectedAmount = useMemo(() => {
    if (amountChoice === "half") return Math.min(Math.round(remaining / 2), remaining);
    if (amountChoice === "custom") return Math.min(10000, remaining);
    if (amountChoice === "other") return Math.min(Math.max(Number(otherAmount) || 0, 0), remaining);
    return remaining;
  }, [amountChoice, otherAmount, remaining]);
  const completeKyc = Boolean(currentUser?.isVerified);
  const agreementSigned = agreementData?.agreement?.status === "FULLY_SIGNED" || agreementData?.agreement?.status === "TENANT_SIGNED";
  const tenantName = user?.firstName || currentUser?.firstName || "Tenant";

  return <main className="dashboard-tenant bg-[#061427] text-white">
    <div className="mx-auto w-full max-w-[640px] px-0 sm:px-5 sm:py-5">
      <section className="relative aspect-[887/1748] w-full overflow-hidden sm:rounded-[30px] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]" aria-label={`RentFLO tenant payment dashboard for ${tenantName}`}>
        <img src={tenantDashboardArtwork} alt="RentFLO tenant payment dashboard" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
        <ConnectionZone label="Open navigation" className="left-[4.8%] top-[1.5%] h-[4.6%] w-[10%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open navigation" onClick={() => setMenuOpen(true)} /></ConnectionZone>
        <ConnectionZone label="View notifications" className="right-[4.5%] top-[1.5%] h-[4.6%] w-[10%]"><Link href="/notifications" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View notifications" /></ConnectionZone>
        <ConnectionZone label="KYC verification" className="left-[7.5%] top-[8%] h-[9.3%] w-[22%]"><Link href="/verify" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={completeKyc ? "Review completed KYC verification" : "Complete KYC verification"} /></ConnectionZone>
        <ConnectionZone label="Agreement signing" className="left-[34%] top-[8%] h-[9.3%] w-[23%]"><Link href="/agreement" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={agreementSigned ? "Review signed agreement" : "Sign rental agreement"} /></ConnectionZone>
        <ConnectionZone label="Pay rent stage" className="left-[61.5%] top-[8%] h-[9.3%] w-[25%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Go to rent payment" onClick={() => document.getElementById("tenant-payment-action")?.focus()} /></ConnectionZone>
        <ConnectionZone label="Choose full rent amount" className="left-[7.8%] top-[65.1%] h-[6.8%] w-[20.5%]"><button type="button" aria-pressed={amountChoice === "full"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose full rent amount: ₹${remaining.toLocaleString("en-IN")}`} onClick={() => setAmountChoice("full")} /></ConnectionZone>
        <ConnectionZone label="Choose half rent amount" className="left-[30%] top-[65.1%] h-[6.8%] w-[20%]"><button type="button" aria-pressed={amountChoice === "half"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose half rent amount: ₹${Math.round(remaining / 2).toLocaleString("en-IN")}`} onClick={() => setAmountChoice("half")} /></ConnectionZone>
        <ConnectionZone label="Choose custom rent amount" className="left-[52%] top-[65.1%] h-[6.8%] w-[20%]"><button type="button" aria-pressed={amountChoice === "custom"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose custom rent amount: ₹${Math.min(10000, remaining).toLocaleString("en-IN")}`} onClick={() => setAmountChoice("custom")} /></ConnectionZone>
        <ConnectionZone label="Choose other rent amount" className="left-[74.2%] top-[65.1%] h-[6.8%] w-[18%]"><button type="button" aria-pressed={amountChoice === "other"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose another rent amount" onClick={() => setAmountChoice("other")} /></ConnectionZone>
        {(["full", "half", "custom", "other"] as AmountChoice[]).map((choice, index) => amountChoice === choice && <span key={choice} className={`pointer-events-none absolute z-10 top-[64.9%] h-[7.2%] rounded-xl border-2 border-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.75)] ${["left-[7.6%] w-[20.9%]", "left-[29.8%] w-[20.4%]", "left-[51.8%] w-[20.4%]", "left-[74%] w-[18.4%]"][index]}`} aria-hidden />)}
        {amountChoice === "other" && <form className="absolute left-[8%] top-[60.8%] z-30 flex w-[76%] items-center gap-2 rounded-xl border border-violet-300/70 bg-[#071a33]/95 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.42)]" onSubmit={(event) => { event.preventDefault(); document.getElementById("tenant-payment-action")?.focus(); }}><label htmlFor="other-amount" className="sr-only">Other payment amount</label><input id="other-amount" autoFocus inputMode="numeric" type="number" min="1" max={remaining} value={otherAmount} onChange={(event) => setOtherAmount(event.target.value)} placeholder={`Enter amount up to ₹${remaining.toLocaleString("en-IN")}`} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-400" /><button type="submit" className="rounded-md bg-violet-500 px-2 py-1 text-[10px] font-semibold text-white">Apply</button></form>}
        <ConnectionZone label="Choose Apple Pay" className="left-[7.8%] top-[76%] h-[6.4%] w-[15.2%]"><button type="button" aria-pressed={paymentMethod === "apple"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Apple Pay" onClick={() => setPaymentMethod("apple")} /></ConnectionZone>
        <ConnectionZone label="Choose UPI" className="left-[25.2%] top-[76%] h-[6.4%] w-[15.2%]"><button type="button" aria-pressed={paymentMethod === "upi"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose UPI" onClick={() => setPaymentMethod("upi")} /></ConnectionZone>
        <ConnectionZone label="Choose PhonePe" className="left-[42.5%] top-[76%] h-[6.4%] w-[15.2%]"><button type="button" aria-pressed={paymentMethod === "phonepe"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose PhonePe" onClick={() => setPaymentMethod("phonepe")} /></ConnectionZone>
        <ConnectionZone label="Choose Google Pay" className="left-[59.8%] top-[76%] h-[6.4%] w-[15.2%]"><button type="button" aria-pressed={paymentMethod === "gpay"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Google Pay" onClick={() => setPaymentMethod("gpay")} /></ConnectionZone>
        <ConnectionZone label="Choose Paytm" className="left-[77.1%] top-[76%] h-[6.4%] w-[15.2%]"><button type="button" aria-pressed={paymentMethod === "paytm"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Paytm" onClick={() => setPaymentMethod("paytm")} /></ConnectionZone>
        {(["apple", "upi", "phonepe", "gpay", "paytm"] as PaymentMethod[]).map((method, index) => paymentMethod === method && <span key={method} className={`pointer-events-none absolute z-30 top-[76%] h-[6.4%] w-[15.2%] rounded-xl bg-violet-400/[0.16] shadow-[inset_0_0_18px_rgba(196,181,253,0.48),0_0_18px_rgba(139,92,246,0.62)] ${["left-[7.8%]", "left-[25.2%]", "left-[42.5%]", "left-[59.8%]", "left-[77.1%]"][index]}`} aria-hidden><span className="absolute right-[8%] top-[8%] flex h-3 w-3 items-center justify-center rounded-full border border-white/80 bg-violet-600 text-[9px] font-black leading-none text-white shadow-[0_0_10px_rgba(196,181,253,1)]">✓</span><span className="absolute bottom-[8%] left-[20%] right-[20%] h-[3px] rounded-full bg-violet-100 shadow-[0_0_12px_rgba(196,181,253,1)]" /></span>)}
        <ConnectionZone label="Continue to secure rent payment" className="left-[7.8%] top-[84%] h-[5.4%] w-[84%]"><PayRentButton amount={selectedAmount} vpa={RENTFLO_VPA} ledgerId={unpaidLedger?.id} presentation="image-overlay" buttonLabel="Continue to secure rent payment" ariaLabel={`Continue to pay ₹${selectedAmount.toLocaleString("en-IN")}`} buttonClassName="focus-visible:ring-4" /></ConnectionZone>
        <span className="sr-only">Current amount: ₹{selectedAmount.toLocaleString("en-IN")}. Selected payment method: {paymentMethod}.</span>
        {menuOpen && <div className="absolute inset-0 z-40 bg-[#020815]/72 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Tenant navigation menu"><div className="absolute left-0 top-0 h-full w-[78%] max-w-[420px] bg-[#0a1b31] px-[7%] py-[9%] shadow-[24px_0_56px_rgba(0,0,0,0.45)]"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.22em] text-violet-300">RentFLO</p><h2 className="mt-1 text-xl font-semibold text-white">Tenant menu</h2></div><button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/10" aria-label="Close menu"><X size={18} /></button></div><nav className="mt-9 space-y-2" aria-label="Tenant destinations"><Link href="/tenant" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-100"><Home size={19} />Home</Link><Link href="/ledger" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><BookOpen size={19} />Ledger</Link><Link href="/maintenance" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><Wrench size={19} />Repairs</Link><Link href="/messages" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><MessageSquare size={19} />Messages</Link><Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.07]"><UserRound size={19} />Profile</Link></nav></div><button type="button" aria-label="Close menu" className="absolute right-0 top-0 h-full w-[22%]" onClick={() => setMenuOpen(false)} /></div>}
      </section>
      <TenantHomeBottomNav />
      <LegalFooter embedded forceVisible />
    </div>
  </main>;
}
