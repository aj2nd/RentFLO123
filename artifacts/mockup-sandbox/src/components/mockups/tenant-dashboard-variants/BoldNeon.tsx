import React from 'react';
import { Check, ChevronRight, Home, CreditCard, FileText } from 'lucide-react';
import './_group.css';

export function BoldNeon() {
  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-black text-white font-mono relative" style={{ width: "390px", margin: "0 auto" }}>
      {/* Setup Progress */}
      <div className="p-4 pt-8 pb-2 border-b border-[#6FFFE9]/20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6FFFE9] animate-pulse shadow-[0_0_8px_#6FFFE9]" />
            <span className="text-[10px] text-[#6FFFE9] tracking-widest font-semibold">RENTFLO SECURE PAY</span>
          </div>
        </div>
        
        <div className="flex justify-between relative mb-2 z-0">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-zinc-900 -z-10 -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 w-[66%] h-[2px] bg-[#6FFFE9] -z-10 -translate-y-1/2 shadow-[0_0_10px_#6FFFE9]" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border border-[#6FFFE9] shadow-[0_0_12px_rgba(111,255,233,0.4)] flex items-center justify-center text-[#6FFFE9]">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-[9px] text-zinc-400">Verify Identity</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border border-[#6FFFE9] shadow-[0_0_12px_rgba(111,255,233,0.4)] flex items-center justify-center text-[#6FFFE9]">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-[9px] text-zinc-400">Sign Agreement</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border border-zinc-700 flex items-center justify-center text-zinc-500">
              <span className="text-[10px] font-bold">3</span>
            </div>
            <span className="text-[9px] text-[#6FFFE9]">Pay Rent</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Tenant Dashboard</h1>
          <p className="text-zinc-500 text-sm flex items-center gap-1">
            Indra Nagar, Bangalore
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-black neon-border rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 block">Monthly Rent</span>
            <span className="text-sm font-bold neon-text">₹25,000</span>
          </div>
          <div className="bg-black neon-border rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 block">Due In</span>
            <span className="text-sm font-bold text-white">29d</span>
          </div>
          <div className="bg-black neon-border rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 block">Paid YTD</span>
            <span className="text-sm font-bold text-white">₹0</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-6 border-b border-zinc-800 mb-6">
          <div className="pb-3 border-b-2 border-[#6FFFE9] shadow-[0_2px_10px_rgba(111,255,233,0.5)]">
            <span className="text-sm font-medium neon-text">Overview</span>
          </div>
          <div className="pb-3">
            <span className="text-sm font-medium text-zinc-500">Payments</span>
          </div>
          <div className="pb-3">
            <span className="text-sm font-medium text-zinc-500">Lease</span>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-sm font-bold">Getting Started</h2>
            <span className="text-xs text-[#6FFFE9]">2/4 Completed</span>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-[#6FFFE9] shadow-[0_0_10px_#6FFFE9] w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>
          <div className="bg-black border border-zinc-800 rounded-lg divide-y divide-zinc-900">
            <div className="p-3 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Check size={16} className="text-[#6FFFE9]" />
                <span className="text-sm line-through">KYC Verification</span>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Check size={16} className="text-[#6FFFE9]" />
                <span className="text-sm line-through">E-Sign Agreement</span>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between neon-bg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-[#6FFFE9] shadow-[0_0_8px_rgba(111,255,233,0.3)]" />
                <span className="text-sm text-white">Pay Advance Rent</span>
              </div>
              <ChevronRight size={16} className="text-[#6FFFE9]" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-zinc-700" />
                <span className="text-sm text-zinc-400">Setup Auto-Pay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Month Card */}
        <div className="neon-bg neon-border rounded-xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6FFFE9] blur-[80px] opacity-20 rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <span className="text-xs text-[#6FFFE9] uppercase tracking-wider mb-1 block font-semibold">Current Due</span>
              <div className="text-3xl font-bold tracking-tighter">₹25,000</div>
            </div>
            <div className="bg-black/50 backdrop-blur border border-[#6FFFE9]/30 px-2 py-1 rounded text-xs text-[#6FFFE9]">
              Due Today
            </div>
          </div>
          
          <div className="mb-6 relative z-10">
            <div className="flex justify-between text-xs mb-2 text-zinc-400">
              <span>Settlement Progress</span>
              <span className="text-[#6FFFE9]">0%</span>
            </div>
            <div className="h-1 bg-black rounded-full overflow-hidden border border-[#6FFFE9]/20">
              <div className="w-0 h-full bg-[#6FFFE9]" />
            </div>
          </div>
          
          <button className="w-full bg-black neon-border py-4 rounded-lg font-bold neon-text uppercase tracking-widest text-sm relative z-10 hover:bg-[#6FFFE9]/10 transition-colors flex items-center justify-center gap-2">
            Pay Now <span className="text-white">— ₹25,000</span>
          </button>
        </div>

      </div>

      <div className="pb-24" />

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-[390px] bg-black border-t border-zinc-900 pb-8 pt-4 px-6 flex justify-between z-50">
        <div className="flex flex-col items-center gap-1 text-[#6FFFE9] drop-shadow-[0_0_8px_rgba(111,255,233,0.5)]">
          <Home size={20} />
          <span className="text-[10px]">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-zinc-600">
          <CreditCard size={20} />
          <span className="text-[10px]">Pay</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-zinc-600">
          <FileText size={20} />
          <span className="text-[10px]">Lease</span>
        </div>
      </div>
    </div>
  );
}