import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import {
  TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle,
  Plus, BarChart2, ArrowUpRight, Building2, Loader2, ChevronRight,
  Activity, Home, Clock,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import type { User, Property, Agreement } from "@shared/schema";
import { SetupProgress } from "@/components/SetupProgress";

/* ─── Skeleton loader ─── */
function OwnerSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10 pb-24" data-testid="loader-owner">
      <div className="h-6 w-28 bg-zinc-900 animate-pulse mb-1" />
      <div className="h-10 w-56 bg-zinc-900 animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-900 animate-pulse" />)}
      </div>
      <div className="h-56 w-full bg-zinc-900 animate-pulse mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-900 animate-pulse" />)}
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  label, value, sub, accent, icon, testId,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon: React.ReactNode;
  testId?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      data-testid={testId}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "18px 18px 16px",
        background: hov
          ? "rgba(111,255,233,0.05)"
          : "var(--surface-card)",
        border: hov
          ? "1px solid rgba(111,255,233,0.28)"
          : "1px solid var(--border-subtle)",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov
          ? "0 0 24px rgba(111,255,233,0.08), 0 8px 32px rgba(0,0,0,0.25)"
          : "0 2px 12px rgba(0,0,0,0.18)",
        cursor: "default",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span style={{ color: "var(--nav-text-dim)", fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ color: accent ? "#6FFFE9" : "var(--nav-text-dim)", opacity: 0.7 }}>{icon}</span>
      </div>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "1.55rem",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: accent ? "#6FFFE9" : "var(--foreground)",
          marginBottom: 4,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: "var(--nav-text-dim)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}

/* ─── Status pill ─── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    SETTLED:  { label: "Settled",  color: "#6FFFE9",          bg: "rgba(111,255,233,0.10)" },
    EXPOSED:  { label: "Exposed",  color: "#f97316",          bg: "rgba(249,115,22,0.10)"  },
    ARREARS:  { label: "Arrears",  color: "rgba(255,255,255,0.40)", bg: "rgba(255,255,255,0.06)" },
  };
  const s = map[status] ?? { label: status, color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.05)" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
      padding: "3px 8px", color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? "rgba(9,9,11,0.96)" : "rgba(255,255,255,0.97)",
      border: isDark ? "1px solid rgba(111,255,233,0.25)" : "1px solid rgba(0,0,0,0.10)",
      padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      fontSize: 11,
    }}>
      <p style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.name === "Collected" ? "#6FFFE9" : (isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)"), marginBottom: 2 }}>
          <span style={{ fontWeight: 700 }}>₹{Number(p.value).toLocaleString()}</span>
          <span style={{ marginLeft: 6, opacity: 0.6 }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Property Card ─── */
