import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle, Plus, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import type { User, Property, Agreement } from "@shared/schema";
import { SetupProgress } from "@/components/SetupProgress";

export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ property: Property | null; agreement: Agreement | null }>({
    queryKey: ["/api/agreements/mine"],
  });
  const { t } = useI18n();

  const isVerified = currentUser?.isVerified;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (propsLoading || ledgersLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10 pb-24" data-testid="loader-owner">
        <div className="h-8 w-48 bg-zinc-900 animate-pulse mb-2" />
        <div className="h-4 w-32 bg-zinc-900/70 animate-pulse mb-8" />
        <div className="h-32 w-full bg-zinc-900 animate-pulse border border-[#6FFFE9]/10 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-900 animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    );
  }

  const latestPayment = ledgers
    ?.filter(l => l.amountAdvanced > 0)
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0];

  const agreementStatus = agreementData?.agreement?.status ?? null;
  const ownerSteps = [
    { label: "Verify Identity",  done: !!isVerified,                                                                href: "/verify"    },
    { label: "Sign Agreement",   done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "OWNER_SIGNED",   href: "/agreement" },
    { label: "Collect Rent",     done: !!latestPayment                                                                                 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="p-4 sm:p-6 md:p-10 pb-24 flex flex-col flex-1">

        <SetupProgress steps={ownerSteps} />

        <header
          className="mb-6 sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10"
          style={{
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(8px) saturate(120%)",
            WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(8px) saturate(120%)",
            background: scrolled ? "var(--nav-bg)" : "transparent",
            borderBottom: scrolled ? "1px solid var(--border-accent-dim)" : "1px solid transparent",
            boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.14)" : "none",
            transition: "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease",
            willChange: "backdrop-filter, background",
            paddingTop: scrolled ? "10px" : "12px",
            paddingBottom: scrolled ? "10px" : "8px",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1
                className="font-bold tracking-tighter"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: scrolled ? "1.1rem" : "2rem",
                  lineHeight: 1.15,
                  marginBottom: scrolled ? "0px" : "4px",
                  transition: "font-size 0.3s ease, margin-bottom 0.3s ease",
                }}
              >
                {t('owner_title')}
              </h1>
              <div
                style={{
                  overflow: "hidden",
                  maxHeight: scrolled ? "0px" : "28px",
                  opacity: scrolled ? 0 : 1,
                  transition: "max-height 0.3s ease, opacity 0.25s ease",
                }}
              >
                <p className="text-zinc-500 text-sm">{t('owner_subtitle')}</p>
              </div>
            </div>
            <AddPropertyModal isVerified={isVerified ?? undefined} />
          </div>
        </header>

        <div className="mb-10">
          {latestPayment ? (
            <div className="border-2 border-[#6FFFE9]/50 p-5 sm:p-8">
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-3"
                style={{ fontFamily: 'Georgia, Times, serif' }} data-testid="text-rent-credited">
                {t('owner_rent_credited')}
              </h2>
              <p className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white"
                style={{ fontFamily: 'Inter, sans-serif' }} data-testid="text-last-payout">
                ₹{latestPayment.amountAdvanced.toLocaleString()}
              </p>
              <p className="text-zinc-400 mt-3 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-[#6FFFE9] inline-block shrink-0"></span>
                {t('owner_credited_on')} {new Date(latestPayment.updatedAt || latestPayment.createdAt!).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="border-2 border-[#6FFFE9]/20 p-5 sm:p-8">
              <p className="text-zinc-500 text-sm mb-2 uppercase tracking-widest font-medium">{t('owner_payout_status')}</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-700"
                style={{ fontFamily: 'Georgia, Times, serif' }}>
                {t('owner_awaiting_payout')}
              </h2>
            </div>
          )}
        </div>

        {/* ── Analytics ── */}
        {ledgers && ledgers.length > 0 && (() => {
          const chartData = ledgers
            .filter(l => l.amountAdvanced > 0 || l.amountCollected > 0)
            .slice(0, 8)
            .reverse()
            .map(l => {
              const [yr, mo] = l.monthYear.split("-");
              const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
              return {
                month: label,
                advanced: l.amountAdvanced,
                collected: l.amountCollected,
                settled: l.status === "SETTLED",
              };
            });
          if (chartData.length < 2) return null;
          const totalAdvanced = ledgers.reduce((s, l) => s + l.amountAdvanced, 0);
          const totalCollected = ledgers.reduce((s, l) => s + l.amountCollected, 0);
          const collectionRate = totalAdvanced > 0 ? Math.round((totalCollected / totalAdvanced) * 100) : 0;
          const settledMonths = ledgers.filter(l => l.status === "SETTLED").length;
          return (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <BarChart2 className="text-[#6FFFE9]" size={20} />
                <h3 className="text-xl font-semibold tracking-tight">Analytics</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="border border-white/[0.06] bg-zinc-950 p-4" data-testid="stat-total-advanced">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Advanced</p>
                  <p className="text-xl font-bold font-mono">₹{totalAdvanced.toLocaleString()}</p>
                </div>
                <div className="border border-white/[0.06] bg-zinc-950 p-4" data-testid="stat-total-collected">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Collected</p>
                  <p className="text-xl font-bold font-mono text-[#6FFFE9]">₹{totalCollected.toLocaleString()}</p>
                </div>
                <div className="border border-white/[0.06] bg-zinc-950 p-4" data-testid="stat-collection-rate">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">On-Time Rate</p>
                  <p className={`text-xl font-bold font-mono ${collectionRate >= 90 ? "text-[#6FFFE9]" : collectionRate >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                    {collectionRate}%
                  </p>
                </div>
              </div>
              <div className="border border-[#6FFFE9]/15 p-4 bg-zinc-950">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Monthly Collection History</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barGap={2} barCategoryGap="25%">
                    <XAxis dataKey="month" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "#09090b", border: "1px solid rgba(111,255,233,0.2)", borderRadius: 0, fontSize: 11 }}
                      labelStyle={{ color: "#a1a1aa" }}
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="advanced" name="Advanced" fill="#3f3f46" radius={0}>
                      {chartData.map((_, i) => <Cell key={i} fill="#27272a" />)}
                    </Bar>
                    <Bar dataKey="collected" name="Collected" radius={0}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.settled ? "#6FFFE9" : "rgba(111,255,233,0.4)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-zinc-600 mt-2 text-right">{settledMonths} month{settledMonths !== 1 ? "s" : ""} fully settled</p>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-[#6FFFE9]" />
              <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('owner_active_properties')}
              </h3>
            </div>
            <div className="space-y-4">
              {properties?.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-[#6FFFE9]" />
              <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('owner_recent_activity')}
              </h3>
            </div>
            <div className="space-y-3">
              {ledgers?.slice(0, 8).map(ledger => (
                <div
                  key={ledger.id}
                  className="flex items-center justify-between p-4 border border-[#6FFFE9]/18 bg-[#6FFFE9]/3"
                  data-testid={`activity-${ledger.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 ${ledger.amountAdvanced > 0 ? 'bg-[#6FFFE9]' : 'bg-zinc-600'}`} />
                    <div>
                      <p className="font-medium text-white">
                        {ledger.amountAdvanced > 0 ? t('owner_rent_advanced') : t('owner_pending_advance')}
                      </p>
                      <p className="text-xs text-zinc-500">{ledger.property.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg">₹{ledger.amountAdvanced.toLocaleString()}</span>
                    <p className="text-xs text-zinc-500 font-mono">
                      {new Date(ledger.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
              {(!ledgers || ledgers.length === 0) && (
                <div className="p-8 border border-[#6FFFE9]/15 text-center text-zinc-500">
                  {t('owner_no_activity')}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: { id: string; address: string; payoutDay: number; monthlyRent: number } }) {
  const { data: ticketCounts } = useTicketCounts(property.id);
  const { t } = useI18n();

  return (
    <div className="p-6 border border-[#6FFFE9]/15 bg-zinc-950/50 group hover:border-[#6FFFE9]/40 transition-all" data-testid={`card-property-${property.id}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium text-lg">{property.address}</h4>
          <div className="flex gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Calendar size={14} /> {t('owner_due_day')} {property.payoutDay}</span>
            <span className="flex items-center gap-1"><CreditCard size={14} /> ₹{property.monthlyRent.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-2 w-2 bg-[#6FFFE9] shadow-[0_0_10px_rgba(111,255,233,0.5)] animate-pulse"></div>
      </div>

      <div className="border-t border-[#6FFFE9]/15 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={14} className="text-[#6FFFE9]/60" />
          <span className="text-xs uppercase tracking-wider text-zinc-400">{t('owner_property_health')}</span>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2" data-testid={`stat-open-tickets-${property.id}`}>
            <AlertCircle size={16} className={ticketCounts?.open ? "text-white" : "text-zinc-600"} />
            <span className="text-sm">
              <span className="font-mono text-white">{ticketCounts?.open || 0}</span>
              <span className="text-zinc-500 ml-1">{t('owner_open')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2" data-testid={`stat-resolved-tickets-${property.id}`}>
            <CheckCircle size={16} className="text-zinc-500" />
            <span className="text-sm">
              <span className="font-mono text-white">{ticketCounts?.resolved || 0}</span>
              <span className="text-zinc-500 ml-1">{t('owner_resolved')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  if (!isVerified) {
    return (
      <Button
        disabled
        className="bg-zinc-800 text-zinc-500 cursor-not-allowed gap-2 rounded-none"
        title="Complete KYC verification to add properties"
      >
        <Plus size={20} />
        {t('owner_add_kyc_required')}
      </Button>
    );
  }

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
          toast({ title: "Tenant not found", description: "No user with that email exists. Property will be created without a tenant." });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none font-bold" data-testid="button-add-property">
          <Plus size={18} className="mr-2" />
          {t('owner_add_property')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-2 border-[#6FFFE9]/35 rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            {t('modal_add_property')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-zinc-400 uppercase text-xs tracking-wider">{t('setup_property_address')}</Label>
            <Input
              id="address"
              {...register("address", { required: "Address is required" })}
              placeholder="123 Main Street, Apt 4B"
              className="bg-zinc-900 border-2 border-[#6FFFE9]/20 focus:border-[#6FFFE9]/60 rounded-none h-12"
              data-testid="input-property-address"
            />
            {errors.address && <p className="text-sm text-red-400">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-zinc-400 uppercase text-xs tracking-wider">{t('modal_monthly_rent')}</Label>
              <Input
                id="monthlyRent"
                type="number"
                {...register("monthlyRent", { required: "Rent is required", min: { value: 1, message: "Must be positive" } })}
                placeholder="25000"
                className="bg-zinc-900 border-2 border-[#6FFFE9]/20 focus:border-[#6FFFE9]/60 rounded-none h-12"
                data-testid="input-monthly-rent"
              />
              {errors.monthlyRent && <p className="text-sm text-red-400">{errors.monthlyRent.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payoutDay" className="text-zinc-400 uppercase text-xs tracking-wider">{t('modal_payout_day')}</Label>
              <Input
                id="payoutDay"
                type="number"
                {...register("payoutDay", { required: true, min: 1, max: 28 })}
                placeholder="1"
                className="bg-zinc-900 border-2 border-[#6FFFE9]/20 focus:border-[#6FFFE9]/60 rounded-none h-12"
                data-testid="input-payout-day"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantEmail" className="text-zinc-400 uppercase text-xs tracking-wider">{t('modal_tenant_email_optional')}</Label>
            <Input
              id="tenantEmail"
              type="email"
              {...register("tenantEmail")}
              placeholder="tenant@example.com"
              className="bg-zinc-900 border-2 border-[#6FFFE9]/20 focus:border-[#6FFFE9]/60 rounded-none h-12"
              data-testid="input-tenant-email"
            />
            <p className="text-xs text-zinc-500">{t('modal_tenant_email_hint')}</p>
          </div>

          <Button
            type="submit"
            disabled={createProperty.isPending || isLookingUpTenant}
            className="w-full h-14 bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none font-bold text-lg"
            data-testid="button-submit-property"
          >
            {createProperty.isPending || isLookingUpTenant ? <Loader2 className="animate-spin" /> : t('modal_submit_property')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
