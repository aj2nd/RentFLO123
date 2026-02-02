import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();

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
    <div className="min-h-screen bg-black text-white p-8 md:p-12 pl-28 md:pl-72 flex flex-col">
      <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Owner Portal</h1>
          <p className="text-zinc-500">Welcome back. Your portfolio overview.</p>
        </div>
        <AddPropertyModal />
      </header>

      <div className="mb-16">
        {latestPayment ? (
          <div className="border-2 border-white p-8">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: 'Georgia, Times, serif' }} data-testid="text-rent-credited">
              RENT CREDITED
            </h2>
            <p className="text-6xl md:text-8xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Inter, sans-serif' }} data-testid="text-last-payout">
              ₹{latestPayment.amountAdvanced.toLocaleString()}
            </p>
            <p className="text-zinc-400 mt-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-white inline-block"></span>
              Credited to your bank account on {new Date(latestPayment.updatedAt || latestPayment.createdAt!).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="border-2 border-zinc-800 p-8">
             <p className="text-zinc-500 text-lg mb-2 uppercase tracking-widest font-medium">Payout Status</p>
             <h2 className="text-5xl font-bold tracking-tighter text-zinc-700" style={{ fontFamily: 'Georgia, Times, serif' }}>AWAITING PAYOUT</h2>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-white" />
            <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Active Properties</h3>
          </div>
          <div className="space-y-4">
            {properties?.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
        
        <section>
          <div className="flex items-center gap-3 mb-6">
             <Calendar className="text-white" />
             <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Recent Activity</h3>
          </div>
          <div className="space-y-3">
             {ledgers?.slice(0, 8).map(ledger => (
               <div 
                 key={ledger.id} 
                 className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/50"
                 data-testid={`activity-${ledger.id}`}
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-2 h-2 ${ledger.amountAdvanced > 0 ? 'bg-white' : 'bg-zinc-600'}`} />
                   <div>
                     <p className="font-medium text-white">
                       {ledger.amountAdvanced > 0 ? 'Rent Advanced' : 'Pending Advance'}
                     </p>
                     <p className="text-xs text-zinc-500">
                       {ledger.property.address}
                     </p>
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
               <div className="p-8 border border-zinc-800 text-center text-zinc-500">
                 No recent activity.
               </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: { id: string; address: string; payoutDay: number; monthlyRent: number } }) {
  const { data: ticketCounts } = useTicketCounts(property.id);
  
  return (
    <div className="p-6 border border-zinc-900 bg-zinc-950/50 group hover:border-zinc-700 transition-all" data-testid={`card-property-${property.id}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium text-lg">{property.address}</h4>
          <div className="flex gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Calendar size={14} /> Due Day: {property.payoutDay}</span>
            <span className="flex items-center gap-1"><CreditCard size={14} /> Rent: ₹{property.monthlyRent.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-2 w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
      </div>
      
      <div className="border-t border-zinc-800 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={14} className="text-zinc-400" />
          <span className="text-xs uppercase tracking-wider text-zinc-400">Property Health</span>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2" data-testid={`stat-open-tickets-${property.id}`}>
            <AlertCircle size={16} className={ticketCounts?.open ? "text-white" : "text-zinc-600"} />
            <span className="text-sm">
              <span className="font-mono text-white">{ticketCounts?.open || 0}</span>
              <span className="text-zinc-500 ml-1">Open</span>
            </span>
          </div>
          <div className="flex items-center gap-2" data-testid={`stat-resolved-tickets-${property.id}`}>
            <CheckCircle size={16} className="text-zinc-500" />
            <span className="text-sm">
              <span className="font-mono text-white">{ticketCounts?.resolved || 0}</span>
              <span className="text-zinc-500 ml-1">Resolved</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayoutStatusBadge({ amountAdvanced }: { amountAdvanced: number }) {
  if (amountAdvanced > 0) {
    return <span className="text-xs bg-white text-black border border-white px-2 py-1 uppercase tracking-wide">Paid</span>;
  }
  return <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 uppercase tracking-wide">Pending</span>;
}

interface AddPropertyFormData {
  address: string;
  monthlyRent: string;
  payoutDay: string;
  tenantEmail: string;
}

function AddPropertyModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const createProperty = useCreateProperty();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddPropertyFormData>({
    defaultValues: {
      address: "",
      monthlyRent: "",
      payoutDay: "1",
      tenantEmail: "",
    },
  });

  const onSubmit = async (data: AddPropertyFormData) => {
    if (!user?.id) return;

    let tenantId: string | undefined;
    
    if (data.tenantEmail.trim()) {
      setIsLookingUpTenant(true);
      try {
        const res = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(data.tenantEmail)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const tenantUser = await res.json();
          tenantId = tenantUser.id;
        } else {
          toast({
            title: "Tenant not found",
            description: "No user with that email exists. Property will be created without a tenant.",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to look up tenant. Property will be created without a tenant.",
        });
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
      
      toast({
        title: "Property Added",
        description: `${data.address} has been added to your portfolio.`,
      });
      
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add property",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none font-bold"
          data-testid="button-add-property"
        >
          <Plus size={18} className="mr-2" />
          Add New Property
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-2 border-white rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Add Property
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-zinc-400 uppercase text-xs tracking-wider">Property Address</Label>
            <Input
              id="address"
              {...register("address", { required: "Address is required" })}
              placeholder="123 Main Street, Apt 4B"
              className="bg-zinc-900 border-2 border-zinc-700 focus:border-white rounded-none h-12"
              data-testid="input-property-address"
            />
            {errors.address && <p className="text-sm text-red-400">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-zinc-400 uppercase text-xs tracking-wider">Monthly Rent (₹)</Label>
              <Input
                id="monthlyRent"
                type="number"
                {...register("monthlyRent", { required: "Rent is required", min: { value: 1, message: "Must be positive" } })}
                placeholder="25000"
                className="bg-zinc-900 border-2 border-zinc-700 focus:border-white rounded-none h-12"
                data-testid="input-monthly-rent"
              />
              {errors.monthlyRent && <p className="text-sm text-red-400">{errors.monthlyRent.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutDay" className="text-zinc-400 uppercase text-xs tracking-wider">Payout Day</Label>
              <Input
                id="payoutDay"
                type="number"
                {...register("payoutDay", { required: true, min: 1, max: 28 })}
                placeholder="1"
                className="bg-zinc-900 border-2 border-zinc-700 focus:border-white rounded-none h-12"
                data-testid="input-payout-day"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantEmail" className="text-zinc-400 uppercase text-xs tracking-wider">Tenant Email (Optional)</Label>
            <Input
              id="tenantEmail"
              type="email"
              {...register("tenantEmail")}
              placeholder="tenant@example.com"
              className="bg-zinc-900 border-2 border-zinc-700 focus:border-white rounded-none h-12"
              data-testid="input-tenant-email"
            />
            <p className="text-xs text-zinc-500">Enter your tenant's email to link them to this property</p>
          </div>

          <Button
            type="submit"
            disabled={createProperty.isPending || isLookingUpTenant}
            className="w-full h-14 bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none font-bold text-lg"
            data-testid="button-submit-property"
          >
            {createProperty.isPending || isLookingUpTenant ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Add Property"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
