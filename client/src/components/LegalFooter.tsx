import { Link } from "wouter";

export function LegalFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 py-4 px-8 z-40">
      <div className="flex items-center justify-center gap-8 text-xs text-zinc-500">
        <span style={{ fontFamily: 'Inter, sans-serif' }}>
          &copy; {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.
        </span>
        <div className="flex items-center gap-4">
          <Link 
            href="/terms" 
            className="hover:text-white transition-colors"
            data-testid="link-terms"
          >
            Terms of Service
          </Link>
          <span className="text-zinc-800">|</span>
          <Link 
            href="/privacy" 
            className="hover:text-white transition-colors"
            data-testid="link-privacy"
          >
            Privacy Policy
          </Link>
          <span className="text-zinc-800">|</span>
          <Link 
            href="/refund" 
            className="hover:text-white transition-colors"
            data-testid="link-refund"
          >
            Cancellation/Refund Policy
          </Link>
          <span className="text-zinc-800">|</span>
          <Link 
            href="/support" 
            className="hover:text-white transition-colors"
            data-testid="link-contact-support"
          >
            Contact Support
          </Link>
        </div>
        <a 
          href="mailto:help@rentflo.com" 
          className="hover:text-white transition-colors"
          data-testid="link-support"
        >
          help@rentflo.com
        </a>
      </div>
    </footer>
  );
}
