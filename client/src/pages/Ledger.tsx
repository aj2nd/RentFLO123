import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface LedgerEntry {
  id: string;
  propertyId: string;
  amountAdvanced: number;
  amountCollected: number;
  status: string;
  monthYear: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    address: string;
    monthlyRent: number;
  };
}

interface Payment {
  id: string;
  ledgerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

type TransactionType = 'CAPITAL_ADVANCED' | 'RENT_COLLECTED' | 'PENDING';

interface Transaction {
  id: string;
  date: string;
  action: TransactionType;
  amount: number;
  balance: number;
  property: string;
  reference: string;
}

function formatTransactionId(id: string): string {
  return `TXN-${id.slice(0, 8).toUpperCase()}`;
}

function getActionLabel(action: TransactionType): string {
  switch (action) {
    case 'CAPITAL_ADVANCED': return 'Capital Advanced';
    case 'RENT_COLLECTED': return 'Rent Collected';
    case 'PENDING': return 'Pending';
    default: return action;
  }
}

function ActionBadge({ action }: { action: TransactionType }) {
  const config = {
    CAPITAL_ADVANCED: { icon: TrendingUp, bg: 'bg-white', text: 'text-black' },
    RENT_COLLECTED: { icon: TrendingDown, bg: 'bg-zinc-800', text: 'text-white' },
    PENDING: { icon: Minus, bg: 'bg-zinc-900', text: 'text-zinc-400' },
  };
  
  const { icon: Icon, bg, text } = config[action] || config.PENDING;
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-wide font-medium border-2 ${bg} ${text}`}>
      <Icon size={12} />
      {getActionLabel(action)}
    </span>
  );
}

export default function LedgerPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: ledgers, isLoading: ledgersLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['/api/ledgers'],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  if (authLoading || ledgersLoading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  const transactions: Transaction[] = [];
  let runningBalance = 0;

  ledgers?.forEach(ledger => {
    if (ledger.amountAdvanced > 0) {
      runningBalance -= ledger.amountAdvanced;
      transactions.push({
        id: ledger.id,
        date: ledger.createdAt,
        action: 'CAPITAL_ADVANCED',
        amount: -ledger.amountAdvanced,
        balance: runningBalance,
        property: ledger.property.address,
        reference: formatTransactionId(ledger.id),
      });
    }
    
    if (ledger.amountCollected > 0) {
      runningBalance += ledger.amountCollected;
      transactions.push({
        id: `${ledger.id}-collected`,
        date: ledger.updatedAt || ledger.createdAt,
        action: 'RENT_COLLECTED',
        amount: ledger.amountCollected,
        balance: runningBalance,
        property: ledger.property.address,
        reference: formatTransactionId(ledger.id),
      });
    }
  });

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExposure = Math.abs(runningBalance);

  return (
    <div className="min-h-screen bg-black text-white p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Receipt className="w-8 h-8" />
            <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Master Ledger
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Current Exposure</p>
            <p className="text-3xl font-bold font-mono" style={{ fontFamily: 'Playfair Display, Georgia, serif' }} data-testid="text-ledger-exposure">
              ₹{totalExposure.toLocaleString()}
            </p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border-2 border-white/10"
        >
          <table className="w-full text-left" data-testid="table-ledger">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Transaction ID</th>
                <th className="p-4 font-medium">Property</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {transactions.map((txn, index) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                  className="hover:bg-zinc-900/50 transition-colors"
                  data-testid={`row-transaction-${txn.id}`}
                >
                  <td className="p-4 text-zinc-400 font-mono text-sm">
                    {new Date(txn.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4 font-mono text-sm text-zinc-300">{txn.reference}</td>
                  <td className="p-4 font-medium truncate max-w-[200px]">{txn.property}</td>
                  <td className="p-4">
                    <ActionBadge action={txn.action} />
                  </td>
                  <td className={`p-4 text-right font-mono text-lg ${txn.amount >= 0 ? 'text-white' : 'text-zinc-400'}`}>
                    {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                  </td>
                  <td className={`p-4 text-right font-mono text-lg ${txn.balance >= 0 ? 'text-white' : 'text-zinc-500'}`}>
                    ₹{txn.balance.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    No transactions recorded yet. The ledger will populate as rent advances and collections occur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-8 text-center text-zinc-600 text-xs uppercase tracking-widest">
          Bank-Grade Audit Trail • Real-Time Sync • Institutional Transparency
        </div>
      </motion.div>
    </div>
  );
}
