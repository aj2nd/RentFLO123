import { Building2, ShieldCheck, Users } from "lucide-react";
import { LegalHeader } from "@/components/LegalHeader";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-24" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        <LegalHeader />
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
          About RentFLO
        </h1>
        <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
          RentFLO makes renting simpler by helping property owners receive rent upfront
          and giving tenants flexible ways to settle their payments.
        </p>

        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          {[
            { icon: Building2, title: "For Owners", text: "Receive predictable rent payments without chasing collections." },
            { icon: Users, title: "For Tenants", text: "Choose payment schedules that fit your monthly cash flow." },
            { icon: ShieldCheck, title: "Built on Trust", text: "Secure verification and transparent payment coordination." },
          ].map(({ icon: Icon, title, text }) => (
            <section key={title} className="border border-zinc-800 p-6">
              <Icon className="w-7 h-7 text-white mb-4" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
            </section>
          ))}
        </div>

        <section className="border-t border-zinc-800 pt-8 text-zinc-300 leading-relaxed">
          <h2 className="text-2xl font-semibold mb-4 text-white" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Making rent work better
          </h2>
          <p>
            RentFLO brings owners and tenants onto one straightforward platform for
            property setup, identity verification, rent collection, and payment
            coordination.
          </p>
        </section>
      </div>
    </div>
  );
}