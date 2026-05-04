import { useProperties } from "@/hooks/use-properties";
import { useLedgers, useCreatePartialPayment, usePaymentsByLedger, useTickets } from "@/hooks/use-ledgers";
import {
  Loader2, Home, ShieldCheck, Wrench, Upload,
  ToggleLeft, ToggleRight, Search, Building2,
  CalendarDays, CheckCircle2,
  AlertCircle, TrendingUp, ChevronRight, MapPin,
  Banknote, CircleDot, CheckCircle, Circle,
} from "lucide-react";
import { SetupProgress } from "@/components/SetupProgress";
import { ReceiptModal } from "@/components/ReceiptModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PayRentButton } from "@/components/PayRentButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import type { Property, User, Agreement } from "@shared/schema";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window { Razorpay: any; }
}

type Tab = "overview" | "payments" | "lease";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    SETTLED:  { label: "Settled",   classes: "bg-[#6FFFE9]/10 text-[#6FFFE9] border-[#6FFFE9]/25" },
    EXPOSED:  { label: "Exposed",   classes: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
    ARREARS:  { label: "Arrears",   classes: "bg-red-500/10 text-red-400 border-red-500/25" },
  };
  const s = map[status] ?? { label: status, classes: "bg-white/[0.06] text-zinc-400 border-white/[0.10]" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full backdrop-blur-sm ${s.classes}`}>
      {s.label}
    </span>
  );
}


export default function TenantDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();
  const { mutate: createPartialPayment, isPending: isCreatingPayment } = useCreatePartialPayment();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ property: Property | null; agreement: Agreement | null }>({
    queryKey: ["/api/agreements/mine"],
  });
  const { data: tickets } = useTickets();

  const isVerified = currentUser?.isVerified;
  const hasPendingKyc = currentUser?.panNumber && !isVerified;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showSuccess, setShowSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [flexiblePaymentEnabled, setFlexiblePaymentEnabled] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPhoto, setTicketPhoto] = useState<string>("");

  const [landlordEmail, setLandlordEmail] = useState("");
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [receiptData, setReceiptData] = useState<{
    amount: number; paymentId: string; orderId: string;
    date: Date; property: string; tenantName: string; monthYear?: string;
  } | null>(null);

  const unpaidLedger = ledgers?.find(l => l.amountCollected < l.property.monthlyRent);
  const property = unpaidLedger?.property ?? ledgers?.[0]?.property ?? null;

  const { data: paymentsData } = usePaymentsByLedger(unpaidLedger?.id ?? "");

  const openTickets = tickets?.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length ?? 0;

  const allLedgers = [...(ledgers ?? [])].sort((a, b) =>
    b.monthYear.localeCompare(a.monthYear)
  );

  const thisYear = new Date().getFullYear().toString();
  const totalPaidYTD = (ledgers ?? [])
    .filter(l => l.monthYear.startsWith(thisYear))
    .reduce((sum, l) => sum + l.amountCollected, 0);

  const settledMonths = (ledgers ?? []).filter(l => l.status === "SETTLED").length;

  const payoutDay = property?.payoutDay ?? 1;
  const now = new Date();
  let nextDue = new Date(now.getFullYear(), now.getMonth(), payoutDay);
  if (nextDue <= now) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, payoutDay);
  const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const totalDue = property?.monthlyRent ?? 0;
  const amountPaid = unpaidLedger?.amountCollected ?? 0;
  const remaining = totalDue - amountPaid;
  const progressPercent = totalDue > 0 ? Math.min(100, Math.round((amountPaid / totalDue) * 100)) : 0;

  const agreementStatus = agreementData?.agreement?.status ?? null;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch {} };
  }, []);

  useEffect(() => {
    if (!property) return;
    apiRequest("POST", "/api/notifications/rent-due-check", {}).catch(() => {});
  }, [property?.id]);

  const handlePartialPayment = () => {
    if (!unpaidLedger) return;
    if (!isVerified) {
      toast({ title: "KYC Required", description: "Please complete your KYC verification before making payments.", variant: "destructive" });
      return;
    }
    const amountToUse = flexiblePaymentEnabled ? paymentAmount : String(remaining);
    const amount = parseInt(amountToUse, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    createPartialPayment(
      { ledgerId: unpaidLedger.id, amount },
      {
        onSuccess: (orderData) => {
          if (!razorpayLoaded || !window.Razorpay) {
            toast({ title: "Payment Error", description: "Payment system not loaded. Please refresh.", variant: "destructive" });
            return;
          }
          const options = {
            key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
            name: "RentFLO", description: `Rent payment for ${property?.address}`,
            order_id: orderData.orderId,
            handler: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
              setShowSuccess(true); setPaymentAmount("");
              queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
              queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
              setReceiptData({
                amount: parseInt(amountToUse, 10),
                paymentId: response?.razorpay_payment_id ?? orderData.orderId,
                orderId: orderData.orderId,
                date: new Date(),
                property: property?.address ?? "Your Property",
                tenantName: currentUser?.fullLegalName ?? currentUser?.email ?? "Tenant",
                monthYear: unpaidLedger?.monthYear,
              });
              setTimeout(() => setShowSuccess(false), 3000);
            },
            prefill: { name: currentUser?.fullLegalName ?? "Tenant", email: currentUser?.email ?? "" },
            theme: { color: "#000000" },
          };
          new window.Razorpay(options).open();
        },
        onError: (error: any) => {
          toast({ title: "Payment Setup Failed", description: error.message ?? "Could not create payment order.", variant: "destructive" });
        },
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setTicketPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSearchProperties = async () => {
    if (!landlordEmail.trim()) {
      toast({ title: "Enter Email", description: "Please enter your landlord's email address.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/properties/by-owner-email?email=${encodeURIComponent(landlordEmail)}`, { credentials: "include" });
      if (res.ok) {
        const props = await res.json();
        const available = props.filter((p: Property) => !p.tenantId);
        setAvailableProperties(available);
        if (!available.length) toast({ title: "No Properties Found", description: "No available properties found for this landlord." });
      } else {
        toast({ title: "Error", description: "Failed to search properties.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to search properties.", variant: "destructive" });
    }
    setIsSearching(false);
  };

  const handleJoinProperty = async (propertyId: string) => {
    setIsJoining(true);
    try {
      const res = await apiRequest("POST", `/api/properties/${propertyId}/join`);
      if (res.ok) {
        toast({ title: "Success!", description: "You've been linked to this property." });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/mine"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
        setAvailableProperties([]); setLandlordEmail("");
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message ?? "Failed to join property.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to join property.", variant: "destructive" });
    }
    setIsJoining(false);
  };

  const handleSubmitTicket = () => {
    if (!property || !ticketTitle || !ticketDescription) {
      toast({ title: "Missing Info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    apiRequest("POST", "/api/tickets", {
      propertyId: property.id, tenantId: user?.id ?? "",
      title: ticketTitle, description: ticketDescription,
      ...(ticketPhoto ? { photoUrl: ticketPhoto } : {}),
    }).then(async (res) => {
      if (res.ok) {
        toast({ title: "Request Submitted", description: "Your maintenance request has been sent." });
        setShowMaintenanceForm(false); setTicketTitle(""); setTicketDescription(""); setTicketPhoto("");
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  if (propsLoading || ledgersLoading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6 md:p-10 pb-24 max-w-4xl mx-auto" data-testid="loader-tenant">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.04] animate-pulse rounded-2xl" />)}
        </div>
        <div className="flex gap-2 mb-6 p-1 bg-white/[0.04] rounded-full">
          {[1,2,3].map(i => <div key={i} className="h-8 flex-1 bg-white/[0.06] animate-pulse rounded-full" />)}
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-white/[0.04] animate-pulse rounded-3xl" />
          <div className="h-24 bg-white/[0.04] animate-pulse rounded-3xl" />
          <div className="h-24 bg-white/[0.04] animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  const hasProperty = !!property;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "lease", label: "Lease" },
  ];

  const hasFirstPayment = (ledgers ?? []).some(l => l.amountCollected > 0);
  const onboardingSteps = [
    { label: "Join a property", done: !!property },
    { label: "Complete KYC verification", done: !!isVerified },
    { label: "Sign the rental agreement", done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "TENANT_SIGNED" },
    { label: "Make your first payment", done: hasFirstPayment },
  ];
  const allOnboardingDone = onboardingSteps.every(s => s.done);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SuccessAnimation show={showSuccess} message="Payment Successful" />
      {receiptData && (
        <ReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />
      )}

      {/* ── Ambient colour blobs — give liquid glass something to refract ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
        <div className="absolute top-[10%] left-[15%] w-[420px] h-[420px] rounded-full bg-[#6FFFE9]/[0.07] blur-[140px]" />
        <div className="absolute top-[50%] right-[10%] w-[320px] h-[320px] rounded-full bg-[#6FFFE9]/[0.045] blur-[120px]" />
        <div className="absolute bottom-[15%] left-[40%] w-[260px] h-[260px] rounded-full bg-white/[0.025] blur-[100px]" />
        <div className="absolute top-[30%] left-[55%] w-[280px] h-[280px] rounded-full bg-[#C0C0C0]/[0.025] blur-[110px]" />
        <div className="absolute bottom-[35%] left-[5%] w-[200px] h-[200px] rounded-full bg-[#C0C0C0]/[0.018] blur-[90px]" />
      </div>

      <div className="p-4 sm:p-6 md:p-10 pb-24 flex flex-col flex-1 max-w-4xl w-full mx-auto">

        {/* ── 3-Step Progress Tracker ── */}
        <SetupProgress steps={[
          { label: "Verify Identity", done: !!isVerified,                                                                          href: "/verify"    },
          { label: "Sign Agreement",  done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "TENANT_SIGNED",             href: "/agreement" },
          { label: "Pay Rent",        done: hasFirstPayment                                                                                           },
        ]} />

        {/* ── Page Header ── */}
        <header
          className="mb-4 sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 pt-3 pb-2"
          style={{
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(8px) saturate(120%)",
            WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(8px) saturate(120%)",
            background: scrolled ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.35)",
            borderBottom: scrolled ? "1px solid rgba(111,255,233,0.14)" : "1px solid rgba(255,255,255,0.04)",
            boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.32)" : "none",
            transition: "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease",
            willChange: "backdrop-filter, background",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/25 bg-[#6FFFE9]/[0.06] backdrop-blur-sm mb-4">
            <span className="w-1.5 h-1.5 bg-[#6FFFE9] animate-pulse rounded-full" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#9DEFE4]">
              {t("tenant_secure_pay")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 silver-text glow-text">
            {t("tenant_title")}
          </h1>
          {property && (
            <p className="text-[#9DEFE4]/70 text-sm flex items-center gap-1.5">
              <MapPin size={12} className="text-[#6FFFE9]/60" />
              {property.address}
            </p>
          )}
        </header>

        {hasProperty ? (
          <>
            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="liquid-glass rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center" data-testid="stat-rent-due">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 border border-[#C0C0C0]/20 bg-[#C0C0C0]/[0.06] text-[#C0C0C0]">Monthly Rent</span>
                <span className="text-sm sm:text-base font-bold font-mono text-[#C0C0C0]">₹{totalDue.toLocaleString()}</span>
              </div>
              <div className="liquid-glass rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center" data-testid="stat-days-due">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 border backdrop-blur-sm ${
                  daysUntilDue <= 5
                    ? "bg-amber-500/10 text-amber-300 border-amber-400/25"
                    : "border-[#C0C0C0]/20 bg-[#C0C0C0]/[0.06] text-[#C0C0C0]"
                }`}>Due In</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${daysUntilDue <= 5 ? "text-amber-200" : "text-[#E8E8E8]"}`}>
                  {daysUntilDue}d
                </span>
              </div>
              <div className="liquid-glass rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center" data-testid="stat-paid-ytd">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 border border-[#6FFFE9]/25 bg-[#6FFFE9]/[0.07] text-[#9DEFE4]">Paid YTD</span>
                <span className="text-sm sm:text-base font-bold font-mono text-[#6FFFE9] glow-tiffany">₹{totalPaidYTD.toLocaleString()}</span>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex p-1 liquid-glass rounded-full mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-200
                    ${activeTab === tab.id
                      ? "bg-[#6FFFE9]/[0.13] text-[#6FFFE9] shadow-sm border border-[#6FFFE9]/[0.28]"
                      : "text-[#C0C0C0]/60 hover:text-[#C0C0C0] hover:bg-white/[0.05]"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ══ OVERVIEW TAB ══ */}
            {activeTab === "overview" && (
              <div className="space-y-6">

                {/* Onboarding Checklist */}
                {!allOnboardingDone && (
                  <div className="liquid-glass rounded-3xl p-5">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h3 className="font-semibold text-lg silver-text">Getting Started</h3>
                        <p className="text-xs text-[#C0C0C0]/50 mt-1">{onboardingSteps.filter(s => s.done).length} of {onboardingSteps.length} completed</p>
                      </div>
                      <div className="text-2xl font-bold text-[#6FFFE9]">
                        {Math.round((onboardingSteps.filter(s => s.done).length / onboardingSteps.length) * 100)}%
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-white/[0.07] rounded-full mb-5 overflow-hidden">
                      <div
                        className="h-full bg-[#6FFFE9] rounded-full transition-all duration-700"
                        style={{ width: `${(onboardingSteps.filter(s => s.done).length / onboardingSteps.length) * 100}%` }}
                      />
                    </div>
                    <div className="space-y-2.5">
                      {onboardingSteps.map((step, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                          step.done
                            ? "bg-white/[0.03] border-white/[0.06] opacity-55"
                            : "bg-[#6FFFE9]/[0.04] border-[#6FFFE9]/20"
                        }`}>
                          {step.done
                            ? <CheckCircle size={16} className="text-[#6FFFE9] shrink-0" />
                            : <Circle size={16} className="text-zinc-600 shrink-0" />}
                          <span className={`text-sm ${step.done ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Month Settlement */}
                <div className="liquid-glass-teal rounded-3xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="inline-block px-2.5 py-1 rounded-full bg-black/40 text-[10px] font-bold text-[#C0C0C0] uppercase tracking-wider mb-2 border border-[#C0C0C0]/[0.18]">Current Month</div>
                      <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter font-mono leading-none silver-text glow-text">
                        ₹{totalDue.toLocaleString()}
                      </h2>
                    </div>
                    {unpaidLedger && <StatusBadge status={unpaidLedger.status} />}
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#C0C0C0]/70">Settlement Progress</span>
                      <span className="text-[#6FFFE9]/80" data-testid="text-progress-percent">{progressPercent}% Settled</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6FFFE9] rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                        data-testid="progress-bar-settlement"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#C0C0C0]/50">
                      <span>Paid <span className="text-[#6FFFE9] font-mono" data-testid="text-amount-paid">₹{amountPaid.toLocaleString()}</span></span>
                      <span>Remaining <span className="text-[#C0C0C0] font-mono" data-testid="text-amount-remaining">₹{remaining.toLocaleString()}</span></span>
                    </div>
                  </div>

                  {remaining > 0 && (
                    <Button
                      onClick={() => setActiveTab("payments")}
                      className="w-full bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/85 font-bold text-sm h-12 rounded-full shadow-[0_4px_24px_rgba(111,255,233,0.30)]"
                      data-testid="button-pay-now-overview"
                    >
                      Pay Now — ₹{remaining.toLocaleString()}
                      <ChevronRight size={16} className="ml-1" strokeWidth={3} />
                    </Button>
                  )}
                  {remaining === 0 && (
                    <div className="flex items-center gap-2 text-[#6FFFE9] text-sm font-medium mt-2">
                      <CheckCircle2 size={16} />
                      This month is fully settled
                    </div>
                  )}
                </div>

                {/* Open Tickets Banner */}
                {openTickets > 0 && (
                  <Link href="/maintenance" className="block">
                    <div className="liquid-glass rounded-2xl flex items-center justify-between p-4 border-amber-400/20 hover:border-amber-400/35 transition-colors cursor-pointer" data-testid="banner-open-tickets"
                      style={{ borderTopColor: "rgba(251,191,36,0.30)", borderLeftColor: "rgba(251,191,36,0.16)" }}>
                      <div className="flex items-center gap-3">
                        <AlertCircle size={18} className="text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{openTickets} open maintenance {openTickets === 1 ? "request" : "requests"}</p>
                          <p className="text-xs text-zinc-500">Tap to view status</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </Link>
                )}

                {/* Recent Payments */}
                {paymentsData && paymentsData.filter(p => p.status === "SUCCESS").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50">Recent Payments</p>
                      <button onClick={() => setActiveTab("payments")} className="text-[10px] text-[#6FFFE9]/70 uppercase tracking-wider hover:text-[#6FFFE9] transition-colors">
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {paymentsData.filter(p => p.status === "SUCCESS").slice(0, 3).map((pmt) => (
                        <div key={pmt.id} className="liquid-glass rounded-xl flex items-center justify-between p-3" data-testid={`recent-payment-${pmt.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9]" />
                            <span className="text-xs text-zinc-400 font-mono">
                              {new Date(pmt.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-white">₹{pmt.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PAYMENTS TAB ══ */}
            {activeTab === "payments" && (
              <div className="space-y-6">

                {/* Pay Now Panel */}
                {remaining > 0 && (
                  <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{t("tenant_payment_heading")}</h3>
                        <p className="text-zinc-500 text-xs mt-0.5">{t("tenant_choose_method")}</p>
                      </div>
                      <button
                        onClick={() => setFlexiblePaymentEnabled(!flexiblePaymentEnabled)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-chip hover:bg-white/[0.10] transition-colors text-xs"
                        data-testid="toggle-flexible-payment"
                      >
                        {flexiblePaymentEnabled
                          ? <ToggleRight className="text-[#6FFFE9]" size={18} />
                          : <ToggleLeft className="text-zinc-400" size={18} />}
                        <span className="uppercase tracking-wider text-zinc-300">{flexiblePaymentEnabled ? t("tenant_flexible") : t("tenant_full_only")}</span>
                      </button>
                    </div>

                    {flexiblePaymentEnabled ? (
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 block">{t("tenant_amount_to_pay")}</label>
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={`Max ₹${remaining.toLocaleString()}`}
                          className="bg-white/[0.05] border-white/[0.12] text-white h-12 text-base font-mono placeholder:text-zinc-600 focus:border-[#6FFFE9]/40"
                          data-testid="input-payment-amount"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {[1000, 5000, 10000].map(preset => (
                            <Button key={preset} variant="outline" size="sm"
                              onClick={() => setPaymentAmount(String(Math.min(preset, remaining)))}
                              className="liquid-glass-chip border-white/[0.12] text-zinc-300 hover:bg-white/[0.08] hover:text-white text-xs rounded-full"
                              data-testid={`button-preset-${preset}`}>
                              ₹{preset.toLocaleString()}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm"
                            onClick={() => setPaymentAmount(String(remaining))}
                            className="liquid-glass-chip border-[#6FFFE9]/25 text-[#6FFFE9] hover:bg-[#6FFFE9]/10 text-xs rounded-full"
                            data-testid="button-preset-full">
                            Full ₹{remaining.toLocaleString()}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="liquid-glass-teal rounded-2xl p-4 text-center">
                        <p className="text-zinc-400 text-xs mb-1">{t("tenant_full_payment_amount")}</p>
                        <p className="text-3xl font-bold font-mono" data-testid="text-full-amount">
                          ₹{remaining.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <PayRentButton
                      amount={flexiblePaymentEnabled ? Number(paymentAmount || 0) : remaining}
                      vpa="YOUR_VPA@bank"
                    />

                    {/* UPI Deep Links */}
                    {(() => {
                      const upiAmount = flexiblePaymentEnabled ? Number(paymentAmount || 0) : remaining;
                      const upiNote = encodeURIComponent(`Rent for ${property?.address ?? ""}`);
                      const upiPayee = encodeURIComponent("RentFLO");
                      const upiVpa = encodeURIComponent("rentflo@ybl");
                      const upiLink = `upi://pay?pa=${upiVpa}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${upiNote}`;
                      if (upiAmount <= 0) return null;
                      return (
                        <div className="space-y-2">
                          <p className="text-[9px] uppercase tracking-widest text-zinc-600 text-center">Or pay directly via</p>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`gpay://upi/pay?pa=${upiVpa}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${upiNote}`}
                              className="liquid-glass rounded-xl flex items-center justify-center gap-2 p-2.5 hover:bg-white/[0.06] transition-colors text-xs text-zinc-300 font-medium"
                              data-testid="button-upi-gpay"
                            >
                              <span className="text-base">G</span>
                              <span>Pay via GPay</span>
                            </a>
                            <a
                              href={`phonepe://pay?pa=${upiVpa}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${upiNote}`}
                              className="liquid-glass rounded-xl flex items-center justify-center gap-2 p-2.5 hover:bg-white/[0.06] transition-colors text-xs text-zinc-300 font-medium"
                              data-testid="button-upi-phonepe"
                            >
                              <span className="text-base">₱</span>
                              <span>Pay via PhonePe</span>
                            </a>
                          </div>
                          <a
                            href={upiLink}
                            className="liquid-glass rounded-xl flex items-center justify-center gap-2 p-2.5 hover:bg-white/[0.06] transition-colors text-xs text-zinc-300 w-full"
                            data-testid="button-upi-any"
                          >
                            Any UPI App →
                          </a>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-center gap-2 text-zinc-600 text-[10px] uppercase tracking-wider">
                      <ShieldCheck size={12} />
                      <span>{t("tenant_bank_security")}</span>
                    </div>
                  </div>
                )}

                {/* Payment History — per transaction */}
                {paymentsData && paymentsData.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50 mb-3">{t("tenant_payment_history")}</p>
                    <div className="space-y-2">
                      {paymentsData.map((pmt, idx) => (
                        <div key={pmt.id} className="liquid-glass rounded-xl flex items-center justify-between p-4" data-testid={`payment-entry-${idx}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${pmt.status === "SUCCESS" ? "bg-[#6FFFE9]" : pmt.status === "PENDING" ? "bg-amber-400" : "bg-red-500"}`} />
                            <div>
                              <p className="text-sm text-white">
                                {pmt.status === "SUCCESS" ? "Payment Received" : pmt.status === "PENDING" ? "Pending" : "Failed"}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                {new Date(pmt.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base text-white">₹{pmt.amount.toLocaleString()}</span>
                            <p className={`text-[10px] ${pmt.status === "SUCCESS" ? "text-[#6FFFE9]" : pmt.status === "PENDING" ? "text-amber-400" : "text-red-400"}`}>
                              {pmt.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ledger History — all months */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-[#6FFFE9]/60" />
                    <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50">All Months</p>
                    <span className="ml-auto text-[10px] text-[#6FFFE9]/60 font-mono">{settledMonths} settled</span>
                  </div>
                  <div className="space-y-2">
                    {allLedgers.map(ledger => {
                      const [yr, mo] = ledger.monthYear.split("-");
                      const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                      const pct = ledger.property.monthlyRent > 0
                        ? Math.min(100, Math.round((ledger.amountCollected / ledger.property.monthlyRent) * 100))
                        : 0;
                      return (
                        <div key={ledger.id} className="liquid-glass rounded-xl p-4 space-y-2" data-testid={`ledger-row-${ledger.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CircleDot size={12} className="text-zinc-600" />
                              <span className="text-sm text-white">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-zinc-300">
                                ₹{ledger.amountCollected.toLocaleString()}
                                <span className="text-zinc-600"> / ₹{ledger.property.monthlyRent.toLocaleString()}</span>
                              </span>
                              <StatusBadge status={ledger.status} />
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6FFFE9]/70 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {allLedgers.length === 0 && (
                      <div className="text-center py-10 text-zinc-600 text-sm">No payment history yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ LEASE TAB ══ */}
            {activeTab === "lease" && (
              <div className="space-y-4">

                {/* Property Card */}
                <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4" data-testid="card-property-details">
                  <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50">Property Details</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-[#6FFFE9]/50 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#C0C0C0]/45 mb-0.5">Address</p>
                        <p className="text-sm text-[#E8E8E8] font-medium" data-testid="text-property-address">{property.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Banknote size={16} className="text-[#C0C0C0]/50 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#C0C0C0]/45 mb-0.5">Monthly Rent</p>
                        <p className="text-sm text-[#C0C0C0] font-mono" data-testid="text-monthly-rent">₹{property.monthlyRent.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays size={16} className="text-[#C0C0C0]/50 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#C0C0C0]/45 mb-0.5">Payment Due</p>
                        <p className="text-sm text-[#E8E8E8]" data-testid="text-payout-day">
                          {payoutDay === 1 ? "1st" : payoutDay === 2 ? "2nd" : payoutDay === 3 ? "3rd" : `${payoutDay}th`} of every month
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement Status */}
                <div className="liquid-glass rounded-3xl p-5 sm:p-6" data-testid="card-agreement-status">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50">Agreement Status</p>
                    {agreementStatus && <StatusBadge status={
                      agreementStatus === "FULLY_SIGNED" ? "SETTLED" :
                      agreementStatus === "PENDING" ? "ARREARS" : "EXPOSED"
                    } />}
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Agreement Created", done: !!agreementStatus },
                      { label: "Owner Signed", done: agreementStatus === "OWNER_SIGNED" || agreementStatus === "FULLY_SIGNED" },
                      { label: "Tenant Signed", done: agreementStatus === "TENANT_SIGNED" || agreementStatus === "FULLY_SIGNED" },
                      { label: "Fully Executed", done: agreementStatus === "FULLY_SIGNED" },
                    ].map(step => (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          step.done ? "border-[#6FFFE9]/50 bg-[#6FFFE9]/10" : "border-white/[0.12] bg-white/[0.03]"
                        }`}>
                          {step.done && <CheckCircle2 size={10} className="text-[#6FFFE9]" />}
                        </div>
                        <span className={`text-sm ${step.done ? "text-white" : "text-zinc-500"}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/agreement" className="block mt-4">
                    <Button variant="outline"
                      className="w-full liquid-glass-chip border-white/[0.12] text-white hover:bg-white/[0.08] text-xs h-9 rounded-xl"
                      data-testid="button-view-agreement">
                      View / Sign Agreement
                    </Button>
                  </Link>
                </div>

                {/* KYC Status */}
                <div className="liquid-glass rounded-3xl p-5 sm:p-6" data-testid="card-kyc-status">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/50 mb-1">KYC Verification</p>
                      <p className="text-sm text-white">
                        {isVerified ? "Identity Verified" : hasPendingKyc ? "Under Review" : "Not Submitted"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {isVerified ? "You're cleared to make payments." : "Required to process rent payments."}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      isVerified
                        ? "border-[#6FFFE9]/35 bg-[#6FFFE9]/08"
                        : hasPendingKyc
                        ? "border-amber-400/35 bg-amber-400/08"
                        : "border-white/[0.10] bg-white/[0.03]"
                    }`}>
                      <ShieldCheck size={18} className={
                        isVerified ? "text-[#6FFFE9]" : hasPendingKyc ? "text-amber-400" : "text-zinc-600"
                      } />
                    </div>
                  </div>
                  {!isVerified && (
                    <Link href="/verify" className="block mt-4">
                      <Button variant="outline"
                        className="w-full liquid-glass-chip border-white/[0.12] text-white hover:bg-white/[0.08] text-xs h-9 rounded-xl"
                        data-testid="button-kyc-lease">
                        <ShieldCheck size={14} className="mr-2" />
                        {hasPendingKyc ? "Check KYC Status" : "Complete KYC Now"}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Maintenance Summary */}
                <Link href="/maintenance" className="block">
                  <div className="liquid-glass rounded-2xl flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.03] transition-colors" data-testid="card-maintenance-summary">
                    <div className="flex items-center gap-3">
                      <Wrench size={16} className="text-zinc-500" />
                      <div>
                        <p className="text-sm text-white">Maintenance Requests</p>
                        <p className="text-xs text-zinc-500">
                          {tickets?.length
                            ? `${tickets.length} total · ${openTickets} open`
                            : "No requests yet"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-500" />
                  </div>
                </Link>
              </div>
            )}
          </>
        ) : (
          /* ── No Property: Join Flow ── */
          <div className="space-y-6">
            <div className="liquid-glass-teal rounded-3xl p-5 sm:p-8">
              <div className="flex items-start gap-3 mb-5">
                <Building2 size={22} className="text-[#6FFFE9] mt-0.5" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter">{t("tenant_join_home")}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{t("tenant_join_home_subtitle")}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="landlordEmail" className="text-zinc-400 uppercase text-[10px] tracking-wider">
                    {t("tenant_landlord_email")}
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      id="landlordEmail" type="email"
                      value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearchProperties()}
                      placeholder="landlord@example.com"
                      className="flex-1 bg-white/[0.05] border-white/[0.12] text-white placeholder:text-zinc-600 focus:border-[#6FFFE9]/40"
                      data-testid="input-landlord-email"
                    />
                    <Button onClick={handleSearchProperties} disabled={isSearching}
                      className="bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/85 rounded-full font-semibold"
                      data-testid="button-search-landlord">
                      {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                      <span className="ml-2">{t("tenant_search")}</span>
                    </Button>
                  </div>
                </div>
                {availableProperties.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">{t("tenant_available_properties")}</p>
                    {availableProperties.map(prop => (
                      <div key={prop.id} className="liquid-glass rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4" data-testid={`available-property-${prop.id}`}>
                        <div>
                          <p className="font-medium text-white text-sm">{prop.address}</p>
                          <p className="text-zinc-500 text-xs font-mono">₹{prop.monthlyRent.toLocaleString()} / month</p>
                        </div>
                        <Button onClick={() => handleJoinProperty(prop.id)} disabled={isJoining}
                          className="bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/85 text-xs h-8 px-4 rounded-full font-semibold"
                          data-testid={`button-join-${prop.id}`}>
                          {isJoining ? <Loader2 size={14} className="animate-spin" /> : null}
                          Join Property
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
