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
  const legalLinkClass = `${embedded ? "!inline-flex !h-[11px] !min-h-[11px] shrink-0 items-center" : ""} hover:text-foreground transition-colors`;

  if (hasSidebar && !forceVisible) return null;

  return (
    <footer className={embedded ? "bg-black border-t border-white/[0.08]" : "fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"}>
      <div className={`overflow-x-auto scrollbar-none ${embedded ? "flex h-[76px] items-center" : ""}`} style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={`flex items-center gap-5 text-[11px] leading-none [&>*]:self-center [&>*]:leading-none ${embedded ? "mx-auto text-white/45 px-6 py-0 whitespace-nowrap min-w-max" : "text-muted-foreground py-3 px-6 whitespace-nowrap min-w-max"} font-medium tracking-wide`}>
          <span>&copy; {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.</span>
          <span className="opacity-30">|</span>
          <Link href="/terms" className={legalLinkClass} data-testid="link-terms">
            {t('terms')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/privacy" className={legalLinkClass} data-testid="link-privacy">
            {t('privacy')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/refund" className={legalLinkClass} data-testid="link-refund">
            {t('footer_refund')}
          </Link>
          <span className="opacity-30">|</span>
          <Link href="/support" className={legalLinkClass} data-testid="link-contact-support">
            {t('contact_support')}
          </Link>
          <span className="opacity-30">|</span>
          <a href="mailto:help@rentflo.com" className={legalLinkClass} data-testid="link-support">
            help@rentflo.com
          </a>
        </div>
      </div>
    </footer>
  );
}
