/**
 * Design: exact supplied tenant dashboard artwork, with accessible interaction
 * zones, including its embedded bottom navigation. The image remains unaltered.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLedgers } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/SidebarContext";
import { PayRentButton } from "@/components/PayRentButton";
import { LegalFooter } from "@/components/LegalFooter";
import type { Agreement, User } from "@shared/schema";
import tenantDashboardArtwork from "@assets/rentflo-tenant-dashboard-embedded-nav-reference.png";

const RENTFLO_VPA = "8891266898-3@ybl";
type AmountChoice = "full" | "half" | "custom" | "other";
type PaymentMethod = "apple" | "upi" | "phonepe" | "gpay" | "paytm";

function ConnectionZone({ children, label, className }: { children: React.ReactNode; label: string; className: string }) {
  return <div className={`absolute z-20 ${className}`} aria-label={label}>{children}</div>;
}

export default function TenantDashboard() {
  const { data: ledgers } = useLedgers();
  const { user } = useAuth();
  const { toggle } = useSidebar();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ agreement: Agreement | null }>({ queryKey: ["/api/agreements/mine"] });
  const [amountChoice, setAmountChoice] = useState<AmountChoice>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("phonepe");
  const [otherAmount, setOtherAmount] = useState("");
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
      <section className="relative aspect-[853/1844] w-full overflow-hidden sm:rounded-[30px] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]" aria-label={`RentFLO tenant payment dashboard for ${tenantName}`}>
        <img src={tenantDashboardArtwork} alt="RentFLO tenant payment dashboard" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
        {completeKyc && <span data-testid="tenant-kyc-complete" className="pointer-events-none absolute left-[19.7%] top-[9.9%] z-30 flex h-[2.8%] w-[5.8%] items-center justify-center rounded-full border border-white/80 bg-emerald-500 text-[clamp(9px,2.4vw,15px)] font-black leading-none text-white shadow-[0_0_14px_rgba(16,185,129,0.9)]" aria-label="KYC completed">✓</span>}
        {completeKyc && !agreementSigned && <span data-testid="tenant-agreement-next" className="pointer-events-none absolute left-[29.2%] top-[6.5%] z-10 h-[8.6%] w-[25.6%] rounded-2xl border-2 border-violet-300/90 bg-violet-400/[0.14] shadow-[inset_0_0_24px_rgba(196,181,253,0.33),0_0_18px_rgba(139,92,246,0.62)]" aria-label="Sign Agreement is the next required step" />}
        <ConnectionZone label="Open navigation" className="left-[4%] top-[1.1%] h-[4.4%] w-[10%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open navigation" onClick={toggle} /></ConnectionZone>
        <ConnectionZone label="View notifications" className="right-[4.6%] top-[1.1%] h-[4.4%] w-[9.5%]"><Link href="/notifications" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View notifications" /></ConnectionZone>
        <ConnectionZone label="KYC verification" className="left-[7%] top-[6.8%] h-[8%] w-[21%]"><Link href="/verify" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={completeKyc ? "Review completed KYC verification" : "Complete KYC verification"} /></ConnectionZone>
        <ConnectionZone label="Agreement signing" className="left-[29.5%] top-[6.8%] h-[8%] w-[25%]"><Link href="/agreement" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={agreementSigned ? "Review signed agreement" : "Sign rental agreement"} /></ConnectionZone>
        <ConnectionZone label="Pay rent stage" className="left-[56%] top-[6.8%] h-[8%] w-[25%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Go to rent payment" onClick={() => document.getElementById("tenant-payment-action")?.focus()} /></ConnectionZone>
        <ConnectionZone label="Choose full rent amount" className="left-[8.7%] top-[69.2%] h-[6.4%] w-[19.8%]"><button type="button" aria-pressed={amountChoice === "full"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose full rent amount: ₹${remaining.toLocaleString("en-IN")}`} onClick={() => setAmountChoice("full")} /></ConnectionZone>
        <ConnectionZone label="Choose half rent amount" className="left-[29.8%] top-[69.2%] h-[6.4%] w-[19.8%]"><button type="button" aria-pressed={amountChoice === "half"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose half rent amount: ₹${Math.round(remaining / 2).toLocaleString("en-IN")}`} onClick={() => setAmountChoice("half")} /></ConnectionZone>
        <ConnectionZone label="Choose custom rent amount" className="left-[50.9%] top-[69.2%] h-[6.4%] w-[19.8%]"><button type="button" aria-pressed={amountChoice === "custom"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose custom rent amount: ₹${Math.min(10000, remaining).toLocaleString("en-IN")}`} onClick={() => setAmountChoice("custom")} /></ConnectionZone>
        <ConnectionZone label="Choose other rent amount" className="left-[71.9%] top-[69.2%] h-[6.4%] w-[19.8%]"><button type="button" aria-pressed={amountChoice === "other"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose another rent amount" onClick={() => setAmountChoice("other")} /></ConnectionZone>
        {(["full", "half", "custom", "other"] as AmountChoice[]).map((choice, index) => amountChoice === choice && <span key={choice} data-testid="amount-selector" className={`pointer-events-none absolute z-10 top-[69%] h-[6.8%] rounded-xl border-2 border-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.75)] ${["left-[8.5%] w-[20.2%]", "left-[29.6%] w-[20.2%]", "left-[50.7%] w-[20.2%]", "left-[71.7%] w-[20.2%]"][index]}`} aria-hidden />)}
        {amountChoice === "other" && <form className="absolute left-[8%] top-[62.4%] z-30 flex w-[72%] items-center gap-2 rounded-xl border border-violet-300/70 bg-[#071a33]/95 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.42)]" onSubmit={(event) => { event.preventDefault(); document.getElementById("tenant-payment-action")?.focus(); }}><label htmlFor="other-amount" className="sr-only">Other payment amount</label><input id="other-amount" autoFocus inputMode="numeric" type="number" min="1" max={remaining} value={otherAmount} onChange={(event) => setOtherAmount(event.target.value)} placeholder={`Enter amount up to ₹${remaining.toLocaleString("en-IN")}`} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-400" /><button type="submit" className="rounded-md bg-violet-500 px-2 py-1 text-[10px] font-semibold text-white">Apply</button></form>}
        <ConnectionZone label="Choose Apple Pay" className="left-[7.5%] top-[77.2%] h-[5.5%] w-[12.9%]"><button type="button" aria-pressed={paymentMethod === "apple"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Apple Pay" onClick={() => setPaymentMethod("apple")} /></ConnectionZone>
        <ConnectionZone label="Choose UPI" className="left-[21.6%] top-[77.2%] h-[5.5%] w-[12.9%]"><button type="button" aria-pressed={paymentMethod === "upi"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose UPI" onClick={() => setPaymentMethod("upi")} /></ConnectionZone>
        <ConnectionZone label="Choose PhonePe" className="left-[35.9%] top-[77.2%] h-[5.5%] w-[12.9%]"><button type="button" aria-pressed={paymentMethod === "phonepe"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose PhonePe" onClick={() => setPaymentMethod("phonepe")} /></ConnectionZone>
        <ConnectionZone label="Choose Google Pay" className="left-[49.9%] top-[77.2%] h-[5.5%] w-[12.9%]"><button type="button" aria-pressed={paymentMethod === "gpay"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Google Pay" onClick={() => setPaymentMethod("gpay")} /></ConnectionZone>
        <ConnectionZone label="Choose Paytm" className="left-[64.1%] top-[77.2%] h-[5.5%] w-[12.9%]"><button type="button" aria-pressed={paymentMethod === "paytm"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Paytm" onClick={() => setPaymentMethod("paytm")} /></ConnectionZone>
        {(["apple", "upi", "phonepe", "gpay", "paytm"] as PaymentMethod[]).map((method, index) => paymentMethod === method && <span key={method} className={`pointer-events-none absolute z-30 top-[77.2%] h-[5.5%] w-[12.9%] rounded-xl bg-violet-400/[0.16] shadow-[inset_0_0_18px_rgba(196,181,253,0.48),0_0_18px_rgba(139,92,246,0.62)] ${["left-[7.5%]", "left-[21.6%]", "left-[35.9%]", "left-[49.9%]", "left-[64.1%]"][index]}`} aria-hidden><span className="absolute right-[8%] top-[8%] flex h-3 w-3 items-center justify-center rounded-full border border-white/80 bg-violet-600 text-[9px] font-black leading-none text-white shadow-[0_0_10px_rgba(196,181,253,1)]">✓</span><span className="absolute bottom-[8%] left-[20%] right-[20%] h-[3px] rounded-full bg-violet-100 shadow-[0_0_12px_rgba(196,181,253,1)]" /></span>)}
        <ConnectionZone label="Continue to secure rent payment" className="left-[7.5%] top-[84%] h-[4.8%] w-[69.6%]"><PayRentButton amount={selectedAmount} vpa={RENTFLO_VPA} ledgerId={unpaidLedger?.id} presentation="image-overlay" buttonLabel="Continue to secure rent payment" ariaLabel={`Continue to pay ₹${selectedAmount.toLocaleString("en-IN")}`} buttonClassName="focus-visible:ring-4" /></ConnectionZone>
        <ConnectionZone label="Home navigation" className="left-[7%] top-[79%] h-[15%] w-[13%]"><Link href="/tenant" className="block h-full w-full rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Home" /></ConnectionZone>
        <ConnectionZone label="Ledger navigation" className="left-[22%] top-[79%] h-[15%] w-[13%]"><Link href="/ledger" className="block h-full w-full rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open ledger" /></ConnectionZone>
        <ConnectionZone label="Repairs navigation" className="left-[37%] top-[79%] h-[15%] w-[13%]"><Link href="/maintenance" className="block h-full w-full rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open repairs" /></ConnectionZone>
        <ConnectionZone label="Messages navigation" className="left-[52%] top-[79%] h-[15%] w-[13%]"><Link href="/messages" className="block h-full w-full rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open messages" /></ConnectionZone>
        <ConnectionZone label="Profile navigation" className="left-[67%] top-[79%] h-[15%] w-[13%]"><Link href="/profile" className="block h-full w-full rounded-2xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open profile" /></ConnectionZone>
        <span className="sr-only">Current amount: ₹{selectedAmount.toLocaleString("en-IN")}. Selected payment method: {paymentMethod}.</span>
      </section>
      <LegalFooter embedded forceVisible />
    </div>
  </main>;
}
