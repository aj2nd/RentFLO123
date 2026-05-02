import { Link } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/SidebarContext";

export function LegalFooter() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const hasSidebar = !!user?.role;

  const leftOffset = hasSidebar && !collapsed ? '256px' : '0px';

  return (
    <footer
      className="fixed bottom-0 right-0 bg-black border-t border-white/[0.05] z-40 transition-all duration-300 ease-in-out"
      style={{ left: leftOffset }}
    >
      <div className="overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-5 text-[11px] text-white/20 py-3 px-6 whitespace-nowrap min-w-max font-medium tracking-wide">
          <span>&copy; {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.</span>
          <span className="text-white/10">|</span>
          <Link href="/terms" className="hover:text-white/50 transition-colors" data-testid="link-terms">
            {t('terms')}
          </Link>
          <span className="text-white/10">|</span>
          <Link href="/privacy" className="hover:text-white/50 transition-colors" data-testid="link-privacy">
            {t('privacy')}
          </Link>
          <span className="text-white/10">|</span>
          <Link href="/refund" className="hover:text-white/50 transition-colors" data-testid="link-refund">
            {t('footer_refund')}
          </Link>
          <span className="text-white/10">|</span>
          <Link href="/support" className="hover:text-white/50 transition-colors" data-testid="link-contact-support">
            {t('contact_support')}
          </Link>
          <span className="text-white/10">|</span>
          <a href="mailto:help@rentflo.com" className="hover:text-white/50 transition-colors" data-testid="link-support">
            help@rentflo.com
          </a>
        </div>
      </div>
    </footer>
  );
}
