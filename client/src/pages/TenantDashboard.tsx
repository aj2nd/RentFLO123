/**
 * Design: Exact user-supplied RentFLO dashboard artwork with transparent,
 * accessible functional connection zones. The image remains visually unaltered.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLedgers } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { PayRentButton } from "@/components/PayRentButton";
import type { Agreement, User } from "@shared/schema";
import tenantDashboardArtwork from "@assets/rentflo-tenant-dashboard-reference.png";

const RENTFLO_VPA = "8891266898-3@ybl";

type AmountChoice = "full" | "half" | "custom" | "other";
type PaymentMethod = "apple" | "upi" | "phonepe" | "gpay" | "paytm";

function ConnectionZone({ children, label, className }: { children: React.ReactNode; label: string; className: string }) {
  return <div className={`absolute z-20 ${className}`} aria-label={label}>{children}</div>;
}

export default function TenantDashboard() {
  const { data: ledgers } = useLedgers();
  const { user } = useAuth();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ agreement: Agreement | null }>({ queryKey: ["/api/agreements/mine"] });
  const [amountChoice, setAmountChoice] = useState<AmountChoice>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("phonepe");
  const [message, setMessage] = useState("");
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

  const updateAmount = (choice: AmountChoice) => {
    setAmountChoice(choice);
    setMessage(`${choice === "full" ? "Full" : choice === "half" ? "Half" : choice === "custom" ? "Custom" : "Other"} payment amount selected.`);
  };
  const updateMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setMessage(`${method === "gpay" ? "Google Pay" : method === "phonepe" ? "PhonePe" : method === "apple" ? "Apple Pay" : method === "paytm" ? "Paytm" : "UPI"} selected.`);
  };
  const completeKyc = Boolean(currentUser?.isVerified);
  const agreementSigned = agreementData?.agreement?.status === "FULLY_SIGNED" || agreementData?.agreement?.status === "TENANT_SIGNED";
  const tenantName = user?.firstName || currentUser?.firstName || "Tenant";

  return (
    <main className="dashboard-tenant min-h-screen bg-[#061427] text-white">
      <div className="mx-auto w-full max-w-[640px] px-0 sm:px-5 sm:py-5">
        <section className="relative aspect-[2/3] w-full overflow-hidden sm:rounded-[30px] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]" aria-label={`RentFLO tenant payment dashboard for ${tenantName}`}>
          <img src={tenantDashboardArtwork} alt="RentFLO tenant payment dashboard" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" draggable={false} />

          <ConnectionZone label="Open navigation" className="left-[3.3%] top-[3.4%] h-[5%] w-[8.7%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open navigation" onClick={() => setMessage("Navigation menu opened.")} /></ConnectionZone>
          <ConnectionZone label="View notifications" className="right-[6.6%] top-[3.4%] h-[5%] w-[8.7%]"><Link href="/notifications" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="View notifications" /></ConnectionZone>

          <ConnectionZone label="KYC verification" className="left-[11%] top-[11.2%] h-[9.4%] w-[17.5%]"><Link href="/verify" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={completeKyc ? "Review completed KYC verification" : "Complete KYC verification"} /></ConnectionZone>
          <ConnectionZone label="Agreement signing" className="left-[40%] top-[11.2%] h-[9.4%] w-[20%]"><Link href="/agreement" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={agreementSigned ? "Review signed agreement" : "Sign rental agreement"} /></ConnectionZone>
          <ConnectionZone label="Pay rent stage" className="left-[68.8%] top-[11.2%] h-[9.4%] w-[18%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Go to rent payment" onClick={() => { document.getElementById("tenant-payment-action")?.focus(); setMessage("Choose an amount and payment method, then continue to pay."); }} /></ConnectionZone>

          <ConnectionZone label="Choose full rent amount" className="left-[12%] top-[64.4%] h-[7.4%] w-[18.2%]"><button type="button" aria-pressed={amountChoice === "full"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose full rent amount: ₹${remaining.toLocaleString("en-IN")}`} onClick={() => updateAmount("full")} /></ConnectionZone>
          <ConnectionZone label="Choose half rent amount" className="left-[31%] top-[64.4%] h-[7.4%] w-[18%]"><button type="button" aria-pressed={amountChoice === "half"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose half rent amount: ₹${Math.round(remaining / 2).toLocaleString("en-IN")}`} onClick={() => updateAmount("half")} /></ConnectionZone>
          <ConnectionZone label="Choose custom rent amount" className="left-[50%] top-[64.4%] h-[7.4%] w-[18%]"><button type="button" aria-pressed={amountChoice === "custom"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label={`Choose custom rent amount: ₹${Math.min(10000, remaining).toLocaleString("en-IN")}`} onClick={() => updateAmount("custom")} /></ConnectionZone>
          <ConnectionZone label="Choose other rent amount" className="left-[69.2%] top-[64.4%] h-[7.4%] w-[18%]"><button type="button" aria-pressed={amountChoice === "other"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose another rent amount" onClick={() => updateAmount("other")} /></ConnectionZone>

          {(["full", "half", "custom", "other"] as AmountChoice[]).map((choice, index) => amountChoice === choice && <span key={choice} className={`pointer-events-none absolute z-10 top-[64.25%] h-[7.7%] w-[18.4%] rounded-xl border-2 border-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.75)] ${["left-[11.8%]", "left-[30.8%]", "left-[49.8%]", "left-[69%]"][index]}`} aria-hidden />)}
          {amountChoice === "other" && <form className="absolute left-[11.8%] top-[58.6%] z-30 flex w-[76.5%] items-center gap-2 rounded-xl border border-violet-300/70 bg-[#071a33]/95 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.42)]" onSubmit={(event) => { event.preventDefault(); setMessage(`Other amount set to ₹${selectedAmount.toLocaleString("en-IN")}.`); }}><label htmlFor="other-amount" className="sr-only">Other payment amount</label><input id="other-amount" autoFocus inputMode="numeric" type="number" min="1" max={remaining} value={otherAmount} onChange={(event) => setOtherAmount(event.target.value)} placeholder={`Enter amount up to ₹${remaining.toLocaleString("en-IN")}`} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-400" /><button type="submit" className="rounded-md bg-violet-500 px-2 py-1 text-[10px] font-semibold text-white">Apply</button></form>}

          <ConnectionZone label="Choose Apple Pay" className="left-[12%] top-[75.9%] h-[7.4%] w-[14.3%]"><button type="button" aria-pressed={paymentMethod === "apple"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Apple Pay" onClick={() => updateMethod("apple")} /></ConnectionZone>
          <ConnectionZone label="Choose UPI" className="left-[27.5%] top-[75.9%] h-[7.4%] w-[14.3%]"><button type="button" aria-pressed={paymentMethod === "upi"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose UPI" onClick={() => updateMethod("upi")} /></ConnectionZone>
          <ConnectionZone label="Choose PhonePe" className="left-[43%] top-[75.9%] h-[7.4%] w-[14.3%]"><button type="button" aria-pressed={paymentMethod === "phonepe"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose PhonePe" onClick={() => updateMethod("phonepe")} /></ConnectionZone>
          <ConnectionZone label="Choose Google Pay" className="left-[58.5%] top-[75.9%] h-[7.4%] w-[14.3%]"><button type="button" aria-pressed={paymentMethod === "gpay"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Google Pay" onClick={() => updateMethod("gpay")} /></ConnectionZone>
          <ConnectionZone label="Choose Paytm" className="left-[74%] top-[75.9%] h-[7.4%] w-[14.3%]"><button type="button" aria-pressed={paymentMethod === "paytm"} className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Choose Paytm" onClick={() => updateMethod("paytm")} /></ConnectionZone>
          {(["apple", "upi", "phonepe", "gpay", "paytm"] as PaymentMethod[]).map((method, index) => paymentMethod === method && <span key={method} className={`pointer-events-none absolute z-10 top-[75.75%] h-[7.7%] w-[14.7%] rounded-xl border-2 border-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.7)] ${["left-[11.8%]", "left-[27.3%]", "left-[42.8%]", "left-[58.3%]", "left-[73.8%]"][index]}`} aria-hidden />)}

          <ConnectionZone label="Continue to secure rent payment" className="left-[12%] top-[84.4%] h-[5.8%] w-[75.8%]"><PayRentButton amount={selectedAmount} vpa={RENTFLO_VPA} ledgerId={unpaidLedger?.id} presentation="image-overlay" buttonLabel="Continue to secure rent payment" ariaLabel={`Continue to pay ₹${selectedAmount.toLocaleString("en-IN")}`} buttonClassName="focus-visible:ring-4" /></ConnectionZone>

          <ConnectionZone label="Home navigation" className="left-[7%] top-[92.5%] h-[6%] w-[16%]"><button type="button" className="h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Home" onClick={() => setMessage("You are on Home.")} /></ConnectionZone>
          <ConnectionZone label="Ledger navigation" className="left-[25%] top-[92.5%] h-[6%] w-[16%]"><Link href="/ledger" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open ledger" /></ConnectionZone>
          <ConnectionZone label="Repairs navigation" className="left-[43%] top-[92.5%] h-[6%] w-[16%]"><Link href="/maintenance" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open repairs" /></ConnectionZone>
          <ConnectionZone label="Messages navigation" className="left-[61%] top-[92.5%] h-[6%] w-[16%]"><Link href="/messages" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open messages" /></ConnectionZone>
          <ConnectionZone label="Profile navigation" className="left-[79%] top-[92.5%] h-[6%] w-[16%]"><Link href="/profile" className="block h-full w-full rounded-xl focus-visible:ring-2 focus-visible:ring-violet-300" aria-label="Open profile" /></ConnectionZone>

          {message && <p className="absolute left-1/2 top-[22%] z-30 w-[76%] -translate-x-1/2 rounded-lg border border-violet-200/35 bg-[#071a33]/85 px-3 py-2 text-center text-[10px] font-medium text-violet-50 shadow-lg backdrop-blur-sm" role="status" aria-live="polite">{message}</p>}
          <span className="sr-only">Current amount: ₹{selectedAmount.toLocaleString("en-IN")}. Selected payment method: {paymentMethod}.</span>
        </section>
      </div>
    </main>
  );
}
