import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";

interface LedgerEntry {
  id: string;
  propertyId: string;
  amountAdvanced: number;
  amountCollected: number;
  status: string;
  monthYear: string;
  createdAt: string;
  updatedAt: string;
  property: { id: string; address: string; monthlyRent: number };
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
    RENT_COLLECTED: { icon: TrendingDown, bg: 'bg-[#6FFFE9]/15', text: 'text-[#6FFFE9]' },
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
  const { t } = useI18n();

  const { data: ledgers, isLoading: ledgersLoading } = useQuery<LedgerEntry[]>({ queryKey: ['/api/ledgers'] });
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({ queryKey: ['/api/payments'] });

  if (authLoading || ledgersLoading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6FFFE9] border-t-transparent animate-spin" />
      </div>
    );
  }

  const transactions: Transaction[] = [];
  let runningBalance = 0;

  ledgers?.forEach(ledger => {
    if (ledger.amountAdvanced > 0) {
      runningBalance -= ledger.amountAdvanced;
      transactions.push({
        id: ledger.id, date: ledger.createdAt, action: 'CAPITAL_ADVANCED',
        amount: -ledger.amountAdvanced, balance: runningBalance,
        property: ledger.property.address, reference: formatTransactionId(ledger.id),
      });
    }
    if (ledger.amountCollected > 0) {
      runningBalance += ledger.amountCollected;
      transactions.push({
        id: `${ledger.id}-collected`, date: ledger.updatedAt || ledger.createdAt,
        action: 'RENT_COLLECTED', amount: ledger.amountCollected, balance: runningBalance,
        property: ledger.property.address, reference: formatTransactionId(ledger.id),
      });
    }
  });

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalExposure = Math.abs(runningBalance);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="p-4 sm:p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-[#6FFFE9]" />
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {t('ledger_title')}
              </h1>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-[#9DEFE4]/60 uppercase tracking-widest mb-1">{t('ledger_current_exposure')}</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono" style={{ fontFamily: 'Playfair Display, Georgia, serif' }} data-testid="text-ledger-exposure">
                ₹{totalExposure.toLocaleString()}
              </p>
            </div>
          </header>

          {/* Desktop table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
            className="hidden sm:block border-2 border-[#6FFFE9]/25 overflow-x-auto">
            <table className="w-full text-left min-w-[640px]" data-testid="table-ledger">
              <thead className="bg-zinc-900/80 text-[#9DEFE4]/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">{t('ledger_date')}</th>
                  <th className="p-4 font-medium">{t('ledger_txn_id')}</th>
                  <th className="p-4 font-medium">{t('ledger_property')}</th>
                  <th className="p-4 font-medium">{t('ledger_action')}</th>
                  <th className="p-4 font-medium text-right">{t('ledger_amount')}</th>
                  <th className="p-4 font-medium text-right">{t('ledger_balance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6FFFE9]/10">
                {transactions.map((txn, index) => (
                  <motion.tr key={txn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                    className="hover:bg-[#6FFFE9]/5 transition-colors" data-testid={`row-transaction-${txn.id}`}>
                    <td className="p-4 text-zinc-400 font-mono text-sm whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-mono text-sm text-zinc-300 whitespace-nowrap">{txn.reference}</td>
                    <td className="p-4 font-medium truncate max-w-[160px]">{txn.property}</td>
                    <td className="p-4 whitespace-nowrap"><ActionBadge action={txn.action} /></td>
                    <td className={`p-4 text-right font-mono whitespace-nowrap ${txn.amount >= 0 ? 'text-white' : 'text-zinc-400'}`}>
                      {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                    </td>
                    <td className={`p-4 text-right font-mono whitespace-nowrap ${txn.balance >= 0 ? 'text-white' : 'text-zinc-500'}`}>
                      ₹{txn.balance.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-500">{t('ledger_no_transactions')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {transactions.length === 0 && (
              <div className="p-8 border border-zinc-900 text-center text-zinc-500 text-sm">{t('ledger_no_transactions')}</div>
            )}
            {transactions.map((txn, index) => (
              <motion.div key={txn.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                className="border border-[#6FFFE9]/20 bg-zinc-950/50 p-4 space-y-3" data-testid={`card-transaction-${txn.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <ActionBadge action={txn.action} />
                  <span className={`font-mono font-bold text-base ${txn.amount >= 0 ? 'text-white' : 'text-zinc-400'}`}>
                    {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-white truncate">{txn.property}</p>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span className="font-mono">{txn.reference}</span>
                  <span>{new Date(txn.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="text-xs text-zinc-600 text-right">
                  {t('ledger_balance_label')} <span className={`font-mono ${txn.balance >= 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>₹{txn.balance.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center text-[#9DEFE4]/30 text-xs uppercase tracking-widest">
            {t('ledger_footer')}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
