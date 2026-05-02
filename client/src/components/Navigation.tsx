import { Link, useLocation } from "wouter";
import { LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt, Loader2, ShieldCheck, FileSignature, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationBell } from "@/components/NotificationBell";
import houseLogoImg from "@assets/IMG_7223_1777731010120.jpeg";
import wordmarkImg from "@assets/IMG_7224_1777731010120.jpeg";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const { collapsed, toggle } = useSidebar();

  const isActive = (path: string) => location === path;
  const role = user?.role;

  const navItems: { href: string; icon: React.ReactNode; label: string; roles: string[] }[] = [
    { href: "/admin",             icon: <LayoutDashboard size={20} />, label: t('nav_admin_console'),    roles: ["ADMIN"] },
    { href: "/admin/maintenance", icon: <Wrench size={20} />,          label: t('nav_maintenance'),      roles: ["ADMIN"] },
    { href: "/owner",             icon: <Wallet size={20} />,          label: t('nav_owner_portal'),     roles: ["OWNER"] },
    { href: "/tenant",            icon: <Home size={20} />,            label: t('nav_tenant_dashboard'), roles: ["TENANT"] },
    { href: "/ledger",            icon: <Receipt size={20} />,         label: t('nav_ledger'),           roles: ["ADMIN", "OWNER", "TENANT"] },
    { href: "/verify",            icon: <ShieldCheck size={20} />,     label: t('nav_kyc'),              roles: ["OWNER", "TENANT"] },
    { href: "/agreement",         icon: <FileSignature size={20} />,   label: t('nav_agreement'),        roles: ["OWNER", "TENANT"] },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      {/* Backdrop overlay — click to close sidebar */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40"
          onClick={toggle}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar panel */}
      <nav
        className="fixed left-0 top-0 h-full bg-black border-r border-[#6FFFE9]/15 flex flex-col justify-between py-8 z-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? '0px' : '256px' }}
      >
        <div className="flex flex-col gap-2 w-64">
          {/* Logo — 10% larger */}
          <div className="px-6 mb-10 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 cursor-pointer" data-testid="link-logo-img">
              <img src={houseLogoImg} alt="RentFLO" style={{ width: '52px', height: '52px' }} className="object-contain flex-shrink-0" />
              <img src={wordmarkImg} alt="RentFLO" style={{ height: '39px' }} className="object-contain flex-shrink-0" data-testid="link-logo" />
            </Link>
          </div>

          {/* Nav items */}
          <div className="space-y-1 px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#6FFFE9]/50" />
              </div>
            ) : (
              visibleItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onNavigate={() => { if (!collapsed) toggle(); }}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer: notification bell + collapse + logout */}
        <div className="px-3 flex flex-col gap-1 w-64 overflow-visible">
          <div className="flex items-center gap-2 px-3 py-2">
            <NotificationBell />
            <span className="text-xs text-[#6FFFE9]/40 uppercase tracking-wider">Alerts</span>
          </div>

          {/* Collapse button — liquid glass */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-3 w-full transition-all duration-200 whitespace-nowrap group overflow-visible"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.18)',
            }}
            data-testid="button-collapse-sidebar"
          >
            <ChevronLeft size={18} className="flex-shrink-0 text-[#6FFFE9]/70 group-hover:text-[#6FFFE9] transition-colors" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#6FFFE9]/60 group-hover:text-[#6FFFE9] transition-colors">Collapse</span>
          </button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-3 w-full text-[#9DEFE4]/60 hover:text-[#6FFFE9] hover:bg-[#6FFFE9]/8 transition-all duration-200 group whitespace-nowrap"
            data-testid="button-logout"
          >
            <LogOut size={20} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span className="font-medium">{t('nav_sign_out')}</span>
          </button>
        </div>
      </nav>

      {/* Floating expand tab — liquid glass, always visible when collapsed */}
      <button
        onClick={toggle}
        className="fixed z-50 flex items-center justify-center transition-all duration-300 ease-in-out group overflow-visible"
        style={{
          left: collapsed ? '0px' : '-28px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '36px',
          height: '72px',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: 'none',
          borderRadius: '0 10px 10px 0',
          boxShadow: [
            'inset 1px 0 0 rgba(255,255,255,0.2)',
            'inset 0 1px 0 rgba(255,255,255,0.08)',
            'inset 0 -1px 0 rgba(255,255,255,0.04)',
            '2px 0 18px rgba(0,0,0,0.22)',
          ].join(', '),
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? 'auto' : 'none',
        }}
        data-testid="button-expand-sidebar"
        title="Open sidebar"
      >
        {/* Inner highlight streak */}
        <span
          className="absolute left-1 top-2 bottom-2 w-px rounded-full"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 100%)' }}
        />
        <ChevronRight size={14} className="text-[#6FFFE9] group-hover:text-white transition-colors relative z-10" />
      </button>
    </>
  );
}

function NavItem({ href, icon, label, active, onNavigate }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`
        flex items-center gap-3 px-3 py-3 transition-all duration-200 whitespace-nowrap
        ${active
          ? "text-black"
          : "text-[#9DEFE4]/75 hover:text-[#6FFFE9] hover:bg-[#6FFFE9]/8"
        }
      `}
      style={active ? {
        background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)',
        color: '#000'
      } : undefined}
      data-testid={`nav-${href.replace(/\//g, '-').slice(1) || 'home'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </Link>
  );
}
