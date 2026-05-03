import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, CreditCard, Bell, Menu, TrendingUp } from 'lucide-react';

export function GlassDashboard() {
  return (
    <div className="min-h-screen text-white font-sans bg-black relative overflow-x-hidden selection:bg-[#6FFFE9] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .glass-aurora-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 0;
          overflow: hidden;
        }
        
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: float 25s infinite ease-in-out alternate;
        }

        .blob-1 {
          top: -20%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(15, 76, 92, 0.8), transparent 70%);
        }

        .blob-2 {
          bottom: -20%;
          right: -10%;
          width: 70vw;
          height: 70vw;
          background: radial-gradient(circle, rgba(111, 255, 233, 0.25), transparent 70%);
          animation-direction: alternate-reverse;
          animation-duration: 30s;
        }

        .blob-3 {
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(0, 34, 40, 0.9), transparent 70%);
          animation-duration: 35s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, 12%) scale(1.05); }
          100% { transform: translate(-5%, 8%) scale(0.95); }
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-radius: 0;
        }
        
        .glass-panel-deep {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(60px) saturate(200%);
          -webkit-backdrop-filter: blur(60px) saturate(200%);
          border: 1px solid rgba(111, 255, 233, 0.15);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.5),
            inset 0 0 30px rgba(111, 255, 233, 0.03);
          border-radius: 0;
        }
        
        .glass-panel-light {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0;
        }

        .tiffany-text {
          color: #6FFFE9;
        }
        
        .tiffany-glow {
          text-shadow: 0 0 20px rgba(111, 255, 233, 0.4);
        }

        .tiffany-bg {
          background-color: #6FFFE9;
        }
        
        /* Chart grid lines */
        .glass-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* Background */}
      <div className="glass-aurora-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen font-inter p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center glass-panel px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 tiffany-bg flex items-center justify-center">
              <span className="text-black font-bold text-lg leading-none">R</span>
            </div>
            <span className="font-bold tracking-wider text-xl">RENTFLO</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-white/70 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/20">
              <span className="font-medium">JD</span>
            </div>
            <button className="md:hidden text-white/70 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Hero Card */}
          <div className="lg:col-span-2 glass-panel-deep p-8 md:p-12 relative overflow-hidden group">
            {/* Inner glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6FFFE9]/0 via-[#6FFFE9]/0 to-[#6FFFE9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <p className="text-white/60 text-sm md:text-base font-medium uppercase tracking-widest mb-4">
              Total Rent Advanced
            </p>
            
            <div className="flex items-baseline gap-2 mb-8">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight tiffany-text tiffany-glow">
                ₹2,40,000
              </h1>
              <span className="text-xl text-white/50">.00</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="tiffany-bg text-black px-8 py-3 font-semibold hover:bg-white transition-colors">
                Withdraw Funds
              </button>
              <button className="glass-panel-light px-8 py-3 font-semibold hover:bg-white/10 transition-colors">
                View Ledger
              </button>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 border border-[#6FFFE9]/20 rounded-full opacity-50"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-[#6FFFE9]/10 rounded-full opacity-50"></div>
          </div>

          {/* Side stats */}
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6 flex flex-col justify-center h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 inline-flex border border-white/10">
                  <Activity size={20} className="tiffany-text" />
                </div>
                <span className="flex items-center text-[#6FFFE9] text-sm font-medium">
                  <ArrowUpRight size={16} className="mr-1" />
                  +12.5%
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">Monthly Yield</p>
              <p className="text-3xl font-semibold">8.4%</p>
            </div>
            
            <div className="glass-panel p-6 flex flex-col justify-center h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 inline-flex border border-white/10">
                  <Wallet size={20} className="tiffany-text" />
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">Next Payout</p>
              <p className="text-3xl font-semibold">₹40,000</p>
              <p className="text-xs text-white/40 mt-2">Due in 4 days (Oct 1)</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Area */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Cash Flow</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs glass-panel-light">1M</button>
                <button className="px-3 py-1 text-xs tiffany-bg text-black font-medium">3M</button>
                <button className="px-3 py-1 text-xs glass-panel-light text-white/60">1Y</button>
              </div>
            </div>
            
            {/* Mock Chart */}
            <div className="flex-1 glass-grid relative min-h-[200px] mt-4 flex items-end">
              {/* Fake bars */}
              <div className="w-full flex justify-between items-end px-2 gap-2 h-full pb-6">
                {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                  <div key={i} className="w-full flex flex-col justify-end h-full relative group cursor-pointer">
                    <div 
                      className="w-full tiffany-bg opacity-70 group-hover:opacity-100 transition-all duration-300 relative z-10"
                      style={{ height: \`\${h}%\` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-white/40 font-medium px-2 pb-1">
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
                <span>JUL</span>
                <span>AUG</span>
                <span>SEP</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-medium mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[
                { title: "Rent Received", desc: "Unit 402 - Orion Heights", amount: "+₹40,000", type: 'in' },
                { title: "Advance Fee", desc: "Monthly platform fee", amount: "-₹1,200", type: 'out' },
                { title: "Rent Received", desc: "Unit 105 - Sea View", amount: "+₹35,000", type: 'in' },
                { title: "Payout Processed", desc: "Bank ending in •••492", amount: "-₹73,800", type: 'out' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass-panel-light flex items-center justify-center">
                      {item.type === 'in' ? 
                        <ArrowDownRight size={16} className="tiffany-text" /> : 
                        <ArrowUpRight size={16} className="text-white/60" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-[#6FFFE9] transition-colors">{item.title}</p>
                      <p className="text-xs text-white/50">{item.desc}</p>
                    </div>
                  </div>
                  <span className={\`text-sm font-medium \${item.type === 'in' ? 'tiffany-text' : 'text-white'}\`}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
              View All Transactions
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GlassDashboard;
