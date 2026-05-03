import React from 'react';
import { Home, ChevronRight, CheckCircle2 } from 'lucide-react';

export function SilverEditorial() {
  return (
    <div 
      className="min-h-screen w-full max-w-[390px] mx-auto overflow-hidden font-sans pb-24"
      style={{
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2a2a2f 100%)',
        color: '#ffffff'
      }}
    >
      <div className="p-6 pt-12">
        {/* Header */}
        <header className="mb-8">
          <p className="text-[13px] tracking-wide text-white/60 uppercase mb-1">Good morning, Priya</p>
          <h1 className="text-2xl font-semibold text-white/90">Dashboard</h1>
        </header>

        {/* Property Pill */}
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-10"
          style={{ background: '#2e2e35', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Home size={14} className="text-white/70" />
          <span className="text-sm font-medium text-white/80">Brigade Metropolis · 4B</span>
        </div>

        {/* Hero Rent Amount */}
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase mb-3">Monthly Rent</p>
          <h2 className="text-6xl font-serif tracking-tight text-white/95 mb-2 font-mono">₹32,000</h2>
        </div>

        {/* 3 Stat Pills */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex-1 rounded-2xl p-3 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px] tracking-widest text-white/40 uppercase mb-1">Due In</span>
            <span className="text-lg font-mono text-white/90">8d</span>
          </div>
          <div className="flex-1 rounded-2xl p-3 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px] tracking-widest text-white/40 uppercase mb-1">Settled</span>
            <span className="text-lg font-mono text-white/90">75%</span>
          </div>
          <div className="flex-1 rounded-2xl p-3 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px] tracking-widest text-white/40 uppercase mb-1">YTD</span>
            <span className="text-lg font-mono text-white/90">₹1.28L</span>
          </div>
        </div>

        {/* Settlement Card */}
        <div 
          className="rounded-3xl p-6 mb-10 relative overflow-hidden"
          style={{ 
            background: '#2e2e35', 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.4)'
          }}
        >
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Total Due</p>
              <p className="text-xl font-mono text-white/90">₹8,000</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Paid</p>
              <p className="text-xl font-mono text-white/50">₹24,000</p>
            </div>
          </div>

          <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '75%', backgroundColor: '#6FFFE9' }} />
          </div>

          <button 
            className="w-full py-4 rounded-xl font-medium flex items-center justify-center transition-opacity active:opacity-80"
            style={{ 
              backgroundColor: '#6FFFE9', 
              color: '#1a1a1c',
              textShadow: '0 1px 0 rgba(255,255,255,0.4)'
            }}
          >
            PAY ₹8,000
          </button>
        </div>

        {/* Recent History */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] tracking-widest text-white/40 uppercase">Recent History</h3>
            <span className="text-[11px] text-white/40 flex items-center cursor-pointer">View All <ChevronRight size={12} className="ml-1" /></span>
          </div>
          
          <div className="space-y-5">
            {[
              { date: 'Oct 01, 2023', amount: '₹32,000', status: 'Paid' },
              { date: 'Sep 03, 2023', amount: '₹32,000', status: 'Paid' },
              { date: 'Aug 01, 2023', amount: '₹32,000', status: 'Paid' }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center pb-5 border-b border-white/5 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">{item.date}</p>
                  <p className="text-[11px] text-white/40">{item.status}</p>
                </div>
                <p className="text-base font-mono text-white/90">{item.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: '#6FFFE9' }} />
            <span className="text-xs text-white/60">KYC Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: '#6FFFE9' }} />
            <span className="text-xs text-white/60">Agreement Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
