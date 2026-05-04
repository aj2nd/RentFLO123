import { useLedgers, usePayOwner, useAdminDashboard } from "@/hooks/use-ledgers";
import { useProperties } from "@/hooks/use-properties";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, Upload, Check, X, Image, Building2, Users, Download, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n";
import type { User, Payment } from "@shared/schema";

function FileUpload({ onFileChange, currentValue }: { onFileChange: (dataUrl: string) => void; currentValue: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => { onFileChange(reader.result as string); setIsUploading(false); };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setFileName("");
    onFileChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" data-testid="input-file-upload" />
      {currentValue ? (
        <div className="flex items-center gap-3 p-3 border border-[#6FFFE9]/30 bg-zinc-900">
          <div className="w-10 h-10 border border-zinc-700 flex items-center justify-center bg-zinc-800">
            {currentValue.startsWith("data:image") ? (
              <img src={currentValue} alt="Receipt" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <Image size={18} className="text-zinc-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{fileName || "Receipt uploaded"}</p>
            <p className="text-xs text-zinc-400 flex items-center gap-1"><Check size={12} /> Ready for submission</p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={clearFile} className="text-zinc-400 hover:text-white" data-testid="button-clear-file">
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
          className="w-full h-20 bg-zinc-900 border-2 border-dashed border-[#6FFFE9]/20 hover:border-[#6FFFE9]/50 hover:bg-zinc-800 text-zinc-400 hover:text-[#6FFFE9] rounded-none flex flex-col gap-2 transition-all"
          data-testid="button-upload-receipt">
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <><Upload size={24} /><span className="text-sm">Click to upload bank transfer screenshot</span></>}
        </Button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminDashboard();
  const { data: ledgers, isLoading: ledgersLoading } = useLedgers({ status: 'ARREARS' });
  const { data: properties, isLoading: propsLoading } = useProperties();
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'users'>('overview');
  const { t } = useI18n();
  const [headerProgress, setHeaderProgress] = useState(0);

  const { data: pendingKyc, isLoading: kycLoading } = useQuery<User[]>({ queryKey: ["/api/kyc/pending"] });
  const { data: allUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: allPayments } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });

  const { toast } = useToast();

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

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => apiRequest("POST", `/api/kyc/verify/${userId}`),
    onSuccess: () => {
      toast({ title: "User Verified", description: "KYC verification approved successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const downloadAuditLog = () => {
    if (!allPayments || allPayments.length === 0) {
      toast({ title: "No Data", description: "No transactions to export.", variant: "destructive" });
      return;
    }
    const headers = ["Transaction UUID", "Timestamp", "Ledger ID", "Amount", "Status", "Razorpay Order ID"];
    const rows = allPayments.map(p => [p.id, p.createdAt ? new Date(p.createdAt).toISOString() : "", p.ledgerId, p.amount, p.status, p.razorpayOrderId || ""]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rentflo_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({ title: "Download Started", description: "Audit log CSV is being downloaded." });
  };

  const isLoading = statsLoading || ledgersLoading || propsLoading;
  const chartData = stats ? [{ name: t('admin_advanced'), value: stats.totalAdvanced }, { name: t('admin_collected'), value: stats.totalCollected }] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 sm:p-6 md:p-10 pb-24">
        <header
          className="mb-8"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1">{t('admin_title')}</h1>
              <p className="text-zinc-500">
                {t('admin_system_status')} <span className="text-[#6FFFE9] font-medium">{t('admin_operational')}</span>
              </p>
            </div>
            <Button onClick={downloadAuditLog} className="bg-zinc-900 text-white hover:bg-zinc-800 border border-[#6FFFE9]/25 gap-2" data-testid="button-download-audit">
              <Download size={16} />
              {t('admin_download_audit')}
            </Button>
          </div>
          <div className="flex gap-4 border-b border-[#6FFFE9]/20">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-[#6FFFE9] border-b-2 border-[#6FFFE9]' : 'text-zinc-500 hover:text-[#9DEFE4]'}`} data-testid="tab-overview">{t('admin_tab_overview')}</button>
            <button onClick={() => setActiveTab('kyc')} className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'kyc' ? 'text-[#6FFFE9] border-b-2 border-[#6FFFE9]' : 'text-zinc-500 hover:text-[#9DEFE4]'}`} data-testid="tab-kyc">
              <Shield size={14} />
              {t('admin_tab_kyc')}
              {pendingKyc && pendingKyc.length > 0 && (
                <span className="bg-[#6FFFE9]/20 text-[#6FFFE9] border border-[#6FFFE9]/40 text-xs px-2 py-0.5">{pendingKyc.length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('users')} className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'text-[#6FFFE9] border-b-2 border-[#6FFFE9]' : 'text-zinc-500 hover:text-[#9DEFE4]'}`} data-testid="tab-users">
              <Users size={14} />
              {t('admin_tab_users')}
            </button>
          </div>
        </header>
      </div>
    </div>
  );
}
