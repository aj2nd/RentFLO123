import React from 'react';
import { CheckCircle2, Circle, Home, CreditCard, FileText, ChevronRight, Bell, ShieldCheck } from 'lucide-react';

export function Glass() {
  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-b from-black to-zinc-900 text-white font-sans relative pb-24" style={{ width: "390px", margin: "0 auto", border: "1px solid #333" }}>
      {/* Background Glow */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#6FFFE9] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      {/* Header area */}
      <div className="px-6 pt-12 pb-6 flex flex-col gap-6 relative z-10">
        {/* Progress Bar */}
        <div className="flex items-center justify-between relative mt-4">
          <div className="absolute left-0 top-3 w-full h-[2px] bg-white/10 rounded-full" />
          <div className="absolute left-0 top-3 w-2/3 h-[2px] bg-[#6FFFE9] rounded-full shadow-[0_0_10px_#6FFFE9]" />
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6FFFE9] flex items-center justify-center shadow-[0_0_10px_rgba(111,255,233,0.5)]">
              <CheckCircle2 className="w-4 h-4 text-black" />
            </div>
            <span className="text-[10px] text-[#6FFFE9] font-medium">Verify Identity</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6FFFE9] flex items-center justify-center shadow-[0_0_10px_rgba(111,255,233,0.5)]">
              <CheckCircle2 className="w-4 h-4 text-black" />
            </div>
            <span className="text-[10px] text-[#6FFFE9] font-medium">Sign Agreement</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-white/20 flex items-center justify-center backdrop-blur-md">
              <Circle className="w-3 h-3 text-white/50" />
            </div>
            <span className="text-[10px] text-white/50 font-medium">Pay Rent</span>
          </div>
        </div>

        <div className="flex justify-between items-start mt-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#6FFFE9]" />
              <span className="text-[10px] font-semibold tracking-wider text-[#6FFFE9] uppercase flex items-center gap-2">
                RENTFLO SECURE PAY
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9] animate-pulse" />
              </span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white/90">Tenant Dashboard</h1>
            <p className="text-sm text-white/50 flex items-center gap-1.5 mt-1">
              <Home className="w-3.5 h-3.5" />
              Indra Nagar, Bangalore
            </p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center relative mt-8">
            <Bell className="w-5 h-5 text-white/70" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#6FFFE9] rounded-full border-2 border-zinc-900" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="px-6 flex gap-3 overflow-x-auto pb-4 scrollbar-hide relative z-10">
        <div className="min-w-[140px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Monthly Rent</p>
          <p className="text-xl font-medium">₹25,000</p>
        </div>
        <div className="min-w-[120px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Due In</p>
          <p className="text-xl font-medium">29d</p>
        </div>
        <div className="min-w-[120px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Paid YTD</p>
          <p className="text-xl font-medium">₹0</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 mt-4 flex flex-col gap-6 relative z-10">
        {/* Tab Bar */}
        <div className="flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
          <button className="flex-1 py-2 rounded-full bg-white/10 text-white text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.2)]">Overview</button>
          <button className="flex-1 py-2 rounded-full text-white/50 text-sm font-medium hover:text-white/80 transition-colors">Payments</button>
          <button className="flex-1 py-2 rounded-full text-white/50 text-sm font-medium hover:text-white/80 transition-colors">Lease</button>
        </div>

        {/* Current Month Card */}
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6FFFE9]/10 rounded-full blur-[50px]" />
          
          <h2 className="text-sm text-white/60 font-medium mb-1 relative z-10">Current Month</h2>
          <div className="flex items-end gap-2 mb-6 relative z-10">
            <span className="text-4xl font-light tracking-tight">₹25,000</span>
            <span className="text-sm text-white/50 mb-1">total</span>
          </div>

          <div className="mb-8 relative z-10">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/50">Settlement Progress</span>
              <span className="text-white/80">0%</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="w-0 h-full bg-[#6FFFE9] rounded-full shadow-[0_0_10px_#6FFFE9]" />
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6FFFE9] to-[#45d1bd] text-black font-semibold text-lg shadow-[0_0_20px_rgba(111,255,233,0.3)] hover:shadow-[0_0_30px_rgba(111,255,233,0.5)] transition-shadow relative z-10 flex items-center justify-center gap-2">
            Pay Now — ₹25,000
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Checklist */}
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-white/90">Getting Started</h3>
              <p className="text-xs text-white/50 mt-1">2 of 4 steps completed</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#6FFFE9] flex items-center justify-center relative shadow-[0_0_15px_rgba(111,255,233,0.2)]">
              <span className="text-xs font-semibold text-[#6FFFE9]">50%</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-5 h-5 rounded-full bg-[#6FFFE9] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-black" />
              </div>
              <div>
                <p className="text-sm font-medium line-through">Verify Identity</p>
                <p className="text-xs mt-0.5">Aadhaar verified successfully</p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-5 h-5 rounded-full bg-[#6FFFE9] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-black" />
              </div>
              <div>
                <p className="text-sm font-medium line-through">Sign Agreement</p>
                <p className="text-xs mt-0.5">Lease digitally signed</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                <Circle className="w-2 h-2 text-transparent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">Pay First Month Rent</p>
                <p className="text-xs text-white/50 mt-0.5">Required before move-in</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                <Circle className="w-2 h-2 text-transparent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">Setup Auto-Pay</p>
                <p className="text-xs text-white/50 mt-0.5">Never miss a due date</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-[390px] h-20 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-6 z-50 rounded-b-[2rem] md:rounded-none">
        <div className="flex flex-col items-center gap-1 opacity-100 text-[#6FFFE9]">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50 text-white hover:opacity-100 transition-opacity">
          <CreditCard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50 text-white hover:opacity-100 transition-opacity">
          <FileText className="w-6 h-6" />
          <span className="text-[10px] font-medium">Docs</span>
        </div>
      </div>
    </div>
  );
}
