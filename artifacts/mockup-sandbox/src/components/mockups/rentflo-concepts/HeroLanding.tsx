import React, { useState, useEffect, useRef } from 'react';
import { Play, ArrowRight, ShieldCheck, Zap, BarChart3, Bell } from 'lucide-react';

const CountUp = ({ end, duration, prefix = '', suffix = '', decimals = 0 }: { end: number, duration: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      
      const percentage = Math.min(progress / duration, 1);
      // easeOutExpo
      const easing = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const current = easing * end;
      setCount(current);
      
      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => {
      startTime.current = null;
    };
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export function HeroLanding() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const fullText1 = 'Never Chase';
  const fullText2 = 'Rent Again.';
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let i = 0;
    
    const typeLine1 = () => {
      if (i < fullText1.length) {
        setText1(fullText1.substring(0, i + 1));
        i++;
        timeout = setTimeout(typeLine1, 80);
      } else {
        i = 0;
        timeout = setTimeout(typeLine2, 300);
      }
    };
    
    const typeLine2 = () => {
      if (i < fullText2.length) {
        setText2(fullText2.substring(0, i + 1));
        i++;
        timeout = setTimeout(typeLine2, 80);
      }
    };
    
    timeout = setTimeout(typeLine1, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-['Inter',sans-serif] text-white selection:bg-[#6FFFE9] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        
        @keyframes meshGlow1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(5%, 5%) scale(1.1); opacity: 0.4; }
          66% { transform: translate(-5%, 10%) scale(0.9); opacity: 0.2; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        @keyframes meshGlow2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-10%, -10%) scale(0.9); opacity: 0.3; }
          66% { transform: translate(10%, -5%) scale(1.1); opacity: 0.1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        @keyframes meshGlow3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50% { transform: translate(15%, 5%) scale(1.2); opacity: 0.25; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
        }
        @keyframes drawLine {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        .tiffany-accent { color: #6FFFE9; }
        .tiffany-bg { background-color: #6FFFE9; }
        .tiffany-border { border-color: #6FFFE9; }
        
        .mesh-blob-1 {
          background: radial-gradient(circle, rgba(111,255,233,0.15) 0%, rgba(0,0,0,0) 70%);
          animation: meshGlow1 15s ease-in-out infinite;
        }
        .mesh-blob-2 {
          background: radial-gradient(circle, rgba(111,255,233,0.1) 0%, rgba(0,0,0,0) 70%);
          animation: meshGlow2 18s ease-in-out infinite;
        }
        .mesh-blob-3 {
          background: radial-gradient(circle, rgba(0,180,216,0.12) 0%, rgba(0,0,0,0) 70%);
          animation: meshGlow3 22s ease-in-out infinite;
        }
        
        .animate-draw-line {
          transform-origin: left;
          animation: drawLine 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          animation-delay: 1s;
          transform: scaleX(0);
        }
        
        .animate-reveal-1 { animation: revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; animation-delay: 1.2s; }
        .animate-reveal-2 { animation: revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; animation-delay: 1.4s; }
        .animate-reveal-3 { animation: revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; animation-delay: 1.6s; }
        .animate-reveal-4 { animation: revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; animation-delay: 1.8s; }
        
        .animate-float {
          animation: floatUp 8s ease-in-out infinite;
        }
      `}</style>

      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mesh-blob-1 mix-blend-screen blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] rounded-full mesh-blob-2 mix-blend-screen blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] rounded-full mesh-blob-3 mix-blend-screen blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-24 lg:pt-48 flex flex-col items-center text-center">
        {/* Navigation / Top Bar Placeholder */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 md:px-12 z-50">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-6 h-6 tiffany-bg rounded-none" />
            RentFLO.
          </div>
          <div className="hidden md:flex gap-8 text-sm text-gray-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Platform</a>
            <a href="#" className="hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-white transition-colors">Resources</a>
          </div>
          <div>
            <button className="text-sm font-semibold border-b border-transparent hover:border-white transition-all px-2 py-1">Login</button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 border border-[#6FFFE9]/30 bg-[#6FFFE9]/5 rounded-none animate-reveal-1">
            <span className="w-2 h-2 rounded-full tiffany-bg animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase tiffany-accent">The New Standard for Landlords</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-semibold leading-[1.1] tracking-tight mb-6 h-[120px] md:h-[180px] lg:h-[220px]">
            <span className="block">{text1}</span>
            <span className="block italic text-gray-400">
              {text2}
              <span className="tiffany-accent animate-pulse ml-1 inline-block -translate-y-2">|</span>
            </span>
          </h1>

          <div className="w-24 h-[2px] tiffany-bg mb-12 animate-draw-line" />

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-inter leading-relaxed mb-12 animate-reveal-2">
            Get 12 months of rent upfront. We handle collections, tenant screening, and default risk. You enjoy purely passive income.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-20 animate-reveal-3">
            <button className="group relative h-14 px-8 bg-[#6FFFE9] text-black font-semibold text-sm tracking-wide rounded-none overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="group h-14 px-8 bg-transparent border border-gray-700 hover:border-white text-white font-semibold text-sm tracking-wide rounded-none transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center group-hover:border-white transition-colors">
                <Play className="w-3 h-3 ml-0.5" />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-3xl border-t border-gray-800 pt-12 animate-reveal-4">
            <div className="flex flex-col items-center md:items-start text-left">
              <span className="text-4xl font-playfair font-semibold mb-2 flex items-center">
                <CountUp end={24} duration={2000} prefix="₹" suffix=" Cr+" />
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Rent Advanced</span>
            </div>
            <div className="flex flex-col items-center md:items-start text-left">
              <span className="text-4xl font-playfair font-semibold mb-2">
                <CountUp end={500} duration={2500} suffix="+" />
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Properties Managed</span>
            </div>
            <div className="flex flex-col items-center md:items-start text-left">
              <span className="text-4xl font-playfair font-semibold mb-2">
                <CountUp end={99.2} duration={2000} suffix="%" decimals={1} />
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">On-time Payouts</span>
            </div>
          </div>
        </div>

        {/* Floating App Mockup */}
        <div className="mt-32 w-full max-w-5xl relative animate-float">
          {/* Mockup Glow */}
          <div className="absolute inset-0 bg-[#6FFFE9] blur-[120px] opacity-10 rounded-[3rem] translate-y-12" />
          
          <div className="relative mx-auto w-full max-w-[320px] md:max-w-[800px] h-[600px] rounded-t-3xl md:rounded-t-[2.5rem] bg-gradient-to-b from-gray-900 to-black border border-gray-800 shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[#6FFFE9]/5">
            
            {/* Mobile View / Sidebar on Desktop */}
            <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-gray-800 bg-black/50 p-6 flex flex-col h-full shrink-0">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6FFFE9] to-blue-500 p-0.5">
                  <div className="w-full h-full bg-black rounded-full border-2 border-black overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-1">Available Balance</p>
                <h3 className="text-3xl font-playfair">₹12,45,000</h3>
                <div className="inline-flex items-center gap-1 mt-2 text-[#6FFFE9] text-xs font-medium bg-[#6FFFE9]/10 px-2 py-1">
                  +2.4% vs last month
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-4 rounded-none border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sea View Villa</span>
                    <span className="text-xs text-[#6FFFE9] border border-[#6FFFE9]/30 px-1.5 py-0.5">Active</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-lg">₹85,000<span className="text-xs text-gray-500">/mo</span></span>
                    <span className="text-xs text-gray-500">Due in 4 days</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-none border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Koramangala Apt</span>
                    <span className="text-xs text-[#6FFFE9] border border-[#6FFFE9]/30 px-1.5 py-0.5">Active</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-lg">₹45,000<span className="text-xs text-gray-500">/mo</span></span>
                    <span className="text-xs text-gray-500">Paid today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="hidden md:flex flex-1 p-8 flex-col bg-gradient-to-br from-gray-900/40 to-black relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FFFE9]/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-medium">Portfolio Overview</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-xs border border-gray-800 bg-black hover:bg-gray-900 transition-colors">1W</button>
                  <button className="px-4 py-2 text-xs border border-[#6FFFE9] text-[#6FFFE9] bg-[#6FFFE9]/10">1M</button>
                  <button className="px-4 py-2 text-xs border border-gray-800 bg-black hover:bg-gray-900 transition-colors">1Y</button>
                </div>
              </div>

              {/* Fake Chart */}
              <div className="h-48 border-b border-gray-800 relative flex items-end gap-2 pb-0 mb-8">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-0 bottom-1/3 border-t border-gray-800/50 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-2/3 border-t border-gray-800/50 pointer-events-none" />
                
                {[40, 65, 45, 80, 55, 90, 75, 100, 85].map((height, i) => (
                  <div key={i} className="flex-1 group relative">
                    <div 
                      className="w-full bg-gradient-to-t from-[#6FFFE9]/20 to-[#6FFFE9]/60 hover:to-[#6FFFE9] transition-all duration-500 ease-out"
                      style={{ height: `${height}%`, opacity: 0, animation: `revealUp 1s ease-out forwards ${1.5 + (i * 0.1)}s` }}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 border border-gray-800 bg-black/40">
                  <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Default Rate</div>
                  <div className="text-2xl font-playfair">0.0%</div>
                </div>
                <div className="p-5 border border-gray-800 bg-black/40">
                  <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Advance Issued</div>
                  <div className="text-2xl font-playfair">₹8.4L</div>
                </div>
                <div className="p-5 border border-gray-800 bg-black/40">
                  <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Yield Yield</div>
                  <div className="text-2xl font-playfair">8.2%</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default HeroLanding;
