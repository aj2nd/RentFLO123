import { useProperties } from "@/hooks/use-properties";
import { useLedgers, useCreatePartialPayment, usePaymentsByLedger, useCreateTicket } from "@/hooks/use-ledgers";
import { Loader2, Home, ArrowRight, ShieldCheck, Wrench, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPhoto, setTicketPhoto] = useState<string>("");

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
    if (!unpaidLedger || !paymentAmount) return;
    const amount = parseInt(paymentAmount, 10);
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
            name: "RentBro",
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

  const handleSubmitTicket = () => {
    if (!property || !ticketTitle || !ticketDescription) {
      toast({ title: "Missing Info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    createTicket(
      {
        propertyId: property.id,
        tenantId: "user_tenant_1", // In production, from session
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
      
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
          <span className="w-2 h-2 bg-white animate-pulse"></span>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">RentBro Secure Pay</span>
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
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Split Payment</h3>
                <p className="text-zinc-500 text-sm">Pay any amount towards your rent.</p>
              </div>

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

              <Button 
                onClick={handlePartialPayment}
                disabled={isCreatingPayment || !paymentAmount}
                className="w-full bg-white text-black hover:bg-zinc-200 border-0 h-16 text-lg font-bold tracking-tighter uppercase"
                data-testid="button-pay-now"
              >
                {isCreatingPayment ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : (
                  <span className="flex items-center gap-3">
                    Pay ₹{paymentAmount || '0'} <ArrowRight size={20} />
                  </span>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-wider">
                <ShieldCheck size={14} /> 
                <span>Protected by Bank-Grade Security</span>
              </div>
            </div>
          </div>

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
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 bg-zinc-950/30">
          <div className="w-20 h-20 bg-zinc-900 flex items-center justify-center mb-6">
            <Home size={32} className="text-zinc-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>You're all caught up!</h2>
          <p className="text-zinc-500">No rent payments due at this time.</p>
        </div>
      )}
    </div>
  );
}
