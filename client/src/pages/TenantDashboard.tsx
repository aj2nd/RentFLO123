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
import type { Property, User } from "@shared/schema";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TenantDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading, refetch: refetchLedgers } = useLedgers();
  const { mutate: createPartialPayment, isPending: isCreatingPayment } = useCreatePartialPayment();
  const { toast } = useToast();
  const { mutate: createTicket, isPending: isCreatingTicket } = useCreateTicket();
  const { user } = useAuth();
  
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

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
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePartialPayment = () => {
    if (!unpaidLedger) return;
    
    // Block unverified users from making payments
    if (!isVerified) {
      toast({ 
        title: "KYC Required", 
        description: "Please complete your KYC verification before making payments.", 
        variant: "destructive" 
      });
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
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "RentFLO",
            description: `Partial rent payment for ${property?.address}`,
            order_id: orderData.orderId,
            handler: function (response: any) {
              setShowSuccess(true);
              setPaymentAmount("");
              queryClient.invalidateQueries({ queryKey: ['/api/ledgers'] });
              setTimeout(() => setShowSuccess(false), 3000);
            },
            prefill: {
              name: "Tenant",
              email: "tenant@example.com",
            },
            theme: {
              color: "#000000",
            },
          };

          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        },
        onError: (error: any) => {
          toast({ 
            title: "Payment Setup Failed", 
            description: error.message || "Could not create payment order.", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTicketPhoto(event.target?.result as string);
      };
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
      const res = await fetch(`/api/properties/by-owner-email?email=${encodeURIComponent(landlordEmail)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const props = await res.json();
        const available = props.filter((p: Property) => !p.tenantId);
        setAvailableProperties(available);
        if (available.length === 0) {
          toast({ title: "No Properties Found", description: "No available properties found for this landlord." });
        }
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
      {
        propertyId: property.id,
        tenantId: user?.id || "",
        title: ticketTitle,
        description: ticketDescription,
        photoUrl: ticketPhoto || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Request Submitted", description: "Your maintenance request has been sent." });
          setShowMaintenanceForm(false);
          setTicketTitle("");
          setTicketDescription("");
          setTicketPhoto("");
          queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        },
        onError: (error: any) => {
          toast({ title: "Failed", description: error.message, variant: "destructive" });
        }
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
    <div className="min-h-screen bg-black text-white p-8 md:p-12 pl-28 md:pl-72 flex flex-col max-w-7xl mx-auto">
      <SuccessAnimation show={showSuccess} message="Payment Successful" />
      
      {/* Verification Banner */}
      {!isVerified && (
        <div className={`mb-8 p-6 border-2 ${hasPendingKyc ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-700 bg-zinc-900'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {hasPendingKyc ? (
                <Clock className="w-8 h-8 text-yellow-500" />
              ) : (
                <Shield className="w-8 h-8 text-zinc-400" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${hasPendingKyc ? 'text-yellow-500' : 'text-white'}`}>
                  {hasPendingKyc ? 'Verification in Progress' : 'Complete KYC Verification'}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {hasPendingKyc 
                    ? 'Your documents are being reviewed. This usually takes 1-2 business days.'
                    : 'Verify your identity to make rent payments.'}
                </p>
              </div>
            </div>
            {!hasPendingKyc && (
              <Link href="/verify">
                <Button className="bg-white text-black rounded-none" data-testid="button-complete-kyc">
                  Complete KYC
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
          <span className="w-2 h-2 bg-white animate-pulse"></span>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">RentFLO Secure Pay</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Tenant Dashboard</h1>
        <p className="text-zinc-500">Manage your stay at {property?.address || "your residence"}.</p>
      </header>

      {unpaidLedger && property ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold mb-2">Monthly Rent</p>
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ₹{totalDue.toLocaleString()}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-base">
                  <span className="text-zinc-400 uppercase tracking-wider text-sm">Settlement Progress</span>
                  <span className="font-mono text-white" data-testid="text-progress-percent">{progressPercent}% Settled</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 border border-zinc-800">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                    data-testid="progress-bar-settlement"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Paid: <span className="text-white font-mono" data-testid="text-amount-paid">₹{amountPaid.toLocaleString()}</span></span>
                  <span className="text-zinc-500">Remaining: <span className="text-white font-mono" data-testid="text-amount-remaining">₹{remaining.toLocaleString()}</span></span>
                </div>
              </div>

              {paymentsData && paymentsData.length > 0 && (
                <div className="border border-zinc-800 p-4">
                  <h4 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Payment History</h4>
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

            <div className="bg-zinc-950 border border-zinc-800 p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Payment</h3>
                  <p className="text-zinc-500 text-sm">Choose your payment method.</p>
                </div>
                <button 
                  onClick={() => setFlexiblePaymentEnabled(!flexiblePaymentEnabled)}
                  className="flex items-center gap-2 px-3 py-2 border border-zinc-700 hover:bg-zinc-800 transition-colors"
                  data-testid="toggle-flexible-payment"
                >
                  {flexiblePaymentEnabled ? (
                    <ToggleRight className="text-white" size={24} />
                  ) : (
                    <ToggleLeft className="text-zinc-500" size={24} />
                  )}
                  <span className="text-sm uppercase tracking-wider">{flexiblePaymentEnabled ? 'Flexible' : 'Full Only'}</span>
                </button>
              </div>

              {flexiblePaymentEnabled ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Amount to Pay (₹)</label>
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
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentAmount(String(Math.min(preset, remaining)))}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        data-testid={`button-preset-${preset}`}
                      >
                        ₹{preset.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(String(remaining))}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      data-testid="button-preset-full"
                    >
                      Full: ₹{remaining.toLocaleString()}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-center">
                  <p className="text-zinc-400 text-sm mb-2">Full payment amount</p>
                  <p className="text-3xl font-bold font-mono" data-testid="text-full-amount">₹{remaining.toLocaleString()}</p>
                </div>
              )}

              <PayRentButton amount={flexiblePaymentEnabled ? Number(paymentAmount || 0) : remaining} vpa="YOUR_VPA@bank" />
              
              <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-wider">
                <ShieldCheck size={14} /> 
                <span>Protected by Bank-Grade Security</span>
              </div>
            </div>
          </div>

          {paymentsData && paymentsData.length > 0 && (
            <div className="border-t border-zinc-800 pt-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <ArrowRight className="text-zinc-400" size={20} />
                <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {paymentsData.slice(0, 5).map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/50"
                    data-testid={`activity-${payment.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 ${payment.status === 'SUCCESS' ? 'bg-white' : 'bg-zinc-600'}`} />
                      <div>
                        <p className="font-medium text-white">
                          {payment.status === 'SUCCESS' ? 'Split Payment' : payment.status === 'PENDING' ? 'Payment Pending' : 'Payment Failed'}
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

          <div className="border-t border-zinc-800 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Wrench className="text-zinc-400" size={20} />
                <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Maintenance</h3>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                className="border-zinc-700 text-white hover:bg-zinc-800"
                data-testid="button-request-fix"
              >
                {showMaintenanceForm ? <X size={16} /> : <Wrench size={16} />}
                <span className="ml-2">{showMaintenanceForm ? 'Cancel' : 'Request Fix'}</span>
              </Button>
            </div>

            {showMaintenanceForm && (
              <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Issue Title</label>
                  <Input
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="e.g., Leaking faucet in bathroom"
                    className="bg-zinc-900 border-zinc-700 text-white"
                    data-testid="input-ticket-title"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Description</label>
                  <Textarea
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                    data-testid="input-ticket-description"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Photo Proof (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 transition-colors">
                      <Upload size={16} />
                      <span className="text-sm">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        data-testid="input-ticket-photo"
                      />
                    </label>
                    {ticketPhoto && (
                      <span className="text-white text-sm">Photo attached</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSubmitTicket}
                  disabled={isCreatingTicket || !ticketTitle || !ticketDescription}
                  className="bg-white text-black hover:bg-zinc-200 w-full"
                  data-testid="button-submit-ticket"
                >
                  {isCreatingTicket ? <Loader2 className="animate-spin mr-2" /> : null}
                  Submit Request
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="border-2 border-white p-8 bg-zinc-950">
            <div className="flex items-center gap-4 mb-6">
              <Building2 size={32} className="text-white" />
              <div>
                <h2 className="text-3xl font-bold tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>Join My Home</h2>
                <p className="text-zinc-500">Link yourself to a property by searching your landlord's email.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="landlordEmail" className="text-zinc-400 uppercase text-xs tracking-wider">Landlord Email</Label>
                <div className="flex gap-4">
                  <Input
                    id="landlordEmail"
                    type="email"
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                    placeholder="landlord@example.com"
                    className="bg-zinc-900 border-2 border-zinc-700 focus:border-white rounded-none h-12 flex-1"
                    data-testid="input-landlord-email"
                  />
                  <Button
                    onClick={handleSearchProperties}
                    disabled={isSearching}
                    className="bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none h-12 px-6"
                    data-testid="button-search-landlord"
                  >
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
              </div>

              {availableProperties.length > 0 && (
                <div className="space-y-3 mt-6">
                  <p className="text-sm text-zinc-400 uppercase tracking-wider">Available Properties</p>
                  {availableProperties.map((prop) => (
                    <div 
                      key={prop.id} 
                      className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors"
                      data-testid={`property-option-${prop.id}`}
                    >
                      <div>
                        <p className="font-medium text-white">{prop.address}</p>
                        <p className="text-sm text-zinc-500">Rent: ₹{prop.monthlyRent.toLocaleString()}/month</p>
                      </div>
                      <Button
                        onClick={() => handleJoinProperty(prop.id)}
                        disabled={isJoining}
                        className="bg-white text-black hover:bg-zinc-200 rounded-none"
                        data-testid={`button-join-${prop.id}`}
                      >
                        {isJoining ? <Loader2 className="animate-spin" size={16} /> : "Join"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 border border-zinc-900 bg-zinc-950/30">
            <div className="w-16 h-16 bg-zinc-900 flex items-center justify-center mb-4">
              <Home size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold tracking-tighter mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No Active Rent</h3>
            <p className="text-zinc-500 text-sm">Once you join a property, your rent payments will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
