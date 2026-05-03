import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt, Loader2, ShieldCheck, FileSignature, ChevronRight, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationBell } from "@/components/NotificationBell";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const { collapsed, toggle } = useSidebar();

  // Track the real rendered header height (handles glass/compact transitions)
  const [headerH, setHeaderH] = useState(210);
  useEffect(() => {
    const el = document.querySelector('.i18n-header') as HTMLElement | null;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!collapsed && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [collapsed]);

  const isActive = (path: string) => location === path;
  const role = user?.role;

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    refetchInterval: 15000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  const navItems: { href: string; icon: React.ReactNode; label: string; roles: string[]; badge?: number }[] = [
    { href: "/admin",             icon: <LayoutDashboard size={18} />, label: t('nav_admin_console'),    roles: ["ADMIN"] },
    { href: "/admin/maintenance", icon: <Wrench size={18} />,          label: t('nav_maintenance'),      roles: ["ADMIN"] },
    { href: "/owner",             icon: <Wallet size={18} />,          label: t('nav_owner_portal'),     roles: ["OWNER"] },
    { href: "/tenant",            icon: <Home size={18} />,            label: t('nav_tenant_dashboard'), roles: ["TENANT"] },
    { href: "/ledger",            icon: <Receipt size={18} />,         label: t('nav_ledger'),           roles: ["ADMIN", "OWNER", "TENANT"] },
    { href: "/verify",            icon: <ShieldCheck size={18} />,     label: t('nav_kyc'),              roles: ["OWNER", "TENANT"] },
    { href: "/agreement",         icon: <FileSignature size={18} />,   label: t('nav_agreement'),        roles: ["OWNER", "TENANT"] },
    { href: "/maintenance",       icon: <Wrench size={18} />,          label: "Maintenance",             roles: ["OWNER", "TENANT", "ADMIN"] },
    { href: "/admin/messages",    icon: <MessageSquare size={18} />,   label: "Messages",                roles: ["ADMIN"] },
    { href: "/messages",          icon: <MessageSquare size={18} />,   label: "Messages",                roles: ["OWNER", "TENANT"], badge: unreadCount },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      {/* Backdrop overlay — mobile drawer only, click to close */}
      {!collapsed && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
          style={{ top: headerH }}
          onClick={toggle}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar panel — starts flush with the bottom of the actual header */}
      <nav
        className="fixed left-0 bg-black border-r border-white/[0.06] flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          top: headerH,
          height: `calc(100vh - ${headerH}px)`,
          width: collapsed ? '0px' : '256px',
        }}
      >
        {/* Nav items — scrollable, takes all available space */}
        <div className="flex-1 min-h-0 overflow-y-auto w-64 pt-4">
          <div className="space-y-0.5 px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-[#6FFFE9]/40" />
              </div>
            ) : (
              visibleItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  badge={item.badge}
                  onNavigate={() => { if (!collapsed) toggle(); }}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer: alerts + sign out */}
        <div className="px-3 flex flex-col gap-1 w-64 pb-4 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <NotificationBell />
            <span className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Alerts</span>
          </div>

          {/* Sign out */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/35 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 group whitespace-nowrap"
            data-testid="button-logout"
          >
            <LogOut size={15} className="flex-shrink-0" />
            <span className="text-sm font-medium">{t('nav_sign_out')}</span>
          </button>
        </div>
      </nav>

      {/* Floating expand tab — shown when sidebar is collapsed */}
      <button
        onClick={toggle}
        className="fixed z-50 flex items-center justify-center transition-all duration-300 ease-in-out group"
        style={{
          top: `calc(${headerH}px + 50%)`,
          left: collapsed ? '0px' : '-28px',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '64px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.3)',
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? 'auto' : 'none',
        }}
        data-testid="button-expand-sidebar"
        title="Open sidebar"
      >
        <ChevronRight size={13} className="text-white/50 group-hover:text-white/90 transition-colors relative z-10" />
      </button>
    </>
  );
}

function NavItem({ href, icon, label, active, badge, onNavigate }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 whitespace-nowrap
        ${active
          ? "bg-white/[0.08] text-white"
          : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
        }
      `}
      data-testid={`nav-${href.replace(/\//g, '-').slice(1) || 'home'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold bg-[#6FFFE9] text-black rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : active ? (
        <span className="ml-auto w-1 h-1 rounded-full bg-[#6FFFE9]" />
      ) : null}
    </Link>
  );
}
