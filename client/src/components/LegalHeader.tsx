import { Link } from "wouter";
import { House } from "lucide-react";

export function LegalHeader() {
  return (
    <header className="flex items-center mb-12">
      <Link
        href="/"
        className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors group"
        data-testid="link-back-home"
        aria-label="Back to Home"
        title="Back to Home"
      >
        <House size={20} strokeWidth={1.75} className="group-hover:scale-110 transition-transform" />
      </Link>
    </header>
  );
}
