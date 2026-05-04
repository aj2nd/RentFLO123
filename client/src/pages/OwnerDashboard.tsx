import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { useLedgers, useTicketCounts } from "@/hooks/use-ledgers";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Calendar, CreditCard, Wrench, CheckCircle, AlertCircle, Plus, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import type { User, Property, Agreement } from "@shared/schema";
import { SetupProgress } from "@/components/SetupProgress";

export default function OwnerDashboard() {
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers();
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: agreementData } = useQuery<{ property: Property | null; agreement: Agreement | null }>({
    queryKey: ["/api/agreements/mine"],
  });
  const { t } = useI18n();

  const isVerified = currentUser?.isVerified;

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

  if (propsLoading || ledgersLoading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6 md:p-10 pb-24" data-testid="loader-owner">
        <div className="h-8 w-48 bg-zinc-900 animate-pulse mb-2" />
        <div className="h-4 w-32 bg-zinc-900/70 animate-pulse mb-8" />
        <div className="h-32 w-full bg-zinc-900 animate-pulse border border-[#6FFFE9]/10 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-900 animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    );
  }

  const latestPayment = ledgers
    ?.filter(l => l.amountAdvanced > 0)
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())[0];

  const agreementStatus = agreementData?.agreement?.status ?? null;
  const ownerSteps = [
    { label: "Verify Identity", done: !!isVerified, href: "/verify" },
    { label: "Sign Agreement", done: agreementStatus === "FULLY_SIGNED" || agreementStatus === "OWNER_SIGNED", href: "/agreement" },
    { label: "Collect Rent", done: !!latestPayment },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 sm:p-6 md:p-10 pb-24 flex flex-col flex-1">
        <SetupProgress steps={ownerSteps} />

        <header
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('owner_title')}
            </h1>
            <p className="text-zinc-500 text-sm">{t('owner_subtitle')}</p>
          </div>
          <AddPropertyModal isVerified={isVerified ?? undefined} />
        </header>

        <div className="mb-10">
          {latestPayment ? (
            <div className="border-2 border-[#6FFFE9]/50 p-5 sm:p-8">
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-3"
                style={{ fontFamily: 'Georgia, Times, serif' }} data-testid="text-rent-credited">
                {t('owner_rent_credited')}
              </h2>
              <p className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white"
                style={{ fontFamily: 'Inter, sans-serif' }} data-testid="text-last-payout">
                ₹{latestPayment.amountAdvanced.toLocaleString()}
              </p>
              <p className="text-zinc-400 mt-3 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-[#6FFFE9] inline-block shrink-0"></span>
                {t('owner_credited_on')} {new Date(latestPayment.updatedAt || latestPayment.createdAt!).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="border-2 border-[#6FFFE9]/20 p-5 sm:p-8">
              <p className="text-zinc-500 text-sm mb-2 uppercase tracking-widest font-medium">{t('owner_payout_status')}</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-700"
                style={{ fontFamily: 'Georgia, Times, serif' }}>
                {t('owner_awaiting_payout')}
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
