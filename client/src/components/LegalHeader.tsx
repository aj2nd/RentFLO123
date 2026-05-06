import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function LegalHeader() {
  return (
    <header className="flex items-center justify-between mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Back to Home</span>
      </Link>
      <Link href="/" className="flex items-center gap-3" data-testid="link-legal-logo">
        <img
          src="/logo-icon.png"
          alt="RentFLO"
          style={{ width: 40, height: 40, objectFit: "contain" }}
        />
        <img
          src="/logo-wordmark-transparent.png"
          alt="RentFLO"
          className="dark:brightness-100 brightness-0"
          style={{ height: 32, objectFit: "contain" }}
        />
      </Link>
    </header>
  );
}
