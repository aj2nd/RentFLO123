import { Link } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";

export function LegalFooter() {
  const { t } = useI18n();
  const { user } = useAuth();
  const hasSidebar = !!user?.role;

  return (
    <footer className={`fixed bottom-0 right-0 bg-black border-t border-zinc-900 z-40 ${hasSidebar ? "left-20 md:left-64" : "left-0"}`}>
      <div className="overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-6 text-xs text-zinc-500 py-4 px-6 whitespace-nowrap min-w-max">
          <span style={{ fontFamily: 'Inter, sans-serif' }}>
            &copy; {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.
          </span>
          <span className="text-zinc-800">|</span>
          <Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">
            {t('terms')}
          </Link>
          <span className="text-zinc-800">|</span>
          <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">
            {t('privacy')}
          </Link>
          <span className="text-zinc-800">|</span>
          <Link href="/refund" className="hover:text-white transition-colors" data-testid="link-refund">
            {t('footer_refund')}
          </Link>
          <span className="text-zinc-800">|</span>
          <Link href="/support" className="hover:text-white transition-colors" data-testid="link-contact-support">
            {t('contact_support')}
          </Link>
          <span className="text-zinc-800">|</span>
          <a href="mailto:help@rentflo.com" className="hover:text-white transition-colors" data-testid="link-support">
            help@rentflo.com
          </a>
        </div>
      </div>
    </footer>
  );
}
