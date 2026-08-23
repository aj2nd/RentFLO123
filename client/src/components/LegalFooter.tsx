/** Design: standard legal footer with an optional in-flow black tenant-home presentation. */
import { Link } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/SidebarContext";

export function LegalFooter({ embedded = false, forceVisible = false }: { embedded?: boolean; forceVisible?: boolean }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const hasSidebar = !!user?.role;

  if (hasSidebar && !forceVisible) return null;

  return (
    <footer className={embedded ? "bg-black border-t border-white/[0.08]" : "fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"}>
      <div className="overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={`flex items-center gap-5 text-[11px] ${embedded ? "justify-center flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/45 py-5 px-5 whitespace-normal min-w-0" : "text-muted-foreground py-3 px-6 whitespace-nowrap min-w-max"} font-medium tracking-wide`}>
          <span>&copy; {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.</span>
          <span className="opacity-30">|</span>
          <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">
            {t('terms')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
            {t('privacy')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/refund" className="hover:text-foreground transition-colors" data-testid="link-refund">
            {t('footer_refund')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/support" className="hover:text-foreground transition-colors" data-testid="link-contact-support">
            {t('contact_support')}
          </Link>
          <span className="opacity-30">|</span>
          <a href="mailto:help@rentflo.com" className="hover:text-foreground transition-colors" data-testid="link-support">
            help@rentflo.com
          </a>
        </div>
      </div>
    </footer>
  );
}
