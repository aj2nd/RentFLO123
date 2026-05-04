import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Receipt, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { useEffect, useState } from "react";

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

function downloadCSV(transactions: Transaction[], user: { firstName?: string; lastName?: string; email?: string } | undefined | null) {
  const headers = ["Date", "Reference", "Property", "Action", "Amount (INR)", "Balance (INR)"];
  const rows = transactions.map(txn => [
    new Date(txn.date).toLocaleDateString("en-IN"),
    txn.reference,
    `"${txn.property.replace(/"/g, '""')}"`,
    getActionLabel(txn.action),
    txn.amount,
    txn.balance,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join("_") || user?.email || "tenant";
  a.download = `RentFLO_Statement_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LedgerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [headerProgress, setHeaderProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const elapsed = Math.min(1, y / 140);
      setHeaderProgress(1 - Math.pow(1 - elapsed, 3));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: ledgers, isLoading: ledgersLoading } = useQuery<LedgerEntry[]>({ queryKey: ['/api/ledgers'] });
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({ queryKey: ['/api/payments'] });

  if (authLoading || ledgersLoading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6 md:p-10 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 w-36 bg-zinc-900 animate-pulse" />
          <div className="h-9 w-32 bg-zinc-900 animate-pulse" />
        </div>
        <div className="space-y-px border border-[#6FFFE9]/10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-white/[0.04]">
              <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
              <div className="h-3 w-24 bg-zinc-900 animate-pulse" />
              <div className="h-3 flex-1 bg-zinc-900 animate-pulse" />
              <div className="h-5 w-20 bg-zinc-900 animate-pulse" />
              <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const transactions: Transaction[] = [];
  let runningBalance = 0;

  ledgers?.forEach(ledger => { /* unchanged */ });

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="p-4 sm:p-6 md:p-10 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <header
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            style={{
              position: "sticky",
              top: "env(safe-area-inset-top, 0px)",
              zIndex: 20,
              paddingTop: "0.75rem",
              paddingBottom: "0.5rem",
              backdropFilter: `blur(${8 + 12 * headerProgress}px) saturate(${120 + 60 * headerProgress}%)`,
              WebkitBackdropFilter: `blur(${8 + 12 * headerProgress}px) saturate(${120 + 60 * headerProgress}%)`,
              background: `rgba(0,0,0,${0.10 + 0.42 * headerProgress})`,
              borderBottom: `1px solid rgba(111,255,233,${0.06 + 0.18 * headerProgress})`,
              boxShadow: `0 12px 32px rgba(0,0,0,${0.06 + 0.16 * headerProgress}), inset 0 -1px 0 rgba(111,255,233,${0.02 + 0.08 * headerProgress})`,
              transition: "background 180ms linear, border-color 180ms linear, box-shadow 180ms linear, backdrop-filter 180ms linear, -webkit-backdrop-filter 180ms linear",
            }}
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-[#6FFFE9]" />
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {t('ledger_title')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="sm:text-right">
                <p className="text-xs text-[#9DEFE4]/60 uppercase tracking-widest mb-1">{t('ledger_current_exposure')}</p>
                <p className="text-2xl sm:text-3xl font-bold font-mono" style={{ fontFamily: 'Playfair Display, Georgia, serif' }} data-testid="text-ledger-exposure">
                  ₹0
                </p>
              </div>
              {transactions.length > 0 && (
                <button
                  onClick={() => downloadCSV(transactions, user)}
                  className="flex items-center gap-2 px-3 py-2 border border-[#6FFFE9]/25 text-[#6FFFE9]/70 hover:border-[#6FFFE9]/60 hover:text-[#6FFFE9] transition-colors text-xs uppercase tracking-widest shrink-0"
                  data-testid="button-export-csv"
                >
                  <Download size={14} />
                  Export
                </button>
              )}
            </div>
          </header>
        </motion.div>
      </div>
    </div>
  );
}
