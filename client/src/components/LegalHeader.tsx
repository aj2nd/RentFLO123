import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import houseLogoImg from "@assets/IMG_7223_1777731010120.jpeg";

export function LegalHeader() {
  return (
    <header className="flex items-center justify-between mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-[#9DEFE4] hover:text-[#6FFFE9] transition-colors group"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Back to Home</span>
      </Link>
      <Link href="/" className="flex items-center gap-2" data-testid="link-legal-logo">
        <img src={houseLogoImg} alt="RentFLO" className="w-7 h-7 object-contain" />
        <span className="text-lg font-bold tracking-tighter text-[#6FFFE9]" style={{ fontFamily: 'Inter, sans-serif' }}>RentFLO</span>
      </Link>
    </header>
  );
}
