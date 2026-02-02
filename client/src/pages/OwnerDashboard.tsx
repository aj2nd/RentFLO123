import { useProperties } from "@/hooks/use-properties";
import { useLedgers } from "@/hooks/use-ledgers";
import { Loader2, TrendingUp, Calendar, CreditCard } from "lucide-react";

export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  
  // In real app, filter ledgers by logged in owner. Here we fetch all for demo simplicity.
  // Ideally backend filters this via session user.
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();

  if (propsLoading || ledgersLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const totalRent = properties?.reduce((sum, p) => sum + p.monthlyRent, 0) || 0;
  
  // Find latest paid ledger for display
  const latestPayment = ledgers
    ?.filter(l => l.status === 'SETTLED' || l.status === 'EXPOSED') // EXPOSED means paid to owner but not collected from tenant
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0];

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 pl-28 md:pl-72 flex flex-col">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Owner Portal</h1>
        <p className="text-zinc-500">Welcome back. Your portfolio overview.</p>
      </header>

      {/* Hero Payment Status */}
      <div className="mb-16">
        {latestPayment ? (
          <div className="border-l-4 border-white pl-8 py-2">
            <p className="text-zinc-500 text-lg mb-2 uppercase tracking-widest font-medium">Last Payout Received</p>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white glow-text">
              ₹{latestPayment.amountAdvanced.toLocaleString()}
            </h2>
            <p className="text-zinc-400 mt-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Credited to HDFC Bank ****4921
            </p>
          </div>
        ) : (
          <div className="border-l-4 border-zinc-800 pl-8 py-2">
             <p className="text-zinc-500 text-lg mb-2 uppercase tracking-widest font-medium">Payout Status</p>
             <h2 className="text-5xl font-bold tracking-tighter text-zinc-700">NO RECENT ACTIVITY</h2>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-white" />
            <h3 className="text-2xl font-semibold tracking-tight">Active Properties</h3>
          </div>
          <div className="space-y-4">
            {properties?.map(property => (
              <div key={property.id} className="p-6 border border-zinc-900 bg-zinc-950/50 flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <h4 className="font-medium text-lg">{property.address}</h4>
                  <div className="flex gap-4 mt-2 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> Due Day: {property.payoutDay}</span>
                    <span className="flex items-center gap-1"><CreditCard size={14} /> Rent: ₹{property.monthlyRent.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <div className="flex items-center gap-3 mb-6">
             <Calendar className="text-white" />
             <h3 className="text-2xl font-semibold tracking-tight">Transaction History</h3>
          </div>
          <div className="border border-white/10 rounded-sm overflow-hidden">
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
                   <tr key={ledger.id} className="hover:bg-zinc-900/50 transition-colors">
                     <td className="p-4 text-zinc-400 font-mono text-sm">{new Date(ledger.createdAt!).toLocaleDateString()}</td>
                     <td className="p-4 font-medium truncate max-w-[150px]">{ledger.property.address}</td>
                     <td className="p-4 text-right font-mono">₹{ledger.amountAdvanced.toLocaleString()}</td>
                     <td className="p-4 text-right">
                        <StatusBadge status={ledger.status} />
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'SETTLED' || status === 'EXPOSED') {
    return <span className="text-xs bg-green-900/20 text-green-500 border border-green-900/30 px-2 py-1 uppercase tracking-wide">Paid</span>;
  }
  return <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 uppercase tracking-wide">Processing</span>;
}
