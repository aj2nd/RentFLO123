import React from 'react';

export function Minimal() {
  return (
    <div className="min-h-screen overflow-y-auto bg-black text-white p-6 font-sans pb-32" style={{width: "390px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
      
      {/* RENTFLO SECURE PAY badge */}
      <div className="flex items-center gap-2 mb-12 mt-4">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
        <span className="text-[10px] tracking-widest uppercase text-zinc-400 font-mono">Rentflo Secure Pay</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-sm tracking-widest uppercase text-zinc-500 mb-2">Tenant Dashboard</h1>
        <p className="text-2xl font-serif">Indra Nagar, Bangalore</p>
      </div>

      <hr className="border-t border-white/10 mb-12" />

      {/* Main Stat */}
      <div className="mb-16">
        <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-4">Current Month</p>
        <div className="text-[5rem] leading-none font-serif tracking-tight mb-8">₹25k</div>
        
        <div className="flex justify-between items-end mb-4">
          <span className="text-[10px] tracking-widest uppercase text-zinc-500">Settlement Progress</span>
          <span className="text-[10px] font-mono text-zinc-400">0%</span>
        </div>
        <div className="h-px w-full bg-white/10 mb-8 relative">
          <div className="absolute top-0 left-0 h-full bg-white w-0"></div>
        </div>

        <button className="w-full py-4 border border-white/20 text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-300">
          Pay Now — ₹25,000
        </button>
      </div>

      <hr className="border-t border-white/10 mb-12" />

      {/* Setup Progress */}
      <div className="mb-12">
        <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-8">Setup Progress</p>
        <div className="flex justify-between items-center relative mb-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/10 z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-mono">1</div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-mono">2</div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-black border border-white/20 text-white flex items-center justify-center text-[10px] font-mono">3</div>
          </div>
        </div>
        <div className="flex justify-between text-[9px] uppercase tracking-wider text-zinc-500">
          <span className="text-white">Identity</span>
          <span className="text-white">Agreement</span>
          <span>Pay Rent</span>
        </div>
      </div>

      <hr className="border-t border-white/10 mb-12" />

      {/* 3 Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div>
          <p className="text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Monthly Rent</p>
          <p className="text-xl font-mono">₹25K</p>
        </div>
        <div>
          <p className="text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Due In</p>
          <p className="text-xl font-mono">29d</p>
        </div>
        <div>
          <p className="text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Paid YTD</p>
          <p className="text-xl font-mono">₹0</p>
        </div>
      </div>

      <hr className="border-t border-white/10 mb-12" />

      {/* Checklist */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[10px] tracking-widest uppercase text-zinc-500">Getting Started</p>
          <span className="text-[10px] font-mono text-zinc-400">50%</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-zinc-500 mt-1 font-serif">—</span>
            <div className="text-sm text-zinc-500 line-through">Verify Identity</div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-zinc-500 mt-1 font-serif">—</span>
            <div className="text-sm text-zinc-500 line-through">Sign Lease Agreement</div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-white mt-1 font-serif">—</span>
            <div className="text-sm text-white">Make First Payment</div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-white mt-1 font-serif">—</span>
            <div className="text-sm text-white">Set Up Auto-Pay</div>
          </div>
        </div>
      </div>

      {/* Tab bar (mock) */}
      <div className="fixed bottom-0 left-0 p-6 bg-black border-t border-white/10 z-50 w-[390px]">
        <div className="flex justify-between items-center">
          <button className="text-[10px] tracking-widest uppercase text-white">Overview</button>
          <button className="text-[10px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors">Payments</button>
          <button className="text-[10px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors">Lease</button>
        </div>
      </div>
    </div>
  );
}
