import React, { useEffect, useState } from 'react';
import { Check, Download, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Custom styles for animations that are hard to do with just Tailwind arbitrary values
const customStyles = `
  @keyframes drawCircle {
    to { stroke-dashoffset: 0; }
  }
  @keyframes drawCheck {
    to { stroke-dashoffset: 0; }
  }
  @keyframes glowPulse {
    0% { box-shadow: 0 0 20px 0px rgba(111, 255, 233, 0.2); }
    50% { box-shadow: 0 0 40px 10px rgba(111, 255, 233, 0.4); }
    100% { box-shadow: 0 0 20px 0px rgba(111, 255, 233, 0.2); }
  }
  @keyframes burst {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
  }
  @keyframes slideUpFade {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up-fade {
    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

const Particles = () => {
  const particles = Array.from({ length: 40 }).map((_, i) => {
    const angle = (i * 360) / 40;
    const distance = 100 + Math.random() * 150;
    const tx = Math.cos((angle * Math.PI) / 180) * distance;
    const ty = Math.sin((angle * Math.PI) / 180) * distance;
    const size = 3 + Math.random() * 5;
    const colors = ['#6FFFE9', '#FFFFFF', '#45A29E', '#C5C6C7'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 0.2;
    const duration = 0.8 + Math.random() * 0.5;

    return (
      <div
        key={i}
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          '--tx': \`\${tx}px\`,
          '--ty': \`\${ty}px\`,
          animation: \`burst \${duration}s ease-out \${delay}s forwards\`,
          opacity: 0,
        } as React.CSSProperties}
      />
    );
  });

  return <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">{particles}</div>;
};

const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="font-playfair font-semibold">
      ₹{count.toLocaleString('en-IN')}
    </span>
  );
};

export function PaymentReceipt() {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDetails(true);
    }, 1500); // Wait for the main animations to finish before showing details
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-inter flex flex-col relative overflow-hidden items-center justify-center p-6">
      <style>{customStyles}</style>
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#6FFFE9] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#6FFFE9] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-20 flex flex-col items-center">
        
        {/* Success Icon & Particles Container */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          <Particles />
          
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center relative bg-black/50 backdrop-blur-sm z-20"
            style={{ animation: 'glowPulse 3s infinite ease-in-out' }}
          >
            <svg className="w-24 h-24 absolute inset-0" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#6FFFE9"
                strokeWidth="4"
                strokeDasharray="289"
                strokeDashoffset="289"
                className="drop-shadow-[0_0_8px_rgba(111,255,233,0.5)]"
                style={{ animation: 'drawCircle 1s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
                strokeLinecap="round"
              />
              <path
                d="M30 50 L45 65 L70 35"
                fill="none"
                stroke="#6FFFE9"
                strokeWidth="6"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="drop-shadow-[0_0_8px_rgba(111,255,233,0.5)]"
                style={{ animation: 'drawCheck 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards' }}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center mb-10 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.2s' }}>
          <h2 className="text-[#6FFFE9] font-medium tracking-widest text-sm uppercase mb-2">Payment Successful</h2>
          <div className="text-6xl text-white tracking-tight">
            <AnimatedCounter value={50000} duration={2500} />
          </div>
        </div>

        {/* Receipt Details Card */}
        <div className={\`w-full transition-all duration-700 ease-out \${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}\`}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
            {/* Inner subtle glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6FFFE9] rounded-full blur-[80px] opacity-20 pointer-events-none" />
            
            <div className="space-y-5">
              <div className="flex justify-between items-center opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.6s' }}>
                <span className="text-white/50 text-sm">Status</span>
                <span className="bg-[#6FFFE9]/10 text-[#6FFFE9] px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-[#6FFFE9]/20">SETTLED</span>
              </div>
              
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex justify-between items-center opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.7s' }}>
                <span className="text-white/50 text-sm">Property</span>
                <span className="text-white text-sm font-medium">The Alturas, #402</span>
              </div>
              
              <div className="flex justify-between items-center opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.8s' }}>
                <span className="text-white/50 text-sm">Date</span>
                <span className="text-white text-sm font-medium">Oct 24, 2023 at 10:45 AM</span>
              </div>
              
              <div className="flex justify-between items-center opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.9s' }}>
                <span className="text-white/50 text-sm">Payment ID</span>
                <span className="text-white text-sm font-mono bg-white/5 px-2 py-0.5 rounded">TXN-8924719A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={\`w-full mt-10 space-y-4 transition-all duration-700 delay-300 ease-out \${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}\`}>
          <Button 
            className="w-full bg-[#6FFFE9] text-black hover:bg-[#5CE0CC] hover:scale-[1.02] transition-all h-14 rounded-xl font-medium text-lg shadow-[0_0_20px_rgba(111,255,233,0.3)] hover:shadow-[0_0_30px_rgba(111,255,233,0.5)]"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-white/70 hover:text-white hover:bg-white/5 h-14 rounded-xl font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>

      </div>
    </div>
  );
}

export default PaymentReceipt;
