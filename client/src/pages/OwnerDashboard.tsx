import { useProperties } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { Loader2, TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle } from "lucide-react";

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
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Owner Portal</h1>
        <p className="text-zinc-500">Welcome back. Your portfolio overview.</p>
      </header>

      <div className="mb-16">
        {latestPayment ? (
          <div className="border-l-4 border-white pl-8 py-2">
            <p className="text-zinc-500 text-lg mb-2 uppercase tracking-widest font-medium">Last Payout Received</p>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Inter, sans-serif' }} data-testid="text-last-payout">
              ₹{latestPayment.amountAdvanced.toLocaleString()}
            </h2>
            <p className="text-zinc-400 mt-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-white inline-block"></span>
              Credited to HDFC Bank ****4921
            </p>
          </div>
        ) : (
          <div className="border-l-4 border-zinc-800 pl-8 py-2">
             <p className="text-zinc-500 text-lg mb-2 uppercase tracking-widest font-medium">Payout Status</p>
             <h2 className="text-5xl font-bold tracking-tighter text-zinc-700" style={{ fontFamily: 'Inter, sans-serif' }}>NO RECENT ACTIVITY</h2>
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
             <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Payout History</h3>
          </div>
          <div className="border border-white/10 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                 <tr>
                   <th className="p-4 font-medium">Date</th>
                   <th className="p-4 font-medium">Property</th>
                   <th className="p-4 font-medium text-right">Amount</th>
                   <th className="p-4 font-medium text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900">
                 {ledgers?.map(ledger => (
                   <tr key={ledger.id} className="hover:bg-zinc-900/50 transition-colors" data-testid={`row-payout-${ledger.id}`}>
                     <td className="p-4 text-zinc-400 font-mono text-sm">{new Date(ledger.createdAt!).toLocaleDateString()}</td>
                     <td className="p-4 font-medium truncate max-w-[150px]">{ledger.property.address}</td>
                     <td className="p-4 text-right font-mono">₹{ledger.amountAdvanced.toLocaleString()}</td>
                     <td className="p-4 text-right">
                        <PayoutStatusBadge amountAdvanced={ledger.amountAdvanced} />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
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
