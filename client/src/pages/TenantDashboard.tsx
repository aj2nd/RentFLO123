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
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast({ title: "Payment system unavailable", description: "Please try again later.", variant: "destructive" });
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [toast]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const elapsed = Math.min(1, y / 140);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      document.documentElement.style.setProperty("--dashboard-header-progress", eased.toString());
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerProgress = "var(--dashboard-header-progress, 0)";

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
        <div className="absolute top-[10%] left-[5%] w-[280px] h-[280px] rounded-full bg-[#6FFFE9]/[0.05] blur-[110px]" />
        <div className="absolute top-[50%] right-[10%] w-[320px] h-[320px] rounded-full bg-[#6FFFE9]/[0.045] blur-[120px]" />
        <div className="absolute bottom-[15%] left-[40%] w-[260px] h-[260px] rounded-full bg-white/[0.025] blur-[100px]" />
        <div className="absolute top-[30%] left-[55%] w-[280px] h-[280px] rounded-full bg-[#C0C0C0]/[0.025] blur-[110px]" />
        <div className="absolute bottom-[35%] left-[5%] w-[200px] h-[200px] rounded-full bg-[#C0C0C0]/[0.018] blur-[90px]" />
      </div>

      <div className="p-4 sm:p-6 md:p-10 pb-24 flex flex-col flex-1 max-w-4xl w-full mx-auto">
        <SetupProgress steps={[
          { label: "Verify Identity", done: !!isVerified, href: "/verify" },
          { label: "Sign Agreement", done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "TENANT_SIGNED", href: "/agreement" },
          { label: "Pay Rent", done: hasPendingKyc },
        ]} />

        <header
          className="mb-6"
          style={{
            position: "sticky",
            top: "env(safe-area-inset-top, 0px)",
            zIndex: 20,
            paddingTop: "0.75rem",
            paddingBottom: "0.5rem",
            backdropFilter: `blur(${8 + 12 * (1 - Number(headerProgress))}px) saturate(${120 + 60 * (1 - Number(headerProgress))}%)`,
            WebkitBackdropFilter: `blur(${8 + 12 * (1 - Number(headerProgress))}px) saturate(${120 + 60 * (1 - Number(headerProgress))}%)`,
            background: `rgba(0,0,0,${0.10 + 0.42 * Number(headerProgress)})`,
            borderBottom: `1px solid rgba(111,255,233,${0.06 + 0.18 * Number(headerProgress)})`,
            boxShadow: `0 12px 32px rgba(0,0,0,${0.06 + 0.16 * Number(headerProgress)}), inset 0 -1px 0 rgba(111,255,233,${0.02 + 0.08 * Number(headerProgress)})`,
            transition: "background 180ms linear, border-color 180ms linear, box-shadow 180ms linear, backdrop-filter 180ms linear, -webkit-backdrop-filter 180ms linear",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/25 bg-[#6FFFE9]/[0.06] backdrop-blur-sm mb-4">
            <span className="w-1.5 h-1.5 bg-[#6FFFE9] animate-pulse rounded-full" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#9DEFE4]">{t("tenant_secure_pay")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 silver-text glow-text">{t("tenant_title")}</h1>
          {property && (
            <p className="text-[#9DEFE4]/70 text-sm flex items-center gap-1.5">
              <MapPin size={12} className="text-[#6FFFE9]/60" />
              {property.address}
            </p>
          )}
        </header>

        {hasProperty ? (
          <>
            {/* existing content unchanged */}
          </>
        ) : null}
      </div>
    </div>
  );
}
