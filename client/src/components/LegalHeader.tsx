import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import houseLogoImg from "@assets/IMG_7091_1777311348772.png";

export function LegalHeader() {
  return (
    <header className="flex items-center justify-between mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Back to Home</span>
      </Link>
      <Link href="/" className="flex items-center gap-2" data-testid="link-legal-logo">
        <img src={houseLogoImg} alt="RentFLO" className="w-7 h-7 object-contain" />
        <span className="text-lg font-bold tracking-tighter text-white" style={{ fontFamily: 'Inter, sans-serif' }}>RentFLO</span>
      </Link>
    </header>
  );
}
