import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle, Plus, Shield, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import type { User } from "@shared/schema";

export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { t } = useI18n();

  const isVerified = currentUser?.isVerified;
  const hasPendingKyc = currentUser?.panNumber && !isVerified;

  if (propsLoading || ledgersLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loader-owner" />
      </div>
    );
  }

  const latestPayment = ledgers
    ?.filter(l => l.amountAdvanced > 0)
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 sm:p-6 md:p-10 flex flex-col flex-1">

        {/* Verification Banner */}
        {!isVerified && (
          <div className={`mb-6 p-4 sm:p-6 border-2 ${hasPendingKyc ? 'border-yellow-500 bg-yellow-500/10' : 'border-[#6FFFE9]/25 bg-[#6FFFE9]/5'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                {hasPendingKyc ? (
                  <Clock className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Shield className="w-6 h-6 text-[#6FFFE9] shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div>
                  <h3 className={`text-base font-semibold ${hasPendingKyc ? 'text-yellow-500' : 'text-white'}`}>
                    {hasPendingKyc ? t('kyc_banner_in_progress') : t('kyc_banner_complete')}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {hasPendingKyc ? t('kyc_banner_reviewing') : t('kyc_banner_verify_owner')}
                  </p>
                </div>
              </div>
              {!hasPendingKyc && (
                <Link href="/verify">
                  <Button className="bg-white text-black rounded-none w-full sm:w-auto" data-testid="button-complete-kyc">
                    {t('kyc_banner_button')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('owner_title')}
            </h1>
            <p className="text-zinc-500 text-sm">{t('owner_subtitle')}</p>
          </div>
          <AddPropertyModal isVerified={isVerified ?? undefined} />
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
