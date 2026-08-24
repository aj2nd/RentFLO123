import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, Home, Search, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProperty } from "@/hooks/use-properties";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n";
import type { Property } from "@shared/schema";
import houseLogoImg from "@assets/IMG_7223_1777731010120.jpeg";
import wordmarkImg from "@assets/IMG_7224_1777731010120.jpeg";

const SILVER_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)',
  color: '#000',
};

export default function Setup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const { mutate: createProperty, isPending: isCreating } = useCreateProperty();
  const role = user?.role;

  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [payoutDay, setPayoutDay] = useState("1");
  const [tenantEmail, setTenantEmail] = useState("");
  const [landlordEmail, setLandlordEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rentNum = parseInt(rent, 10);
    const payoutDayNum = parseInt(payoutDay, 10);
    if (!address.trim()) { toast({ title: t('setup_owner_address_required'), variant: "destructive" }); return; }
    if (isNaN(rentNum) || rentNum <= 0) { toast({ title: t('setup_owner_rent_invalid'), variant: "destructive" }); return; }
    if (isNaN(payoutDayNum) || payoutDayNum < 1 || payoutDayNum > 28) { toast({ title: t('setup_owner_payout_invalid'), variant: "destructive" }); return; }
    createProperty(
      { address: address.trim(), monthlyRent: rentNum, payoutDay: payoutDayNum, tenantEmail: tenantEmail.trim() || undefined },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/properties/mine"] });
          queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
          toast({ title: t('setup_property_added'), description: t('setup_property_ready_desc') });
          setLocation("/owner");
        },
        onError: (err: any) => { toast({ title: t('setup_property_failed'), description: err.message, variant: "destructive" }); },
      }
    );
  };

  const handleSearch = async () => {
    if (!landlordEmail.trim()) { toast({ title: t('setup_tenant_email_required'), variant: "destructive" }); return; }
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/properties/by-owner-email?email=${encodeURIComponent(landlordEmail)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const props: Property[] = await res.json();
      const vacant = props.filter((p) => !p.tenantId);
      setSearchResults(vacant);
      if (vacant.length === 0) toast({ title: t('setup_no_properties_found'), description: t('setup_no_vacant_properties') });
    } catch {
      toast({ title: t('setup_search_failed'), variant: "destructive" });
    }
    setIsSearching(false);
  };

  const handleJoin = async (propertyId: string) => {
    setIsJoining(true);
    try {
      const res = await apiRequest("POST", `/api/properties/${propertyId}/join`);
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to join"); }
      queryClient.invalidateQueries({ queryKey: ["/api/properties/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
      setJoined(true);
      toast({ title: t('setup_join_success'), description: t('setup_join_success_desc') });
      setTimeout(() => setLocation("/tenant"), 1500);
    } catch (err: any) {
      toast({ title: t('setup_property_failed'), description: err.message, variant: "destructive" });
    }
    setIsJoining(false);
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 md:p-12 pb-24">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-12">
          <img src={houseLogoImg} alt="RentFLO" className="w-9 h-9 object-contain" />
          <img src={wordmarkImg} alt="RentFLO" className="h-7 object-contain" />
        </div>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#6FFFE9]/30 mb-5">
            {role === "OWNER"
              ? <Building2 size={14} className="text-[#6FFFE9]" />
              : <Home size={14} className="text-[#6FFFE9]" />}
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9DEFE4]">
              {role === "OWNER" ? t('setup_landlord_badge') : t('setup_tenant_badge')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-3 silver-text">
            {role === "OWNER" ? t('setup_owner_heading') : t('setup_tenant_heading')}
          </h1>
          <p className="text-zinc-500 text-base">
            {role === "OWNER" ? t('setup_owner_subtitle') : t('setup_tenant_subtitle')}
          </p>
        </div>

        {role === "OWNER" && (
          <form onSubmit={handleOwnerSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs uppercase tracking-wider text-zinc-500">
                {t('setup_property_address')}
              </Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder={t('setup_property_address_placeholder')}
                className="bg-black border border-[#6FFFE9]/30 text-zinc-200 placeholder:text-zinc-600 h-12 rounded-none focus:border-[#6FFFE9]/65"
                data-testid="input-property-address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent" className="text-xs uppercase tracking-wider text-zinc-500">
                  {t('setup_monthly_rent')}
                </Label>
                <Input id="rent" type="number" min={1} value={rent} onChange={(e) => setRent(e.target.value)}
                  placeholder={t('setup_monthly_rent_placeholder')}
                  className="bg-black border border-[#6FFFE9]/30 text-zinc-200 placeholder:text-zinc-600 h-12 rounded-none focus:border-[#6FFFE9]/65"
                  data-testid="input-monthly-rent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payoutDay" className="text-xs uppercase tracking-wider text-zinc-500">
                  {t('setup_payout_day')}
                </Label>
                <Input id="payoutDay" type="number" min={1} max={28} value={payoutDay} onChange={(e) => setPayoutDay(e.target.value)}
                  placeholder={t('setup_payout_day_placeholder')}
                  className="bg-black border border-[#6FFFE9]/30 text-zinc-200 placeholder:text-zinc-600 h-12 rounded-none focus:border-[#6FFFE9]/65"
                  data-testid="input-payout-day" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantEmail" className="text-xs uppercase tracking-wider text-zinc-500">
                {t('setup_tenant_email')} <span className="text-zinc-600 normal-case">({t('setup_tenant_email_optional')})</span>
              </Label>
              <Input id="tenantEmail" type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)}
                placeholder={t('setup_tenant_email_placeholder')}
                className="bg-black border border-[#6FFFE9]/30 text-zinc-200 placeholder:text-zinc-600 h-12 rounded-none focus:border-[#6FFFE9]/65"
                data-testid="input-tenant-email" />
            </div>

            <Button type="submit" disabled={isCreating}
              className="w-full h-14 rounded-none border-0 mt-2"
              style={SILVER_BTN}
              data-testid="button-setup-submit">
              {isCreating
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <span className="flex items-center gap-2">{t('setup_submit')} <ArrowRight size={18} /></span>}
            </Button>

            <button type="button" onClick={() => setLocation("/owner")}
              className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors py-2"
              data-testid="button-skip-setup">
              {t('setup_skip')}
            </button>
          </form>
        )}

        {role === "TENANT" && !joined && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="landlordEmail" className="text-xs uppercase tracking-wider text-zinc-500">
                {t('setup_landlord_email')}
              </Label>
              <div className="flex gap-3">
                <Input id="landlordEmail" type="email" value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t('setup_landlord_email_placeholder')}
                  className="flex-1 bg-black border border-[#6FFFE9]/30 text-zinc-200 placeholder:text-zinc-600 h-12 rounded-none focus:border-[#6FFFE9]/65"
                  data-testid="input-landlord-email" />
                <Button type="button" onClick={handleSearch} disabled={isSearching}
                  className="h-12 px-5 rounded-none border-0" style={SILVER_BTN}
                  data-testid="button-search-properties">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={18} />}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[#9DEFE4]">{t('setup_available_properties')}</p>
                {searchResults.map((prop) => (
                  <div key={prop.id} className="border border-[#6FFFE9]/20 p-5 flex items-center justify-between gap-4"
                    data-testid={`property-card-${prop.id}`}>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-200 leading-snug" data-testid={`property-address-${prop.id}`}>
                        {prop.address}
                      </p>
                      <p className="text-sm text-zinc-500">
                        ₹{prop.monthlyRent.toLocaleString()} / {t('setup_month')} · {t('setup_payout_day_label')} {prop.payoutDay}
                      </p>
                    </div>
                    <Button onClick={() => handleJoin(prop.id)} disabled={isJoining}
                      className="rounded-none border-0 shrink-0" style={SILVER_BTN}
                      data-testid={`button-join-${prop.id}`}>
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : t('setup_join')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setLocation("/tenant")}
              className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors py-2"
              data-testid="button-skip-setup">
              {t('setup_skip')}
            </button>
          </div>
        )}

        {role === "TENANT" && joined && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-zinc-300" />
            <p className="text-xl font-bold silver-text">{t('setup_all_set')}</p>
            <p className="text-zinc-500 text-sm">{t('setup_redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
