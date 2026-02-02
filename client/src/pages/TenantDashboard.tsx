import { useProperties } from "@/hooks/use-properties";
import { useLedgers, useCollectRent, useCreateOrder } from "@/hooks/use-ledgers";
import { Loader2, Home, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TenantDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading, refetch: refetchLedgers } = useLedgers();
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { mutate: payRent, isPending: isPayingRent } = useCollectRent();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
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

  const isPending = isCreatingOrder || isPayingRent;

  if (propsLoading || ledgersLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Find unpaid rent (status EXPOSED means owner paid by us, but tenant hasn't paid us back yet)
  // OR status ARREARS (neither paid)
  // Logic: "Rent Due" if amountCollected < monthlyRent for current month
  // Simplifying for demo: find the first ledger where amountCollected < monthlyRent
  
  const unpaidLedger = ledgers?.find(l => l.amountCollected < l.property.monthlyRent);
  const property = unpaidLedger?.property;

  const handlePayment = () => {
    if (!unpaidLedger) return;

    // Create Razorpay order
    createOrder(
      { id: unpaidLedger.id },
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
            description: `Rent payment for ${property?.address}`,
            order_id: orderData.orderId,
            handler: function (response: any) {
              // After successful payment, update the ledger
              payRent(
                { 
                  id: unpaidLedger.id, 
                  data: { amountCollected: property?.monthlyRent || 0 } 
                },
                {
                  onSuccess: () => {
                    setShowSuccess(true);
                    refetchLedgers();
                    setTimeout(() => setShowSuccess(false), 3000);
                  },
                  onError: () => {
                    toast({ title: "Record Update Failed", description: "Payment was successful but record update failed.", variant: "destructive" });
                  }
                }
              );
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

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 pl-28 md:pl-72 flex flex-col justify-center max-w-7xl mx-auto">
      <SuccessAnimation show={showSuccess} message="Rent Paid Successfully" />
      
      <header className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">RentBro Secure Pay</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Tenant Dashboard</h1>
        <p className="text-zinc-500">Manage your stay at {property?.address || "your residence"}.</p>
      </header>

      {unpaidLedger && property ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold mb-2">Total Due</p>
              <h2 className="text-7xl md:text-9xl font-bold tracking-tighter text-white leading-none">
                ₹{property.monthlyRent.toLocaleString()}
              </h2>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="flex justify-between text-lg">
                <span className="text-zinc-400">Due Date</span>
                <span className="font-mono text-white">February {property.payoutDay}, 2025</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-zinc-400">Payment Status</span>
                <span className="text-red-500 font-medium bg-red-950/30 px-2 border border-red-900/50">PENDING</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500"></div>
            
            <div>
              <h3 className="text-2xl font-bold mb-2">Complete Payment</h3>
              <p className="text-zinc-500">Secure 256-bit encrypted transaction.</p>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isPending}
              className="w-full bg-white text-black hover:bg-zinc-200 border-0 rounded-none h-20 text-xl font-bold tracking-tighter uppercase shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              {isPending ? <Loader2 className="animate-spin mr-2 w-6 h-6" /> : (
                <span className="flex items-center gap-3">
                  Pay Now <ArrowRight size={24} />
                </span>
              )}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-wider">
              <ShieldCheck size={14} /> 
              <span>Protected by Bank-Grade Security</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 bg-zinc-950/30">
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
            <Home size={32} className="text-zinc-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-2">You're all caught up!</h2>
          <p className="text-zinc-500">No rent payments due at this time.</p>
        </div>
      )}
    </div>
  );
}
