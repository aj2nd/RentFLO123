import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt,
  Loader2, ShieldCheck, FileSignature, ChevronRight, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const { collapsed, toggle } = useSidebar();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!collapsed && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
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
    { href: "/admin",             icon: <LayoutDashboard size={18} />, label: t("nav_admin_console"),    roles: ["ADMIN"] },
    { href: "/admin/maintenance", icon: <Wrench size={18} />,          label: t("nav_maintenance"),      roles: ["ADMIN"] },
    { href: "/owner",             icon: <Wallet size={18} />,          label: t("nav_owner_portal"),     roles: ["OWNER"] },
    { href: "/tenant",            icon: <Home size={18} />,            label: t("nav_tenant_dashboard"), roles: ["TENANT"] },
    { href: "/ledger",            icon: <Receipt size={18} />,         label: t("nav_ledger"),           roles: ["ADMIN", "OWNER", "TENANT"] },
    { href: "/verify",            icon: <ShieldCheck size={18} />,     label: t("nav_kyc"),              roles: ["OWNER", "TENANT"] },
    { href: "/agreement",         icon: <FileSignature size={18} />,   label: t("nav_agreement"),        roles: ["OWNER", "TENANT"] },
    { href: "/maintenance",       icon: <Wrench size={18} />,          label: "Maintenance",             roles: ["OWNER", "TENANT", "ADMIN"] },
    { href: "/admin/messages",    icon: <MessageSquare size={18} />,   label: "Messages",                roles: ["ADMIN"] },
    { href: "/messages",          icon: <MessageSquare size={18} />,   label: "Messages",                roles: ["OWNER", "TENANT"], badge: unreadCount },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      {/* Backdrop overlay — mobile only, tap to close */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={toggle}
          aria-label="Close sidebar"
        />
      )}

      {/* ── Sidebar panel ── */}
      <nav
        className="fixed left-0 top-0 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          height: "calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))",
          width: collapsed ? "0px" : "256px",
          background: "var(--nav-bg)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          borderRight: "1px solid var(--nav-border)",
          boxShadow: "inset -1px 0 0 var(--border-accent-dim), 4px 0 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── Brand header ── */}
        <div
          className="w-64 px-4 py-4 flex items-center gap-2.5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--nav-border)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(111,255,233,0.12)", border: "1px solid rgba(111,255,233,0.25)" }}
          >
            <Home size={14} style={{ color: "#6FFFE9" }} />
          </div>
          <div>
            <span
              className="text-sm font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #C0C0C0 0%, #F0F0F0 50%, #C0C0C0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              RentFLO
            </span>
            {user?.role && (
              <p className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "var(--tiffany-dim)", opacity: 0.7 }}>
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </p>
            )}
          </div>
          {/* Tiffany accent dot */}
          <div
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#6FFFE9", boxShadow: "0 0 6px rgba(111,255,233,0.7)" }}
          />
        </div>

        {/* ── Nav items — scrollable ── */}
        <div className="flex-1 min-h-0 overflow-y-auto w-64 py-3">
          <div className="space-y-0.5 px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(111,255,233,0.40)" }} />
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

        {/* ── Footer: alerts + sign out ── */}
        <div
          className="px-3 flex flex-col gap-1 w-64 pb-4 pt-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--nav-border)" }}
        >
          {/* Alerts + Theme toggle row */}
          <div className="flex items-center gap-2 px-3 py-2">
            <NotificationBell />
            <span
              className="text-[9px] font-medium uppercase tracking-widest flex-1"
              style={{ color: "var(--nav-text-dim)" }}
            >
              Alerts
            </span>
            <ThemeToggle />
          </div>

          {/* Sign out */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all duration-200 group"
            style={{
              color: "var(--nav-text)",
              background: "transparent",
              border: "1px solid transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(128,128,128,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(128,128,128,0.12)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            }}
            data-testid="button-logout"
          >
            <LogOut size={15} className="flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{t("nav_sign_out")}</span>
          </button>
        </div>
      </nav>

      {/* ── Edge grip — three micro-dots on left edge, shown when collapsed ── */}
      <button
        onClick={toggle}
        data-testid="button-expand-sidebar"
        title="Open sidebar"
        style={{
          position: "fixed",
          top: "50%",
          left: collapsed ? "0px" : "-28px",
          transform: "translateY(-50%)",
          zIndex: 50,
          width: "18px",
          height: "52px",
          padding: 0,
          background: "rgba(111,255,233,0.07)",
          border: "1px solid rgba(111,255,233,0.22)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          boxShadow: "0 0 12px rgba(111,255,233,0.12), inset 0 1px 0 rgba(111,255,233,0.10)",
          cursor: "pointer",
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          transition: "opacity 0.3s, left 0.3s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              display: "block",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "rgba(111,255,233,0.85)",
              boxShadow: "0 0 6px rgba(111,255,233,1), 0 0 14px rgba(111,255,233,0.5)",
              animation: `navDotPulse ${1.8 + i * 0.3}s ease-in-out infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes navDotPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.6); }
          }
        `}</style>
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
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 whitespace-nowrap"
      style={active ? {
        background: "rgba(111,255,233,0.10)",
        color: "#6FFFE9",
        border: "1px solid rgba(111,255,233,0.22)",
        boxShadow: "inset 0 1px 0 rgba(111,255,233,0.12)",
      } : {
        color: "rgba(192,192,192,0.50)",
        border: "1px solid transparent",
      }}
      data-testid={`nav-${href.replace(/\//g, "-").slice(1) || "home"}`}
    >
      <span className="flex-shrink-0" style={{ color: active ? "#6FFFE9" : "rgba(192,192,192,0.45)" }}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {badge && badge > 0 ? (
        <span
          className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full"
          style={{ background: "#6FFFE9", color: "#000" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : active ? (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: "#6FFFE9", boxShadow: "0 0 6px rgba(111,255,233,0.7)" }}
        />
      ) : null}
    </Link>
  );
}
