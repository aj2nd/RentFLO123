import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function LegalHeader() {
  return (
    <header className="flex items-center mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Back to Home</span>
      </Link>
    </header>
  );
}
