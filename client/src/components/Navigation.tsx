import { Link, useLocation } from "wouter";
import { LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt, Loader2, ShieldCheck, FileSignature, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/contexts/SidebarContext";
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
    <nav
      className="fixed left-0 top-0 h-full bg-black border-r border-[#6FFFE9]/15 flex flex-col justify-between py-8 z-50 transition-all duration-300 overflow-hidden"
      style={{ width: collapsed ? '56px' : '256px' }}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className="px-3 mb-10 flex items-center justify-between min-w-0">
          <Link href="/" className="flex items-center gap-2 cursor-pointer min-w-0 overflow-hidden">
            <img
              src={houseLogoImg}
              alt="RentFLO"
              className="w-8 h-8 object-contain flex-shrink-0"
              data-testid="link-logo-img"
            />
            <img
              src={wordmarkImg}
              alt="RentFLO"
              className="h-6 object-contain flex-shrink-0 transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', maxWidth: collapsed ? 0 : '120px' }}
              data-testid="link-logo"
            />
          </Link>
        </div>

        <div className="space-y-1 px-2">
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
                collapsed={collapsed}
              />
            ))
          )}
        </div>
      </div>

      <div className="px-2 flex flex-col gap-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-3 w-full text-[#6FFFE9]/50 hover:text-[#6FFFE9] hover:bg-[#6FFFE9]/8 transition-all duration-200"
          data-testid="button-toggle-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight size={18} className="flex-shrink-0" />
            : <ChevronLeft size={18} className="flex-shrink-0" />
          }
          <span
            className="text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300 overflow-hidden"
            style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : '120px' }}
          >
            Collapse
          </span>
        </button>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-3 w-full text-[#9DEFE4]/60 hover:text-[#6FFFE9] hover:bg-[#6FFFE9]/8 transition-all duration-200 group"
          data-testid="button-logout"
          title="Sign out"
        >
          <LogOut size={20} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          <span
            className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : '120px' }}
          >
            {t('nav_sign_out')}
          </span>
        </button>
      </div>
    </nav>
  );
}

function NavItem({ href, icon, label, active, collapsed }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-3 transition-all duration-200 whitespace-nowrap overflow-hidden
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
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span
        className="font-medium overflow-hidden transition-all duration-300"
        style={{
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : '160px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </span>
    </Link>
  );
}