function PropertyCard({ property }: { property: { id: string; address: string; payoutDay: number; monthlyRent: number } }) {
  const { data: ticketCounts } = useTicketCounts(property.id);
  const [hov, setHov] = useState(false);

  return (
    <div
      data-testid={`card-property-${property.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "20px 22px",
        background: hov ? "rgba(111,255,233,0.04)" : "var(--surface-card)",
        border: hov ? "1px solid rgba(111,255,233,0.30)" : "1px solid var(--border-subtle)",
        transition: "background 0.22s, border-color 0.22s, box-shadow 0.22s",
        boxShadow: hov ? "0 8px 32px rgba(0,0,0,0.28), 0 0 20px rgba(111,255,233,0.06)" : "0 2px 8px rgba(0,0,0,0.14)",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(111,255,233,0.08)", border: "1px solid rgba(111,255,233,0.18)", flexShrink: 0,
          }}>
            <Building2 size={16} style={{ color: "#6FFFE9" }} />
          </div>
          <div className="min-w-0">
            <h4 style={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 }} className="truncate">
              {property.address}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
              <span style={{ fontSize: 11, color: "var(--nav-text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} /> Due day {property.payoutDay}
              </span>
              <span style={{ fontSize: 11, color: "var(--nav-text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                <CreditCard size={10} /> ₹{property.monthlyRent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {/* Live dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginTop: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6FFFE9", boxShadow: "0 0 8px rgba(111,255,233,0.9)", display: "block", animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(111,255,233,0.60)" }}>LIVE</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 0 14px" }} />

      {/* Health row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" data-testid={`stat-open-tickets-${property.id}`}>
            <AlertCircle size={13} style={{ color: ticketCounts?.open ? "#f97316" : "var(--nav-text-dim)" }} />
            <span style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{ticketCounts?.open || 0}</span>
              <span style={{ color: "var(--nav-text-dim)", marginLeft: 4 }}>open</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5" data-testid={`stat-resolved-tickets-${property.id}`}>
            <CheckCircle size={13} style={{ color: "var(--nav-text-dim)" }} />
            <span style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{ticketCounts?.resolved || 0}</span>
              <span style={{ color: "var(--nav-text-dim)", marginLeft: 4 }}>resolved</span>
            </span>
          </div>
        </div>
        <Link href="/maintenance" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(111,255,233,0.65)", textDecoration: "none" }}>
          <Wrench size={11} /> Manage
        </Link>
      </div>
    </div>
  );
}

/* ─── Add Property Modal ─── */
interface AddPropertyFormData {
  address: string;
  monthlyRent: string;
  payoutDay: string;
  tenantEmail: string;
}

function AddPropertyModal({ isVerified }: { isVerified?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const createProperty = useCreateProperty();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddPropertyFormData>({
    defaultValues: { address: "", monthlyRent: "", payoutDay: "1", tenantEmail: "" },
  });

  const onSubmit = async (data: AddPropertyFormData) => {
    if (!user?.id) return;
    let tenantId: string | undefined;
    if (data.tenantEmail.trim()) {
      setIsLookingUpTenant(true);
      try {
        const res = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(data.tenantEmail)}`, { credentials: "include" });
        if (res.ok) {
          const tenantUser = await res.json();
          tenantId = tenantUser.id;
        } else {
          toast({ title: "Tenant not found", description: "No user with that email. Property will be created without a tenant." });
        }
      } catch {
        toast({ title: "Error", description: "Failed to look up tenant." });
      }
      setIsLookingUpTenant(false);
    }
    try {
      await createProperty.mutateAsync({
        address: data.address,
        monthlyRent: parseInt(data.monthlyRent),
        payoutDay: parseInt(data.payoutDay),
        ownerId: user.id,
        tenantId,
        pendingTenantEmail: !tenantId && data.tenantEmail.trim() ? data.tenantEmail.toLowerCase().trim() : undefined,
      });
      toast({ title: "Property Added", description: `${data.address} has been added to your portfolio.` });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add property", variant: "destructive" });
    }
  };

  if (!isVerified) {
    return (
      <button
        disabled
        title="Complete KYC verification to add properties"
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "0 16px",
          height: 40, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.28)", cursor: "not-allowed",
        }}
      >
        <Plus size={14} /> {t('owner_add_kyc_required')}
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="button-add-property"
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "0 16px",
            height: 40, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
            background: "#6FFFE9", border: "1px solid #6FFFE9", color: "#000",
            cursor: "pointer", transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Plus size={14} /> {t('owner_add_property')}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-black border border-[#6FFFE9]/30 rounded-none max-w-md p-0 overflow-hidden">
        {/* Modal top accent bar */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #6FFFE9, transparent)" }} />
        <div className="p-7">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
              {t('modal_add_property')}
            </DialogTitle>
            <p style={{ fontSize: 12, color: "var(--nav-text-dim)", marginTop: 4 }}>Add a new property to your portfolio</p>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--nav-text-dim)" }}>
                {t('setup_property_address')}
              </label>
              <Input
                {...register("address", { required: "Address is required" })}
                placeholder="123 Main Street, Apt 4B"
                className="bg-zinc-950 border border-zinc-800 focus:border-[#6FFFE9]/50 h-11 rounded-none text-sm"
                data-testid="input-property-address"
              />
              {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--nav-text-dim)" }}>
                  {t('modal_monthly_rent')} (₹)
                </label>
                <Input
                  type="number"
                  {...register("monthlyRent", { required: "Rent is required", min: { value: 1, message: "Must be positive" } })}
                  placeholder="25000"
                  className="bg-zinc-950 border border-zinc-800 focus:border-[#6FFFE9]/50 h-11 rounded-none text-sm"
                  data-testid="input-monthly-rent"
                />
                {errors.monthlyRent && <p className="text-xs text-red-400">{errors.monthlyRent.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--nav-text-dim)" }}>
                  {t('modal_payout_day')}
                </label>
                <Input
                  type="number"
                  {...register("payoutDay", { required: true, min: 1, max: 28 })}
                  placeholder="1"
                  className="bg-zinc-950 border border-zinc-800 focus:border-[#6FFFE9]/50 h-11 rounded-none text-sm"
                  data-testid="input-payout-day"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--nav-text-dim)" }}>
                {t('modal_tenant_email_optional')}
              </label>
              <Input
                type="email"
                {...register("tenantEmail")}
                placeholder="tenant@example.com"
                className="bg-zinc-950 border border-zinc-800 focus:border-[#6FFFE9]/50 h-11 rounded-none text-sm"
                data-testid="input-tenant-email"
              />
              <p style={{ fontSize: 11, color: "var(--nav-text-dim)" }}>{t('modal_tenant_email_hint')}</p>
            </div>
            <button
              type="submit"
              disabled={createProperty.isPending || isLookingUpTenant}
              data-testid="button-submit-property"
              style={{
                width: "100%", height: 48, background: "#6FFFE9", border: "none",
                color: "#000", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em",
                cursor: createProperty.isPending ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: createProperty.isPending ? 0.7 : 1, transition: "opacity 0.15s",
              }}
            >
              {createProperty.isPending || isLookingUpTenant
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : t('modal_submit_property')
              }
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ property: Property | null; agreement: Agreement | null }>({
    queryKey: ["/api/agreements/mine"],
  });
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (propsLoading || ledgersLoading) return <OwnerSkeleton />;

  /* ── Derived data ── */
  const isVerified = currentUser?.isVerified;
  const agreementStatus = agreementData?.agreement?.status ?? null;
  const ownerSteps = [
    { label: "Verify Identity", done: !!isVerified,                                                               href: "/verify"    },
    { label: "Sign Agreement",  done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "OWNER_SIGNED",   href: "/agreement" },
    { label: "Collect Rent",    done: !!(ledgers?.some(l => l.amountAdvanced > 0))                                                   },
  ];

  const latestPayment = ledgers
    ?.filter(l => l.amountAdvanced > 0)
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0];

  const totalAdvanced  = ledgers?.reduce((s, l) => s + l.amountAdvanced, 0)  ?? 0;
  const totalCollected = ledgers?.reduce((s, l) => s + l.amountCollected, 0) ?? 0;
  const totalExposure  = totalAdvanced - totalCollected;
  const collectionRate = totalAdvanced > 0 ? Math.round((totalCollected / totalAdvanced) * 100) : 0;

  /* Chart data — last 8 months */
  const chartData = ledgers
    ? ledgers
        .filter(l => l.amountAdvanced > 0 || l.amountCollected > 0)
        .slice(0, 8)
        .reverse()
        .map(l => {
          const [yr, mo] = l.monthYear.split("-");
          const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          return { month: label, Advanced: l.amountAdvanced, Collected: l.amountCollected, settled: l.status === "SETTLED" };
        })
    : [];

  const showChart = chartData.length >= 2;

  /* ─────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-4 sm:p-6 md:p-10 pb-24 max-w-[1280px] mx-auto">

        {/* Setup progress card */}
        <SetupProgress steps={ownerSteps} />

        {/* ── Sticky header ── */}
        <header
          className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 mb-8"
          style={{
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
            background: scrolled ? "var(--nav-bg)" : "transparent",
            borderBottom: scrolled ? "1px solid var(--nav-border)" : "1px solid transparent",
            boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.18)" : "none",
            transition: "all 0.3s ease",
            paddingTop: scrolled ? 10 : 4,
            paddingBottom: scrolled ? 10 : 0,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nav-text-dim)", marginBottom: 4 }}>
                OWNER PORTAL
              </p>
              <h1
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  fontSize: scrolled ? "1.1rem" : "2.2rem",
                  transition: "font-size 0.3s ease",
                }}
              >
                {t('owner_title')}
              </h1>
            </div>
            <AddPropertyModal isVerified={isVerified ?? undefined} />
          </div>
        </header>

        {/* ── Hero payout banner ── */}
        <div className="mb-8 relative overflow-hidden" style={{
          background: latestPayment
            ? "linear-gradient(135deg, rgba(111,255,233,0.07) 0%, rgba(111,255,233,0.02) 50%, rgba(0,0,0,0) 100%)"
            : "var(--surface-card)",
          border: latestPayment
            ? "1px solid rgba(111,255,233,0.28)"
            : "1px solid var(--border-subtle)",
          padding: "32px 32px 28px",
          boxShadow: latestPayment
            ? "0 0 60px rgba(111,255,233,0.07), 0 8px 40px rgba(0,0,0,0.28)"
            : "0 2px 12px rgba(0,0,0,0.18)",
        }}>
          {/* Ambient glow top-right */}
          {latestPayment && (
            <div style={{
              position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(111,255,233,0.10) 0%, transparent 65%)",
              pointerEvents: "none",
            }} />
          )}

          {latestPayment ? (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(111,255,233,0.65)", marginBottom: 10 }}>
                    LAST PAYOUT
                  </p>
                  <p
                    className="font-display"
                    data-testid="text-rent-credited"
                    style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.85)", marginBottom: 6 }}
                  >
                    {t('owner_rent_credited')}
                  </p>
                  <p
                    data-testid="text-last-payout"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      color: "#6FFFE9",
                    }}
                  >
                    ₹{latestPayment.amountAdvanced.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6FFFE9", display: "inline-block", boxShadow: "0 0 6px rgba(111,255,233,0.8)" }} />
                    <span style={{ fontSize: 12, color: "var(--nav-text-dim)" }}>
                      {t('owner_credited_on')} {new Date(latestPayment.updatedAt || latestPayment.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div style={{
                  background: "rgba(111,255,233,0.06)",
                  border: "1px solid rgba(111,255,233,0.20)",
                  padding: "12px 18px",
                  alignSelf: "flex-start",
                }}>
                  <StatusPill status={latestPayment.status} />
                  <p style={{ fontSize: 11, color: "var(--nav-text-dim)", marginTop: 8 }}>
                    Collected: <span style={{ color: "#6FFFE9", fontWeight: 700 }}>₹{latestPayment.amountCollected.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nav-text-dim)", marginBottom: 10 }}>
                PAYOUT STATUS
              </p>
              <h2
                className="font-display"
                style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.28)" }}
              >
                {t('owner_awaiting_payout')}
              </h2>
              <p style={{ fontSize: 12, color: "var(--nav-text-dim)", marginTop: 8 }}>
                Add a property and complete verification to start receiving payouts.
              </p>
            </div>
          )}
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard
            label="Total Advanced"
            value={`₹${totalAdvanced.toLocaleString()}`}
            sub="lifetime"
            icon={<ArrowUpRight size={14} />}
            testId="stat-total-advanced"
          />
          <KpiCard
            label="Collected"
            value={`₹${totalCollected.toLocaleString()}`}
            sub="from tenants"
            accent
            icon={<TrendingUp size={14} />}
            testId="stat-total-collected"
          />
          <KpiCard
            label="Net Exposure"
            value={`₹${totalExposure.toLocaleString()}`}
            sub="outstanding"
            icon={<Activity size={14} />}
          />
          <KpiCard
            label="Collection Rate"
            value={`${collectionRate}%`}
            sub={collectionRate >= 90 ? "Excellent" : collectionRate >= 70 ? "Good" : "Needs attention"}
            accent={collectionRate >= 90}
            icon={<BarChart2 size={14} />}
            testId="stat-collection-rate"
          />
        </div>

        {/* ── Analytics chart ── */}
        {showChart && (
          <div className="mb-8" style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          }}>
            {/* Chart header */}
            <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart2 size={16} style={{ color: "#6FFFE9" }} />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>Monthly Collection History</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, background: isDark ? "#27272a" : "#e5e7eb", display: "inline-block" }} />
                    <span style={{ fontSize: 10, color: "var(--nav-text-dim)", letterSpacing: "0.04em" }}>ADVANCED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, background: "#6FFFE9", display: "inline-block" }} />
                    <span style={{ fontSize: 10, color: "var(--nav-text-dim)", letterSpacing: "0.04em" }}>COLLECTED</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ padding: "20px 16px 16px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barGap={3} barCategoryGap="28%">
                  <XAxis
                    dataKey="month"
                    tick={{ fill: isDark ? "#52525b" : "#9ca3af", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: "rgba(111,255,233,0.04)" }} />
                  <Bar dataKey="Advanced" name="Advanced" radius={0}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={isDark ? "#1c1c1e" : "#e5e7eb"} />
                    ))}
                  </Bar>
                  <Bar dataKey="Collected" name="Collected" radius={0}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.settled ? "#6FFFE9" : "rgba(111,255,233,0.38)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 10, color: "var(--nav-text-dim)", textAlign: "right", marginTop: 4 }}>
                {ledgers?.filter(l => l.status === "SETTLED").length ?? 0} month(s) fully settled
              </p>
            </div>
          </div>
        )}

        {/* ── Two-column: Properties + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Properties */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="flex items-center gap-2.5">
                <Home size={16} style={{ color: "#6FFFE9" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t('owner_active_properties')}
                </h3>
                {properties && properties.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: "rgba(111,255,233,0.10)",
                    border: "1px solid rgba(111,255,233,0.20)", color: "#6FFFE9",
                    padding: "1px 7px",
                  }}>
                    {properties.length}
                  </span>
                )}
              </div>
              <AddPropertyModal isVerified={isVerified ?? undefined} />
            </div>

            <div className="space-y-3">
              {properties && properties.length > 0 ? (
                properties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))
              ) : (
                <div style={{
                  padding: "40px 24px", textAlign: "center",
                  background: "var(--surface-card)", border: "1px dashed rgba(255,255,255,0.10)",
                }}>
                  <Building2 size={28} style={{ color: "rgba(255,255,255,0.12)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 13, color: "var(--nav-text-dim)" }}>No properties yet</p>
                  <p style={{ fontSize: 11, color: "var(--nav-text-dim)", opacity: 0.6, marginTop: 4 }}>
                    Add your first property to get started
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="flex items-center gap-2.5">
                <Calendar size={16} style={{ color: "#6FFFE9" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t('owner_recent_activity')}
                </h3>
              </div>
              <Link
                href="/ledger"
                style={{ fontSize: 11, color: "rgba(111,255,233,0.60)", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{
              background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}>
              {ledgers && ledgers.length > 0 ? (
                ledgers.slice(0, 8).map((ledger, idx) => (
                  <div
                    key={ledger.id}
                    data-testid={`activity-${ledger.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px",
                      borderBottom: idx < Math.min(7, ledgers.length - 1) ? "1px solid var(--border-subtle)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(111,255,233,0.03)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status indicator */}
                      <div style={{
                        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: ledger.amountAdvanced > 0 ? "rgba(111,255,233,0.08)" : "rgba(255,255,255,0.04)",
                        border: ledger.amountAdvanced > 0 ? "1px solid rgba(111,255,233,0.18)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                        {ledger.amountAdvanced > 0
                          ? <ArrowUpRight size={12} style={{ color: "#6FFFE9" }} />
                          : <Clock size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
                        }
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                          {ledger.amountAdvanced > 0 ? t('owner_rent_advanced') : t('owner_pending_advance')}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--nav-text-dim)", marginTop: 1 }} className="truncate">
                          {ledger.property.address}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: ledger.amountAdvanced > 0 ? "var(--foreground)" : "var(--nav-text-dim)" }}>
                        ₹{ledger.amountAdvanced.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <StatusPill status={ledger.status} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--nav-text-dim)" }}>{t('owner_no_activity')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
