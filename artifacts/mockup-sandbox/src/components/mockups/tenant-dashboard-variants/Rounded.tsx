import React from "react";
import { CheckCircle2, ChevronRight, MapPin, Receipt } from "lucide-react";

export function Rounded() {
  return (
    <div className="min-h-screen overflow-y-auto bg-black text-zinc-100 font-sans relative" style={{ width: "390px" }}>
      {/* Soft Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-teal-900/10 blur-3xl rounded-full pointer-events-none -translate-y-1/2"></div>
      
      <div className="relative p-5 space-y-8 pb-32">
        {/* Setup Progress */}
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-black/50 border border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                <CheckCircle2 size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-medium text-teal-400">Verify</span>
            </div>
            <div className="h-[2px] flex-1 bg-teal-500/30 mx-2 rounded-full relative">
              <div className="absolute top-0 left-0 h-full w-full bg-teal-500 rounded-full"></div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                <CheckCircle2 size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-medium text-teal-400">Sign</span>
            </div>
            <div className="h-[2px] flex-1 bg-zinc-800 mx-2 rounded-full relative">
               <div className="absolute top-0 left-0 h-full w-1/2 bg-teal-500 rounded-full"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                <span className="text-xs font-bold">3</span>
              </div>
              <span className="text-[10px] font-medium text-zinc-400">Pay</span>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/50 border border-teal-900/50">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
              <span className="text-[10px] font-bold tracking-widest text-teal-300">RENTFLO SECURE PAY</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Tenant Dashboard</h1>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <MapPin size={14} className="text-zinc-500" />
              <p className="text-sm font-medium">Indra Nagar, Bangalore</p>
            </div>
          </div>
        </div>

        {/* 3 Stat Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800/50 flex flex-col items-center text-center shadow-lg shadow-black/40">
            <div className="px-2 py-0.5 rounded-full bg-zinc-800/80 text-[10px] text-zinc-400 font-medium mb-2">Monthly Rent</div>
            <div className="text-sm font-bold text-white">₹25,000</div>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800/50 flex flex-col items-center text-center shadow-lg shadow-black/40">
            <div className="px-2 py-0.5 rounded-full bg-amber-950/50 text-[10px] text-amber-400 font-medium mb-2 border border-amber-900/30">Due In</div>
            <div className="text-sm font-bold text-amber-100">29d</div>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800/50 flex flex-col items-center text-center shadow-lg shadow-black/40">
            <div className="px-2 py-0.5 rounded-full bg-zinc-800/80 text-[10px] text-zinc-400 font-medium mb-2">Paid YTD</div>
            <div className="text-sm font-bold text-white">₹0</div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex p-1 bg-zinc-900/60 rounded-full border border-zinc-800/50">
          <button className="flex-1 py-2 px-4 rounded-full bg-zinc-800 text-white text-sm font-semibold shadow-sm">Overview</button>
          <button className="flex-1 py-2 px-4 rounded-full text-zinc-400 text-sm font-medium hover:text-white transition-colors">Payments</button>
          <button className="flex-1 py-2 px-4 rounded-full text-zinc-400 text-sm font-medium hover:text-white transition-colors">Lease</button>
        </div>

        {/* Getting Started Checklist */}
        <div className="bg-zinc-900/80 rounded-3xl p-5 border border-zinc-800/50 shadow-lg shadow-black/40">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-semibold text-white text-lg">Getting Started</h3>
              <p className="text-xs text-zinc-400 mt-1">2 of 4 completed</p>
            </div>
            <div className="text-2xl font-bold text-teal-400">50%</div>
          </div>
          
          <div className="w-full h-2.5 bg-zinc-800 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full w-1/2"></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 opacity-60">
               <div className="text-teal-500"><CheckCircle2 size={20} /></div>
               <span className="text-sm font-medium text-zinc-300 line-through">Verify Identity</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 opacity-60">
               <div className="text-teal-500"><CheckCircle2 size={20} /></div>
               <span className="text-sm font-medium text-zinc-300 line-through">Sign Agreement</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-950/20 border border-teal-900/30">
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full border-2 border-teal-500/50"></div>
                 <span className="text-sm font-medium text-teal-100">Setup Autopay</span>
               </div>
               <ChevronRight size={16} className="text-teal-500" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800">
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full border-2 border-zinc-700"></div>
                 <span className="text-sm font-medium text-zinc-400">Pay First Month</span>
               </div>
            </div>
          </div>
        </div>

        {/* Current Month Card */}
        <div className="bg-zinc-900/80 rounded-3xl p-5 border border-zinc-800/50 shadow-lg shadow-black/40">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="inline-block px-2.5 py-1 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Current Month</div>
              <div className="text-3xl font-bold text-white">₹25,000</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-950/50 flex items-center justify-center border border-teal-900/50">
              <Receipt size={18} className="text-teal-400" />
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-400">Settlement Status</span>
              <span className="text-zinc-500">0%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-600 rounded-full w-0"></div>
            </div>
          </div>

          <button className="w-full py-4 rounded-full bg-teal-500 hover:bg-teal-400 text-black font-bold text-base transition-colors shadow-[0_4px_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2">
            Pay Now — ₹25,000
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
