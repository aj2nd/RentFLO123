import React from "react";
import { CheckCircle2, ChevronRight, Circle, ShieldCheck, MapPin, Receipt, CalendarClock, Wallet } from "lucide-react";

export function SilverElevated() {
  return (
    <div 
      className="min-h-screen w-full max-w-[390px] mx-auto overflow-hidden font-sans pb-24"
      style={{
        background: "linear-gradient(145deg, #1f2128 0%, #121318 100%)",
        color: "#E8E8E8"
      }}
    >
      {/* Top Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f5]">Tenant Dashboard</h1>
          <div className="flex items-center gap-1.5 bg-[#6FFFE9]/10 text-[#6FFFE9] px-2.5 py-1 rounded-full text-xs font-medium border border-[#6FFFE9]/20 shadow-[0_0_10px_rgba(111,255,233,0.1)]">
            <ShieldCheck size={14} className="text-[#6FFFE9]" />
            <span>Secure Pay</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 text-[#a1a1aa] mt-1">
          <MapPin size={16} className="shrink-0 mt-0.5 text-[#d4d4d8]" />
          <p className="text-sm leading-tight text-[#d4d4d8]">Flat 4B, Brigade Metropolis, Bengaluru</p>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="px-5 flex gap-3 mb-6 overflow-x-auto snap-x no-scrollbar">
        <div 
          className="flex-1 min-w-[105px] snap-center rounded-2xl p-3 border border-[#3f3f46]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          style={{ background: "linear-gradient(180deg, rgba(63,63,70,0.3) 0%, rgba(39,39,42,0.3) 100%)" }}
        >
          <div className="text-[#a1a1aa] mb-1.5"><Receipt size={16} /></div>
          <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider mb-0.5 font-medium">Monthly Rent</div>
          <div className="text-sm font-semibold text-[#f4f4f5]">₹32,000</div>
        </div>
        <div 
          className="flex-1 min-w-[105px] snap-center rounded-2xl p-3 border border-[#3f3f46]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgba(63,63,70,0.3) 0%, rgba(39,39,42,0.3) 100%)" }}
        >
          <div className="absolute top-0 right-0 w-8 h-8 bg-[#6FFFE9]/10 blur-xl rounded-full mix-blend-screen" />
          <div className="text-[#6FFFE9] mb-1.5"><CalendarClock size={16} /></div>
          <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider mb-0.5 font-medium">Due In</div>
          <div className="text-sm font-semibold text-[#f4f4f5]">8 Days</div>
        </div>
        <div 
          className="flex-1 min-w-[105px] snap-center rounded-2xl p-3 border border-[#3f3f46]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          style={{ background: "linear-gradient(180deg, rgba(63,63,70,0.3) 0%, rgba(39,39,42,0.3) 100%)" }}
        >
          <div className="text-[#a1a1aa] mb-1.5"><Wallet size={16} /></div>
          <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider mb-0.5 font-medium">Paid YTD</div>
          <div className="text-sm font-semibold text-[#f4f4f5]">₹1.28L</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-6">
        <div className="flex bg-[#27272a]/50 p-1 rounded-xl border border-[#3f3f46]/40 shadow-inner">
          <button className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-[#3f3f46] text-white shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]">Overview</button>
          <button className="flex-1 py-1.5 text-sm font-medium rounded-lg text-[#a1a1aa]">Payments</button>
          <button className="flex-1 py-1.5 text-sm font-medium rounded-lg text-[#a1a1aa]">Lease</button>
        </div>
      </div>

      {/* Current Month Settlement Card */}
      <div className="px-5 mb-6">
        <div 
          className="rounded-[24px] p-5 border shadow-2xl relative overflow-hidden"
          style={{ 
            background: "linear-gradient(180deg, rgba(63,63,70,0.4) 0%, rgba(39,39,42,0.4) 100%)",
            borderColor: "rgba(255,255,255,0.15)"
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6FFFE9]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[#a1a1aa] text-xs uppercase tracking-widest font-semibold mb-1">Current Month</div>
              <div className="text-3xl font-light tracking-tight text-white flex items-baseline gap-1">
                <span className="text-xl text-[#a1a1aa]">₹</span>32,000
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#6FFFE9] font-medium bg-[#6FFFE9]/10 px-2 py-1 rounded-md border border-[#6FFFE9]/20">
                75% Settled
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="h-1.5 w-full bg-[#3f3f46] rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#6FFFE9]/80 to-[#6FFFE9] w-[75%] rounded-full shadow-[0_0_10px_rgba(111,255,233,0.5)]" />
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium">
              <span className="text-[#a1a1aa]">Paid <span className="text-white">₹24,000</span></span>
              <span className="text-[#a1a1aa]">Remaining <span className="text-white">₹8,000</span></span>
            </div>
          </div>

          <button className="w-full py-3.5 rounded-xl font-medium text-[#09090b] shadow-[0_0_20px_rgba(111,255,233,0.2)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6FFFE9 0%, #4CDDD0 100%)" }}
          >
            <span>Pay Now — ₹8,000</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className="px-5">
        <h3 className="text-sm font-medium text-[#d4d4d8] mb-3 px-1">Setup Progress</h3>
        <div 
          className="rounded-2xl p-4 border border-[#3f3f46]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          style={{ background: "linear-gradient(180deg, rgba(63,63,70,0.2) 0%, rgba(39,39,42,0.2) 100%)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xs text-[#a1a1aa]">3 of 4 steps completed</div>
            </div>
            <div className="text-xs font-medium text-[#6FFFE9]">75%</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 opacity-60">
              <CheckCircle2 size={18} className="text-[#6FFFE9]" />
              <span className="text-sm text-[#f4f4f5] line-through decoration-[#a1a1aa]">Verify Identity</span>
            </div>
            <div className="flex items-center gap-3 opacity-60">
              <CheckCircle2 size={18} className="text-[#6FFFE9]" />
              <span className="text-sm text-[#f4f4f5] line-through decoration-[#a1a1aa]">Sign Lease Agreement</span>
            </div>
            <div className="flex items-center gap-3 opacity-60">
              <CheckCircle2 size={18} className="text-[#6FFFE9]" />
              <span className="text-sm text-[#f4f4f5] line-through decoration-[#a1a1aa]">Setup Auto-Pay</span>
            </div>
            <div className="flex items-center gap-3 bg-[#3f3f46]/40 p-2.5 -mx-2.5 rounded-xl border border-[#52525b]/30">
              <Circle size={18} className="text-[#a1a1aa]" />
              <span className="text-sm text-white font-medium">Add Emergency Contact</span>
              <button className="ml-auto text-xs bg-[#27272a] hover:bg-[#3f3f46] px-3 py-1.5 rounded-lg border border-[#52525b]/50 text-white transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
