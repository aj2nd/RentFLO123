import { useProperties } from "@/hooks/use-properties";
import { useLedgers, useCreatePartialPayment, usePaymentsByLedger, useCreateTicket } from "@/hooks/use-ledgers";
import { Loader2, Home, ArrowRight, ShieldCheck, Wrench, Upload, X, ToggleLeft, ToggleRight, Search, Building2, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayRentButton } from "@/components/PayRentButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import type { Property, User } from "@shared/schema";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window { Razorpay: any; }
}

export default function TenantDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading, refetch: refetchLedgers } = useLedgers();
  const { mutate: createPartialPayment, isPending: isCreatingPayment } = useCreatePartialPayment();
  const { toast } = useToast();
  const { mutate: createTicket, isPending: isCreatingTicket } = useCreateTicket();
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });

  const isVerified = currentUser?.isVerified;
  const hasPendingKyc = currentUser?.panNumber && !isVerified;

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

  const unpaidLedger = ledgers?.find(l => l.amountCollected < l.property.monthlyRent);
  const property = unpaidLedger?.property;

  const { data: paymentsData } = usePaymentsByLedger(unpaidLedger?.id || "");

  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

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
            name: "RentFLO", description: `Partial rent payment for ${property?.address}`,
            order_id: orderData.orderId,
            handler: function () {
              setShowSuccess(true); setPaymentAmount("");
              queryClient.invalidateQueries({ queryKey: ['/api/ledgers'] });
              setTimeout(() => setShowSuccess(false), 3000);
            },
            prefill: { name: "Tenant", email: "tenant@example.com" },
            theme: { color: "#000000" },
          };
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        },
        onError: (error: any) => {
          toast({ title: "Payment Setup Failed", description: error.message || "Could not create payment order.", variant: "destructive" });
        }
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setTicketPhoto(event.target?.result as string); };
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
        if (available.length === 0) toast({ title: "No Properties Found", description: "No available properties found for this landlord." });
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
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ledgers'] });
        setAvailableProperties([]);
        setLandlordEmail("");
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to join property.", variant: "destructive" });
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
    createTicket(
      { propertyId: property.id, tenantId: user?.id || "", title: ticketTitle, description: ticketDescription, photoUrl: ticketPhoto || undefined },
      {
        onSuccess: () => {
          toast({ title: "Request Submitted", description: "Your maintenance request has been sent." });
          setShowMaintenanceForm(false); setTicketTitle(""); setTicketDescription(""); setTicketPhoto("");
          queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        },
        onError: (error: any) => { toast({ title: "Failed", description: error.message, variant: "destructive" }); }
      }
    );
  };

  if (propsLoading || ledgersLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loader-tenant" />
      </div>
    );
  }

  const totalDue = property?.monthlyRent || 0;
  const amountPaid = unpaidLedger?.amountCollected || 0;
  const remaining = totalDue - amountPaid;
  const progressPercent = totalDue > 0 ? Math.min(100, Math.round((amountPaid / totalDue) * 100)) : 0;

  return (
    <div className="min-h-screen bg-black text-white pl-20 md:pl-64 flex flex-col">
      <div className="p-4 sm:p-6 md:p-10 flex flex-col flex-1">
        <SuccessAnimation show={showSuccess} message="Payment Successful" />

        {/* Verification Banner */}
        {!isVerified && (
          <div className={`mb-6 p-4 sm:p-5 border-2 ${hasPendingKyc ? 'border-yellow-500 bg-yellow-500/10' : 'border-[#6FFFE9]/25 bg-[#6FFFE9]/5'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {hasPendingKyc ? <Clock className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" /> : <Shield className="w-6 h-6 text-[#6FFFE9] shrink-0 mt-0.5" />}
                <div>
                  <h3 className={`text-base font-semibold ${hasPendingKyc ? 'text-yellow-500' : 'text-white'}`}>
                    {hasPendingKyc ? t('kyc_banner_in_progress') : t('kyc_banner_complete')}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {hasPendingKyc ? t('kyc_banner_reviewing') : t('kyc_banner_verify_tenant')}
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

        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#6FFFE9]/30 bg-[#6FFFE9]/5 mb-4">
            <span className="w-2 h-2 bg-[#6FFFE9] animate-pulse"></span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#9DEFE4]">{t('tenant_secure_pay')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {t('tenant_title')}
          </h1>
          <p className="text-zinc-500 text-sm">
            {t('tenant_manage_stay')} {property?.address || t('tenant_your_residence')}.
          </p>
        </header>

        {unpaidLedger && property ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-2">{t('tenant_monthly_rent')}</p>
                  <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ₹{totalDue.toLocaleString()}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-zinc-400 uppercase tracking-wider text-sm">{t('tenant_settlement_progress')}</span>
                    <span className="font-mono text-white" data-testid="text-progress-percent">{progressPercent}% {t('tenant_settled')}</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 border border-[#6FFFE9]/20">
                    <div className="h-full bg-[#6FFFE9] transition-all duration-500" style={{ width: `${progressPercent}%` }} data-testid="progress-bar-settlement" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{t('tenant_paid')} <span className="text-white font-mono" data-testid="text-amount-paid">₹{amountPaid.toLocaleString()}</span></span>
                    <span className="text-zinc-500">{t('tenant_remaining')} <span className="text-white font-mono" data-testid="text-amount-remaining">₹{remaining.toLocaleString()}</span></span>
                  </div>
                </div>

                {paymentsData && paymentsData.length > 0 && (
                  <div className="border border-[#6FFFE9]/18 p-4">
                    <h4 className="text-sm uppercase tracking-wider text-[#9DEFE4]/70 mb-3">{t('tenant_payment_history')}</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {paymentsData.filter(p => p.status === 'SUCCESS').map((payment, idx) => (
                        <div key={payment.id} className="flex justify-between text-sm" data-testid={`payment-entry-${idx}`}>
                          <span className="text-zinc-400 font-mono">{new Date(payment.createdAt!).toLocaleDateString()}</span>
                          <span className="text-white font-mono">₹{payment.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-zinc-950/80 border border-[#6FFFE9]/25 p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{t('tenant_payment_heading')}</h3>
                    <p className="text-zinc-500 text-sm">{t('tenant_choose_method')}</p>
                  </div>
                  <button
                    onClick={() => setFlexiblePaymentEnabled(!flexiblePaymentEnabled)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#6FFFE9]/25 hover:bg-zinc-800 transition-colors"
                    data-testid="toggle-flexible-payment"
                  >
                    {flexiblePaymentEnabled ? <ToggleRight className="text-[#6FFFE9]" size={24} /> : <ToggleLeft className="text-zinc-500" size={24} />}
                    <span className="text-sm uppercase tracking-wider">{flexiblePaymentEnabled ? t('tenant_flexible') : t('tenant_full_only')}</span>
                  </button>
                </div>

                {flexiblePaymentEnabled ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">{t('tenant_amount_to_pay')}</label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={`Max ₹${remaining.toLocaleString()}`}
                        className="bg-zinc-900 border-zinc-700 text-white h-14 text-lg font-mono"
                        data-testid="input-payment-amount"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[1000, 5000, 10000].map((preset) => (
                        <Button key={preset} variant="outline" size="sm" onClick={() => setPaymentAmount(String(Math.min(preset, remaining)))}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" data-testid={`button-preset-${preset}`}>
                          ₹{preset.toLocaleString()}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setPaymentAmount(String(remaining))}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" data-testid="button-preset-full">
                        {t('tenant_full_prefix')} ₹{remaining.toLocaleString()}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-[#6FFFE9]/18 bg-[#6FFFE9]/3 text-center">
                    <p className="text-zinc-400 text-sm mb-2">{t('tenant_full_payment_amount')}</p>
                    <p className="text-3xl font-bold font-mono" data-testid="text-full-amount">₹{remaining.toLocaleString()}</p>
                  </div>
                )}

                <PayRentButton amount={flexiblePaymentEnabled ? Number(paymentAmount || 0) : remaining} vpa="YOUR_VPA@bank" />

                <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>{t('tenant_bank_security')}</span>
                </div>
              </div>
            </div>

            {paymentsData && paymentsData.length > 0 && (
              <div className="border-t border-[#6FFFE9]/15 pt-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <ArrowRight className="text-[#6FFFE9]" size={20} />
                  <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{t('tenant_recent_activity')}</h3>
                </div>
                <div className="space-y-3">
                  {paymentsData.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border border-[#6FFFE9]/18 bg-[#6FFFE9]/3" data-testid={`activity-${payment.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 ${payment.status === 'SUCCESS' ? 'bg-[#6FFFE9]' : 'bg-zinc-600'}`} />
                        <div>
                          <p className="font-medium text-white">
                            {payment.status === 'SUCCESS' ? t('tenant_split_payment') : payment.status === 'PENDING' ? t('tenant_payment_pending') : t('tenant_payment_failed')}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono">
                            {new Date(payment.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-lg">₹{payment.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#6FFFE9]/15 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Wrench className="text-[#6FFFE9]/60" size={20} />
                  <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{t('tenant_maintenance')}</h3>
                </div>
                <Button variant="outline" onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                  className="border-zinc-700 text-white hover:bg-zinc-800" data-testid="button-request-fix">
                  {showMaintenanceForm ? <X size={16} /> : <Wrench size={16} />}
                  <span className="ml-2">{showMaintenanceForm ? t('tenant_cancel') : t('tenant_request_fix')}</span>
                </Button>
              </div>

              {showMaintenanceForm && (
                <div className="bg-zinc-950/80 border border-[#6FFFE9]/20 p-6 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">{t('tenant_issue_title')}</label>
                    <Input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder="e.g., Leaking faucet in bathroom"
                      className="bg-zinc-900 border-zinc-700 text-white" data-testid="input-ticket-title" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">{t('tenant_description')}</label>
                    <Textarea value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="bg-zinc-900 border-zinc-700 text-white min-h-[100px]" data-testid="input-ticket-description" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">{t('tenant_photo_proof')}</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 transition-colors">
                        <Upload size={16} />
                        <span className="text-sm">{t('tenant_upload_photo')}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-ticket-photo" />
                      </label>
                      {ticketPhoto && <span className="text-white text-sm">{t('tenant_photo_attached')}</span>}
                    </div>
                  </div>
                  <Button onClick={handleSubmitTicket} disabled={isCreatingTicket || !ticketTitle || !ticketDescription}
                    className="bg-white text-black hover:bg-zinc-200 w-full" data-testid="button-submit-ticket">
                    {isCreatingTicket ? <Loader2 className="animate-spin mr-2" /> : null}
                    {t('tenant_submit_request')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="border-2 border-[#6FFFE9]/45 p-5 sm:p-8 bg-zinc-950">
              <div className="flex items-start gap-3 mb-5">
                <Building2 size={24} className="text-[#6FFFE9]" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>{t('tenant_join_home')}</h2>
                  <p className="text-zinc-500 text-sm">{t('tenant_join_home_subtitle')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="landlordEmail" className="text-zinc-400 uppercase text-xs tracking-wider">{t('tenant_landlord_email')}</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input id="landlordEmail" type="email" value={landlordEmail} onChange={(e) => setLandlordEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchProperties()}
                      placeholder="landlord@example.com"
                      className="flex-1 bg-zinc-900 border-zinc-700 text-white" data-testid="input-landlord-email" />
                    <Button onClick={handleSearchProperties} disabled={isSearching}
                      className="bg-white text-black hover:bg-zinc-200 rounded-none" data-testid="button-search-landlord">
                      {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                      <span className="ml-2">{t('tenant_search')}</span>
                    </Button>
                  </div>
                </div>

                {availableProperties.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs uppercase tracking-wider text-zinc-400">{t('tenant_available_properties')}</p>
                    {availableProperties.map((prop) => (
                      <div key={prop.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#6FFFE9]/25" data-testid={`available-property-${prop.id}`}>
                        <div>
                          <p className="font-medium text-white">{prop.address}</p>
                          <p className="text-sm text-zinc-500">{t('tenant_rent_label')} ₹{prop.monthlyRent.toLocaleString()}{t('tenant_per_month')}</p>
                        </div>
                        <Button onClick={() => handleJoinProperty(prop.id)} disabled={isJoining}
                          className="bg-white text-black hover:bg-zinc-200 rounded-none shrink-0" data-testid={`button-join-${prop.id}`}>
                          {isJoining ? <Loader2 className="animate-spin" size={16} /> : t('tenant_join')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-[#6FFFE9]/15 p-8 text-center">
              <Home size={48} className="text-[#6FFFE9]/25 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{t('tenant_no_active_rent')}</h3>
              <p className="text-zinc-500 text-sm">{t('tenant_no_active_rent_desc')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
