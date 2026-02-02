import { useLedgers, usePayOwner, useAdminDashboard } from "@/hooks/use-ledgers";
import { useProperties } from "@/hooks/use-properties";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Loader2, AlertCircle, Upload, Check, X, Image, Building2, Users, Download, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
    reader.onloadend = () => {
      const result = reader.result as string;
      onFileChange(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setFileName("");
    onFileChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      {currentValue ? (
        <div className="flex items-center gap-3 p-3 border-2 border-white bg-zinc-900">
          <div className="w-10 h-10 border border-zinc-700 flex items-center justify-center bg-zinc-800">
            {currentValue.startsWith("data:image") ? (
              <img src={currentValue} alt="Receipt" className="w-full h-full object-cover" />
            ) : (
              <Image size={18} className="text-zinc-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{fileName || "Receipt uploaded"}</p>
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <Check size={12} /> Ready for submission
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={clearFile}
            className="text-zinc-400 hover:text-white"
            data-testid="button-clear-file"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-20 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-white hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none flex flex-col gap-2 transition-all"
          data-testid="button-upload-receipt"
        >
          {isUploading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <Upload size={24} />
              <span className="text-sm">Click to upload bank transfer screenshot</span>
            </>
          )}
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
  
  const { data: pendingKyc, isLoading: kycLoading } = useQuery<User[]>({
    queryKey: ["/api/kyc/pending"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { toast } = useToast();

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/kyc/verify/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "User Verified", description: "KYC verification approved successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const downloadAuditLog = () => {
    if (!allPayments || allPayments.length === 0) {
      toast({ title: "No Data", description: "No transactions to export.", variant: "destructive" });
      return;
    }

    const headers = ["Transaction UUID", "Timestamp", "Ledger ID", "Amount", "Status", "Razorpay Order ID"];
    const rows = allPayments.map(p => [
      p.id,
      p.createdAt ? new Date(p.createdAt).toISOString() : "",
      p.ledgerId,
      p.amount,
      p.status,
      p.razorpayOrderId || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rentbro_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast({ title: "Download Started", description: "Audit log CSV is being downloaded." });
  };
  
  const isLoading = statsLoading || ledgersLoading || propsLoading;

  const chartData = stats ? [
    { name: 'Advanced', value: stats.totalAdvanced },
    { name: 'Collected', value: stats.totalCollected },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 pl-28 md:pl-72">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">Admin Dashboard</h1>
            <p className="text-zinc-500">
              System status: <span className="text-white font-medium">Operational</span>
            </p>
          </div>
          <Button
            onClick={downloadAuditLog}
            className="bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 gap-2"
            data-testid="button-download-audit"
          >
            <Download size={16} />
            Download Audit Log
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            data-testid="tab-overview"
          >
            Financial Overview
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'kyc' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            data-testid="tab-kyc"
          >
            <Shield size={14} />
            KYC Approvals
            {pendingKyc && pendingKyc.length > 0 && (
              <span className="bg-white text-black text-xs px-2 py-0.5">{pendingKyc.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            data-testid="tab-users"
          >
            <Users size={14} />
            All Users
          </button>
        </div>
      </header>

      {activeTab === 'kyc' && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Pending KYC Verifications</h2>
          {kycLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : pendingKyc && pendingKyc.length > 0 ? (
            <div className="space-y-4">
              {pendingKyc.map((user) => (
                <div key={user.id} className="p-6 border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4" data-testid={`kyc-row-${user.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{user.fullLegalName || `${user.firstName} ${user.lastName}`}</h3>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 border border-yellow-500/30">PENDING</span>
                      <span className="text-xs bg-zinc-800 px-2 py-0.5">{user.role}</span>
                    </div>
                    <p className="text-zinc-500 text-sm">{user.email}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">PAN</p>
                        <p className="font-mono">{user.panNumber}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Aadhaar</p>
                        <p className="font-mono">{user.aadhaarNumber}</p>
                      </div>
                      {user.role === 'OWNER' && user.bankAccountNumber && (
                        <>
                          <div>
                            <p className="text-zinc-500">Bank A/C</p>
                            <p className="font-mono">{user.bankAccountNumber}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">IFSC</p>
                            <p className="font-mono">{user.ifscCode}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3 flex gap-4">
                      {user.kycDocumentUrl && (
                        <a href={user.kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white underline">
                          View ID Document
                        </a>
                      )}
                      {user.cancelledChequeUrl && (
                        <a href={user.cancelledChequeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white underline">
                          View Cancelled Cheque
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => verifyUserMutation.mutate(user.id)}
                    disabled={verifyUserMutation.isPending}
                    className="bg-white text-black hover:bg-zinc-200 gap-2"
                    data-testid={`button-verify-${user.id}`}
                  >
                    <CheckCircle size={16} />
                    Verify User
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 border border-zinc-800 bg-zinc-950/30 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500">No pending KYC verifications.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">All Users</h2>
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium text-center">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {allUsers?.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-900/50 transition-colors" data-testid={`row-user-${user.id}`}>
                    <td className="p-4 font-medium">{user.firstName} {user.lastName}</td>
                    <td className="p-4 text-zinc-400">{user.email}</td>
                    <td className="p-4">
                      <span className="text-xs bg-zinc-800 px-2 py-1">{user.role || 'NO ROLE'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1">
                          <CheckCircle size={12} />
                          Verified
                        </span>
                      ) : user.panNumber ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1">
                          Pending
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Not Submitted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
      <>
      {/* Exposure Tracker - Main Focus */}
      <div className="mb-12 p-8 border-2 border-white bg-zinc-950 mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Total Exposure</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }} data-testid="text-total-exposure">
              ₹{((stats?.totalAdvanced || 0) - (stats?.totalCollected || 0)).toLocaleString()}
            </h2>
            <p className="text-zinc-500 mt-2">Rent Advanced to Owners − Rent Collected from Tenants</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-mono text-white" data-testid="text-advanced">₹{(stats?.totalAdvanced || 0).toLocaleString()}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Advanced</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-mono text-white" data-testid="text-collected">₹{(stats?.totalCollected || 0).toLocaleString()}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Collected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          label="Total Advanced" 
          value={`₹${(stats?.totalAdvanced || 0).toLocaleString()}`} 
          subtext="Capital deployed to owners" 
        />
        <StatCard 
          label="Total Collected" 
          value={`₹${(stats?.totalCollected || 0).toLocaleString()}`} 
          subtext="Revenue recovered from tenants" 
        />
        <StatCard 
          label="Pending Payouts" 
          value={stats?.pendingPayouts || 0} 
          subtext="Actions required immediately" 
        />
        <StatCard 
          label="Active Properties" 
          value={stats?.activeProperties || 0} 
          subtext="Currently managed portfolio" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Payouts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Pending Payouts</h2>
            <span className="text-xs font-mono uppercase text-zinc-500 border border-zinc-800 px-2 py-1">
              Priority: High
            </span>
          </div>
          
          <div className="space-y-4">
            {ledgers?.length === 0 ? (
              <div className="p-12 border border-zinc-900 bg-zinc-950/30 text-center">
                <p className="text-zinc-500">No pending payouts required.</p>
              </div>
            ) : (
              ledgers?.map((ledger) => (
                <PayoutRow key={ledger.id} ledger={ledger} />
              ))
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="border border-white/10 bg-zinc-950/30 p-8 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium mb-2">Liquidity Ratio</h3>
            <p className="text-zinc-500 text-sm mb-8">Comparison of deployed capital vs collected revenue.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={0} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ffffff' : '#52525b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Master Property List */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-white" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">All Properties</h2>
          <span className="text-xs font-mono uppercase text-zinc-500 border border-zinc-800 px-2 py-1 ml-auto">
            {properties?.length || 0} Total
          </span>
        </div>

        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Property Address</th>
                <th className="p-4 font-medium">Monthly Rent</th>
                <th className="p-4 font-medium">Owner ID</th>
                <th className="p-4 font-medium text-center">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {properties?.map(property => (
                <tr key={property.id} className="hover:bg-zinc-900/50 transition-colors" data-testid={`row-property-${property.id}`}>
                  <td className="p-4 font-medium truncate max-w-[200px]">{property.address}</td>
                  <td className="p-4 font-mono">₹{property.monthlyRent.toLocaleString()}</td>
                  <td className="p-4 text-zinc-400 font-mono text-sm">{property.ownerId.slice(0, 8)}...</td>
                  <td className="p-4 text-center">
                    {property.tenantId ? (
                      <span className="inline-flex items-center gap-2 text-xs bg-white text-black border-2 border-white px-3 py-1 uppercase tracking-wide font-medium">
                        <Users size={12} />
                        Occupied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs bg-zinc-900 text-zinc-400 border-2 border-zinc-700 px-3 py-1 uppercase tracking-wide font-medium">
                        Vacant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(!properties || properties.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No properties registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function PayoutRow({ ledger }: { ledger: any }) {
  const { mutate: payOwner, isPending } = usePayOwner();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // 5% fee calculation
  const monthlyRent = ledger.property.monthlyRent;
  const fee = monthlyRent * 0.05;
  const payoutAmount = monthlyRent - fee;

  const form = useForm({
    defaultValues: {
      amountAdvanced: payoutAmount,
      proofOfTransferUrl: "",
    },
  });

  const onSubmit = (data: any) => {
    payOwner(
      { id: ledger.id, data: { ...data, amountAdvanced: Number(data.amountAdvanced) } },
      {
        onSuccess: () => {
          toast({ title: "Payout Processed", description: `Successfully marked ${ledger.property.address} as paid.` });
          setIsOpen(false);
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition-all duration-300"
    >
      <div className="mb-4 md:mb-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-medium text-white">{ledger.property.address}</h3>
          <span className="text-xs bg-zinc-800 text-white px-2 py-0.5 border border-zinc-600">
            DUE NOW
          </span>
        </div>
        <p className="text-zinc-500 text-sm">Owner ID: {ledger.property.ownerId.slice(0, 8)}...</p>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Net Payout</p>
          <p className="text-xl font-mono text-white">₹{payoutAmount.toLocaleString()}</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-white text-black hover:bg-zinc-200 border-0 rounded-none h-12 px-8 font-medium tracking-tight uppercase"
            >
              Process Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border-zinc-800 text-white sm:max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-tighter">Confirm Manual Transfer</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="p-4 border border-zinc-800 bg-zinc-900/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Monthly Rent</span>
                  <span>₹{monthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Platform Fee (5%)</span>
                  <span className="text-zinc-400">- ₹{fee.toLocaleString()}</span>
                </div>
                <div className="h-px bg-zinc-800 my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Transfer</span>
                  <span>₹{payoutAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Confirm Amount</label>
                <Input 
                  {...form.register("amountAdvanced")}
                  type="number" 
                  className="bg-zinc-950 border-zinc-800 text-white rounded-none h-12 focus:ring-1 focus:ring-white focus:border-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Bank Transfer Receipt</label>
                <FileUpload 
                  onFileChange={(dataUrl) => form.setValue("proofOfTransferUrl", dataUrl)}
                  currentValue={form.watch("proofOfTransferUrl")}
                />
                <p className="text-xs text-zinc-600">Upload screenshot of bank transfer as proof of payment.</p>
              </div>

              <Button 
                disabled={isPending}
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 border-0 rounded-none h-14 text-lg font-bold tracking-tight uppercase"
              >
                {isPending ? <Loader2 className="animate-spin mr-2" /> : "Confirm & Mark Paid"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
