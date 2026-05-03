import React from 'react';
import { Home, IndianRupee, MapPin, Receipt, Clock, CreditCard, ChevronRight, FileText } from 'lucide-react';

export function SilverTealBold() {
  return (
    <div 
      className="min-h-screen w-full max-w-[390px] mx-auto overflow-hidden flex flex-col font-sans"
      style={{ backgroundColor: '#0a0f1e', color: '#F0F0F5' }}
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-widest uppercase">
          Tenant Dashboard
        </h1>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ borderColor: 'rgba(111, 255, 233, 0.3)', backgroundColor: 'rgba(111, 255, 233, 0.1)' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6FFFE9' }} />
          <span className="text-[10px] font-bold tracking-wider" style={{ color: '#6FFFE9' }}>ACTIVE</span>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-6 flex-1 pb-24 overflow-y-auto">
        
        {/* Property Info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ borderColor: 'rgba(240, 240, 245, 0.2)', backgroundColor: 'rgba(240, 240, 245, 0.05)' }}>
            <MapPin size={18} style={{ color: '#6FFFE9' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold opacity-60 uppercase tracking-wider mb-1">Current Property</h2>
            <p className="font-medium text-lg leading-tight">Flat 4B, Brigade Metropolis, Bengaluru</p>
          </div>
        </div>

        {/* Stats Chips */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="shrink-0 border p-3 rounded-xl min-w-[140px]" style={{ borderColor: 'rgba(240, 240, 245, 0.3)' }}>
            <p className="text-xs opacity-60 font-semibold tracking-wide uppercase mb-2">Monthly Rent</p>
            <p className="text-xl font-bold">₹32,000</p>
          </div>
          <div className="shrink-0 border p-3 rounded-xl min-w-[140px]" style={{ borderColor: 'rgba(240, 240, 245, 0.3)' }}>
            <p className="text-xs opacity-60 font-semibold tracking-wide uppercase mb-2">Due In</p>
            <p className="text-xl font-bold" style={{ color: '#6FFFE9' }}>8d</p>
          </div>
          <div className="shrink-0 border p-3 rounded-xl min-w-[140px]" style={{ borderColor: 'rgba(240, 240, 245, 0.3)' }}>
            <p className="text-xs opacity-60 font-semibold tracking-wide uppercase mb-2">Paid YTD</p>
            <p className="text-xl font-bold">₹1,28,000</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(240, 240, 245, 0.1)' }}>
          <div className="flex-1 py-3 text-center border-b-2 font-bold text-sm tracking-wide" style={{ borderColor: '#6FFFE9', color: '#F0F0F5' }}>
            OVERVIEW
          </div>
          <div className="flex-1 py-3 text-center font-bold text-sm tracking-wide opacity-40">
            PAYMENTS
          </div>
          <div className="flex-1 py-3 text-center font-bold text-sm tracking-wide opacity-40">
            LEASE
          </div>
        </div>

        {/* Huge rent settlement card */}
        <div className="border rounded-2xl p-6 relative overflow-hidden" style={{ borderColor: 'rgba(240, 240, 245, 0.3)', backgroundColor: 'rgba(240, 240, 245, 0.03)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full" style={{ backgroundColor: '#6FFFE9', transform: 'translate(30%, -30%)' }} />
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold tracking-widest uppercase opacity-50">Current Month</span>
            <div className="px-2 py-1 rounded text-[10px] font-bold tracking-wider border" style={{ color: '#6FFFE9', borderColor: '#6FFFE9', backgroundColor: 'rgba(111, 255, 233, 0.1)' }}>
              75% SETTLED
            </div>
          </div>
          
          <div className="text-5xl font-extrabold tracking-tight mb-8">
            ₹32,000
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span className="opacity-70">Paid ₹24,000</span>
              <span style={{ color: '#6FFFE9' }}>Due ₹8,000</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(240, 240, 245, 0.2)' }}>
              <div className="h-full rounded-full" style={{ width: '75%', backgroundColor: '#6FFFE9' }} />
            </div>
          </div>
          
          <button className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2" style={{ backgroundColor: '#6FFFE9', color: '#0a0f1e' }}>
            Pay Now ₹8,000 <ChevronRight size={18} />
          </button>
        </div>

        {/* Recent Payments */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Recent Transactions</h3>
          <div className="flex flex-col gap-3">
            {[
              { date: 'Oct 01, 2023', amount: '₹32,000', status: 'PAID' },
              { date: 'Sep 02, 2023', amount: '₹32,000', status: 'PAID' },
              { date: 'Aug 01, 2023', amount: '₹32,000', status: 'PAID' },
            ].map((payment, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl" style={{ borderColor: 'rgba(240, 240, 245, 0.15)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 240, 245, 0.05)' }}>
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Rent Payment</p>
                    <p className="text-xs opacity-50">{payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{payment.amount}</p>
                  <p className="text-[10px] font-bold tracking-wider" style={{ color: '#6FFFE9' }}>{payment.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Nav Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] border-t px-6 py-4 flex justify-between items-center z-10 backdrop-blur-md" style={{ borderColor: 'rgba(240, 240, 245, 0.1)', backgroundColor: 'rgba(10, 15, 30, 0.8)' }}>
        <button className="flex flex-col items-center gap-1 opacity-100">
          <Home size={20} style={{ color: '#6FFFE9' }} />
          <span className="text-[10px] font-bold tracking-wider">HOME</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-50">
          <CreditCard size={20} />
          <span className="text-[10px] font-bold tracking-wider">PAY</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-50">
          <FileText size={20} />
          <span className="text-[10px] font-bold tracking-wider">LEASE</span>
        </button>
      </div>

      {/* Global CSS overrides for hiding scrollbar if not in index.css */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
