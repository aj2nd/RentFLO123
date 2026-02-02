import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Nav */}
      <nav className="fixed w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <div className="text-2xl font-bold tracking-tighter">RentBro.</div>
        <Link href="/api/login" className="px-6 py-2 bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors rounded-none">
          LOGIN
        </Link>
      </nav>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] glow-text">
            LIQUIDITY<br />
            FOR<br />
            LANDLORDS.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-md border-l border-zinc-800 pl-6">
            We pay your rent on the 1st. <br/>
            Your tenant pays us later. <br/>
            Zero friction.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <Link href="/api/login" className="inline-flex items-center justify-center h-14 px-8 bg-white text-black font-bold text-lg tracking-tight hover:bg-zinc-200 transition-all group rounded-none">
              GET STARTED <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="inline-flex items-center justify-center h-14 px-8 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all font-medium rounded-none">
              VIEW DEMO
            </button>
          </div>
        </div>

        <div className="relative hidden lg:block h-[600px] w-full bg-zinc-950 border border-zinc-900 p-8 overflow-hidden group">
          {/* Abstract UI Representation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-950 to-zinc-900 opacity-80" />
          
          <div className="relative z-10 space-y-6">
             <div className="w-full h-40 border border-white/10 bg-black/50 backdrop-blur-md p-6 flex flex-col justify-between group-hover:translate-y-[-5px] transition-transform duration-500">
               <div className="flex justify-between">
                 <div className="h-2 w-20 bg-zinc-800 rounded-full"></div>
                 <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
               </div>
               <div className="space-y-2">
                 <div className="h-10 w-48 bg-white/10 rounded-sm"></div>
                 <div className="h-3 w-32 bg-zinc-800 rounded-full"></div>
               </div>
             </div>

             <div className="w-full h-40 border border-white/10 bg-black/50 backdrop-blur-md p-6 flex flex-col justify-between group-hover:translate-y-[-5px] transition-transform duration-500 delay-100">
               <div className="flex justify-between">
                 <div className="h-2 w-20 bg-zinc-800 rounded-full"></div>
                 <div className="h-2 w-2 bg-zinc-800 rounded-full"></div>
               </div>
               <div className="space-y-2">
                 <div className="h-10 w-32 bg-white/10 rounded-sm"></div>
                 <div className="h-3 w-24 bg-zinc-800 rounded-full"></div>
               </div>
             </div>
             
             <div className="absolute bottom-8 right-8">
               <div className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider">
                 Rent Guaranteed
               </div>
             </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-24 px-6 md:px-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
           <Feature 
             title="Instant Payouts" 
             desc="Rent is credited to your bank account on day 1, regardless of when the tenant pays."
           />
           <Feature 
             title="Automated Ledger" 
             desc="Real-time tracking of all your properties, advanced amounts, and settlements."
           />
           <Feature 
             title="Risk Free" 
             desc="We assume the risk of tenant delays. You maintain consistent cash flow."
           />
        </div>
      </section>
      
      <footer className="py-12 px-6 md:px-12 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <p>© 2025 RentBro Operating System. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Feature({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <CheckCircle2 className="w-8 h-8 text-white" />
      <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
