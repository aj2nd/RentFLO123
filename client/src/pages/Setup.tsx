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
      { address: address.trim(), monthlyRent: rentNum, payoutDay: payoutDayNum, ownerId: user?.id || "", pendingTenantEmail: tenantEmail.trim() || undefined },
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
      if (res.ok) {
        setJoined(true);
        toast({ title: t('setup_join_success'), description: t('setup_join_success_desc') });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/mine"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
        setLocation("/tenant");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return null;
}
