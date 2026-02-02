import { useLedgers, usePayOwner, useAdminDashboard } from "@/hooks/use-ledgers";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Loader2, AlertCircle, Upload, Check, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";

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
            <p className="text-xs text-green-500 flex items-center gap-1">
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
  
  const isLoading = statsLoading || ledgersLoading;

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
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Financial Overview</h1>
        <p className="text-zinc-500 max-w-xl">
          Track property performance, manage payouts, and reconcile ledgers. 
          System status: <span className="text-white font-medium">Operational</span>
        </p>
      </header>

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
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ffffff' : '#52525b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
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
          <span className="text-xs bg-red-900/30 text-red-500 px-2 py-0.5 border border-red-900/50">
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
                  <span className="text-red-400">- ₹{fee.toLocaleString()}</span>
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
