/**
 * Design: Nightfall Waterfront Payment Journey.
 * A reference-led, mobile-first tenant payment cockpit: cinematic waterfront
 * atmosphere above a tightly sequenced, violet-accented payment surface.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Bell, CalendarDays, Check, CheckCircle2, ChevronRight, FilePenLine,
  Home, Landmark, LockKeyhole, Menu, PencilLine, ShieldCheck, WalletCards,
} from "lucide-react";
import { useLedgers } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { PayRentButton } from "@/components/PayRentButton";
import { Input } from "@/components/ui/input";
import type { Agreement, User } from "@shared/schema";

const RENTFLO_VPA = "8891266898-3@ybl";
const HERO_IMAGE = "/manus-storage/rentflo-waterfront-hero_7a749f94.jpg";

type PaymentMethod = "apple" | "upi" | "phonepe" | "gpay" | "paytm";
type AmountChoice = "full" | "half" | "custom" | "other";

function PaymentMethodTile({
  id, label, detail, selected, onClick, children,
}: {
  id: PaymentMethod; label: string; detail: string; selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex h-[82px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl border bg-white px-1 text-slate-900 transition-all duration-150 active:scale-[0.97] ${selected ? "border-violet-500 ring-2 ring-violet-500/55 shadow-[0_6px_16px_rgba(124,58,237,0.26)]" : "border-slate-200 hover:border-violet-200"}`}
      data-testid={`payment-method-${id}`}
    >
      <span className="mb-1 flex h-7 items-center justify-center text-[17px] font-bold leading-none">{children}</span>
      <span className="truncate text-[10px] font-semibold leading-none">{label}</span>
      <span className="mt-1 truncate text-[8px] text-slate-500">{detail}</span>
      {selected && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white"><Check size={10} strokeWidth={3} /></span>}
    </button>
  );
}

function AmountChoiceTile({
  id, title, caption, selected, onClick, icon,
}: {
  id: AmountChoice; title: string; caption: string; selected: boolean; onClick: () => void; icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-[106px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl border px-2 text-center transition-all duration-150 active:scale-[0.98] ${selected ? "border-violet-500 bg-violet-500/[0.11] text-white ring-2 ring-violet-500/45" : "border-white/[0.07] bg-[#172b44]/75 text-slate-100 hover:border-violet-400/35 hover:bg-[#1d3450]"}`}
      data-testid={`amount-choice-${id}`}
    >
      {icon && <span className="mb-1 text-violet-300">{icon}</span>}
      <span className="text-[16px] font-bold leading-tight tracking-tight sm:text-[18px]">{title}</span>
      <span className="mt-2 text-[9px] font-medium leading-tight text-slate-300">{caption}</span>
      {selected && <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white"><Check size={12} strokeWidth={3} /></span>}
    </button>
  );
}

export default function TenantDashboard() {
  const { data: ledgers, isLoading } = useLedgers();
  const { user } = useAuth();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ agreement: Agreement | null }>({ queryKey: ["/api/agreements/mine"] });
  const [amountChoice, setAmountChoice] = useState<AmountChoice>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("phonepe");
  const [otherAmount, setOtherAmount] = useState("");

  const unpaidLedger = ledgers?.find((ledger) => ledger.amountCollected < ledger.property.monthlyRent);
  const property = unpaidLedger?.property ?? ledgers?.[0]?.property ?? null;
  const totalDue = property?.monthlyRent ?? 0;
  const paid = unpaidLedger?.amountCollected ?? 0;
  const remaining = Math.max(totalDue - paid, 0);
  const payoutDay = property?.payoutDay ?? 17;
  const hasFirstPayment = (ledgers ?? []).some((ledger) => ledger.amountCollected > 0);
  const agreementSigned = agreementData?.agreement?.status === "FULLY_SIGNED" || agreementData?.agreement?.status === "TENANT_SIGNED";
  const isVerified = Boolean(currentUser?.isVerified);

  const dueDate = useMemo(() => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), payoutDay);
    if (date < today) date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, [payoutDay]);

  const selectedAmount = useMemo(() => {
    if (amountChoice === "half") return Math.min(Math.round(remaining / 2), remaining);
    if (amountChoice === "custom") return Math.min(10000, remaining);
    if (amountChoice === "other") return Math.min(Math.max(Number(otherAmount) || 0, 0), remaining);
    return remaining;
  }, [amountChoice, otherAmount, remaining]);

  const formatted = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  const displayName = user?.firstName || currentUser?.firstName || "Tenant";

  return (
    <main className="dashboard-tenant min-h-screen bg-[#071527] font-sans text-white">
      <div className="relative mx-auto min-h-screen max-w-[480px] overflow-hidden bg-[#071527] shadow-[0_0_80px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-x-0 top-0 h-[810px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,18,38,0.78) 0%, rgba(5,18,38,0.24) 36%, rgba(5,18,38,0.08) 59%, #0b1a30 100%), url(${HERO_IMAGE})` }} aria-hidden />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[#06152a]/72 via-transparent to-transparent" aria-hidden />

        <div className="relative z-10 px-4 pb-8 pt-5 sm:px-6">
          <header className="flex items-center justify-between">
            <button type="button" aria-label="Open navigation" className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.075] text-white/90 backdrop-blur-md transition-colors hover:bg-white/[0.14]">
              <Menu size={27} strokeWidth={2.2} />
            </button>
            <div className="flex items-center gap-2.5" aria-label="RentFLO">
              <img src="/manus-storage/rentflo-orbit-home-mark_c4a2e574.png" alt="" className="h-8 w-8 object-contain" />
              <span className="text-[25px] font-semibold tracking-[0.23em] text-slate-100">RENTFLO</span>
            </div>
            <button type="button" aria-label="Notifications" className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.075] text-white/90 backdrop-blur-md transition-colors hover:bg-white/[0.14]">
              <Bell size={26} strokeWidth={1.8} />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#20354f] bg-amber-400" />
            </button>
          </header>

          <section className="mt-10" aria-label="Tenant onboarding status">
            <div className="flex items-start">
              <Link href="/verify" className="group flex w-[30%] flex-col items-center text-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold shadow-[0_0_15px_rgba(251,191,36,0.35)] ${isVerified ? "border-amber-200/55 bg-amber-400 text-[#30210b]" : "border-violet-300/45 bg-violet-600 text-white"}`}>{isVerified ? <Check size={20} /> : "1"}</span>
                <ShieldCheck className="mt-2 h-4 w-4 text-amber-200/65" />
                <span className="mt-1 text-[11px] font-semibold text-slate-100">KYC</span>
                <span className="mt-1 text-[9px] text-slate-300/72">Verify your identity</span>
              </Link>
              <div className="mt-5 h-[2px] flex-1 bg-gradient-to-r from-slate-300/90 to-violet-300/80" />
              <Link href="/agreement" className="group flex w-[34%] flex-col items-center text-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold shadow-[0_0_16px_rgba(124,58,237,0.32)] ${agreementSigned ? "border-violet-200/60 bg-violet-500 text-white" : "border-violet-300/50 bg-violet-600 text-white"}`}>{agreementSigned ? <Check size={20} /> : "2"}</span>
                <FilePenLine className="mt-2 h-4 w-4 text-violet-200/70" />
                <span className="mt-1 text-[11px] font-semibold text-slate-100">Sign Agreement</span>
                <span className="mt-1 text-[9px] text-slate-300/72">Review &amp; e-sign</span>
              </Link>
              <div className="mt-5 h-[2px] flex-1 bg-gradient-to-r from-violet-300/80 to-slate-400/45" />
              <button type="button" onClick={() => document.getElementById("pay-rent-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="group flex w-[30%] flex-col items-center text-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold shadow-[0_0_16px_rgba(124,58,237,0.32)] ${hasFirstPayment ? "border-violet-200/60 bg-violet-500 text-white" : "border-violet-300/50 bg-violet-600 text-white"}`}>{hasFirstPayment ? <Check size={20} /> : "3"}</span>
                <WalletCards className="mt-2 h-4 w-4 text-violet-200/70" />
                <span className="mt-1 text-[11px] font-semibold text-slate-100">Pay Rent</span>
                <span className="mt-1 text-[9px] text-slate-300/72">Make secure payment</span>
              </button>
            </div>
          </section>

          <section className="mt-24 min-h-[298px] pl-2 sm:mt-28" aria-labelledby="tenant-welcome">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">Good to see you, {displayName}</p>
            <h1 id="tenant-welcome" className="max-w-[280px] font-serif text-[55px] leading-[0.88] tracking-[-0.055em] text-[#132638] drop-shadow-[0_2px_12px_rgba(255,255,255,0.17)] sm:text-[63px]">
              Rent <em className="block font-serif font-normal text-[#6152bf]">without</em> the worry.
            </h1>
            <div className="mt-6 flex items-center gap-2" aria-hidden>
              <span className="h-[2px] w-16 bg-[#6954c7]/85" /><span className="h-2 w-2 rotate-45 bg-[#6954c7]" />
            </div>
          </section>

          <section id="pay-rent-panel" className="rounded-[27px] border border-white/[0.10] bg-[#11233a]/[0.94] px-4 py-5 shadow-[0_24px_60px_rgba(1,10,25,0.48)] backdrop-blur-xl sm:px-5" aria-labelledby="pay-rent-heading">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-[0_8px_20px_rgba(112,64,222,0.35)]"><WalletCards size={26} /></div>
              <div>
                <h2 id="pay-rent-heading" className="text-[24px] font-semibold tracking-tight">Pay rent</h2>
                <p className="mt-0.5 text-[11px] text-slate-300">Choose amount and pay from your preferred app.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1.1fr_.9fr] overflow-hidden rounded-xl border border-white/[0.06] bg-[#102138]/90">
              <div className="px-4 py-4">
                <p className="text-[10px] text-slate-300">Total monthly rent <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-400/60 text-[8px]">i</span></p>
                <p className="mt-1 font-mono text-[32px] font-medium tracking-[-0.07em] text-white">{isLoading ? "—" : formatted(totalDue)}</p>
                {paid > 0 && <p className="mt-1 text-[10px] text-violet-200">{formatted(paid)} already paid</p>}
              </div>
              <div className="border-l border-white/[0.07] px-4 py-4">
                <div className="flex items-center gap-2 text-slate-100"><CalendarDays size={23} strokeWidth={1.6} /><span className="text-[10px] font-medium text-slate-300">Due date</span></div>
                <p className="mt-2 text-[18px] font-semibold tracking-tight text-violet-300">{dueDate}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2.5 text-[11px] font-medium text-slate-200">Select amount to pay</p>
              <div className="flex gap-2">
                <AmountChoiceTile id="full" title={formatted(remaining)} caption="Full Amount" selected={amountChoice === "full"} onClick={() => setAmountChoice("full")} />
                <AmountChoiceTile id="half" title={formatted(Math.min(Math.round(remaining / 2), remaining))} caption="Half Amount" selected={amountChoice === "half"} onClick={() => setAmountChoice("half")} />
                <AmountChoiceTile id="custom" title={formatted(Math.min(10000, remaining))} caption="Custom Amount" selected={amountChoice === "custom"} onClick={() => setAmountChoice("custom")} />
                <AmountChoiceTile id="other" title="Other Amount" caption="Enter manually" icon={<PencilLine size={18} />} selected={amountChoice === "other"} onClick={() => setAmountChoice("other")} />
              </div>
              {amountChoice === "other" && <div className="mt-3"><label htmlFor="other-amount" className="sr-only">Other payment amount</label><Input id="other-amount" inputMode="numeric" min="1" max={remaining} type="number" value={otherAmount} onChange={(event) => setOtherAmount(event.target.value)} placeholder={`Enter an amount up to ${formatted(remaining)}`} className="h-11 border-violet-400/30 bg-[#0c1a2e] font-mono text-white placeholder:text-slate-500 focus-visible:ring-violet-400" /></div>}
            </div>

            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between"><p className="text-[11px] font-medium text-slate-200">Choose payment method</p><button type="button" className="flex items-center text-[10px] font-semibold text-violet-300">View all <ChevronRight size={13} /></button></div>
              <div className="flex gap-2">
                <PaymentMethodTile id="apple" label="Apple Pay" detail="Apple Pay" selected={paymentMethod === "apple"} onClick={() => setPaymentMethod("apple")}><span className="text-[28px] leading-none">●</span></PaymentMethodTile>
                <PaymentMethodTile id="upi" label="UPI" detail="UPI" selected={paymentMethod === "upi"} onClick={() => setPaymentMethod("upi")}><span className="italic tracking-[-0.2em]">UPI</span></PaymentMethodTile>
                <PaymentMethodTile id="phonepe" label="PhonePe" detail="PhonePe" selected={paymentMethod === "phonepe"} onClick={() => setPaymentMethod("phonepe")}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6040b7] text-[18px] text-white">पे</span></PaymentMethodTile>
                <PaymentMethodTile id="gpay" label="G Pay" detail="Google Pay" selected={paymentMethod === "gpay"} onClick={() => setPaymentMethod("gpay")}><span className="font-black"><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]"> </span></span></PaymentMethodTile>
                <PaymentMethodTile id="paytm" label="paytm" detail="Paytm" selected={paymentMethod === "paytm"} onClick={() => setPaymentMethod("paytm")}><span className="text-[#164d91]">paytm</span></PaymentMethodTile>
              </div>
            </div>

            {remaining > 0 ? (
              <div className="mt-4">
                <PayRentButton amount={selectedAmount} vpa={RENTFLO_VPA} ledgerId={unpaidLedger?.id} presentation="dashboard" buttonLabel={`Continue to Pay${selectedAmount ? ` ${formatted(selectedAmount)}` : ""}`} />
              </div>
            ) : (
              <div className="mt-4 flex h-[68px] items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.10] text-sm font-semibold text-emerald-200"><CheckCircle2 size={18} />This month&apos;s rent is settled</div>
            )}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><LockKeyhole size={11} />Payments are encrypted and securely processed</p>
          </section>

          {property && <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-300/70"><Home size={11} />{property.address}<Landmark size={11} className="ml-1" /></p>}
        </div>
      </div>
    </main>
  );
}
