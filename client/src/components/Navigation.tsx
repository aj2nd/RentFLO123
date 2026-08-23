/** Design: role-aware sidebar navigation, including development-only owner and tenant fallbacks for previewing original pages. */
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt,
  Loader2, ShieldCheck, FileSignature, ChevronRight, MessageSquare, Menu, X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import newHeaderWordmark from "@assets/IMG_8383_1787480222056.png";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
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
  const previewRole = new URLSearchParams(window.location.search).get("preview");
  const previewTenantMode = import.meta.env.DEV && (previewRole === "tenant" || (!previewRole && sessionStorage.getItem("rentflo:tenant-preview") === "1"));
  const previewOwnerMode = import.meta.env.DEV && (previewRole === "owner" || (!previewRole && sessionStorage.getItem("rentflo:owner-preview") === "1"));
  const role = user?.role ?? (previewTenantMode ? "TENANT" : previewOwnerMode ? "OWNER" : undefined);

  const { data: badgeCounts } = useQuery<{ notifications: number; messages: number }>({
    queryKey: ["/api/user/badge-counts"],
    refetchInterval: 60000,
    enabled: !!user,
  });
  const unreadCount = badgeCounts?.messages ?? 0;

  const navItems: { href: string; icon: React.ReactNode; label: string; roles: string[]; badge?: number }[] = [
    { href: "/admin",             icon: <LayoutDashboard size={18} />, label: t("nav_admin_console"),    roles: ["ADMIN"] },
    { href: "/admin/maintenance", icon: <Wrench size={18} />,          label: t("nav_maintenance"),      roles: ["ADMIN"] },
    { href: "/owner",             icon: <Wallet size={18} />,          label: t("nav_owner_portal"),     roles: ["OWNER"] },
    { href: "/tenant",            icon: <Home size={18} />,            label: t("nav_tenant_dashboard"), roles: ["TENANT"] },
    { href: "/ledger",            icon: <Receipt size={18} />,         label: t("nav_ledger"),           roles: ["ADMIN", "OWNER", "TENANT"] },
    { href: "/verify",            icon: <ShieldCheck size={18} />,     label: t("nav_kyc"),              roles: ["OWNER", "TENANT"] },
    { href: "/agreement",         icon: <FileSignature size={18} />,   label: t("nav_agreement"),        roles: ["OWNER", "TENANT"] },
    { href: "/maintenance",       icon: <Wrench size={18} />,          label: t("nav_maintenance"),      roles: ["OWNER", "TENANT", "ADMIN"] },
    { href: "/admin/messages",    icon: <MessageSquare size={18} />,   label: t("nav_messages"),          roles: ["ADMIN"] },
    { href: "/messages",          icon: <MessageSquare size={18} />,   label: t("nav_messages"),          roles: ["OWNER", "TENANT"], badge: unreadCount },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      {/* ── Mobile top bar — visible only on mobile (md:hidden) ── */}
      <div
        className="fixed left-0 right-0 md:hidden flex items-center"
        style={{
          top: 0,
          height: "60px",
          zIndex: 35,
          background: "var(--nav-bg)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderBottom: "1px solid var(--nav-border)",
          boxShadow: "0 1px 0 var(--border-accent-dim)",
          pointerEvents: "auto",
          paddingLeft: "4px",
          paddingRight: "4px",
          position: "fixed",
        }}
      >
        {/* Left: hamburger */}
        <button
          onClick={toggle}
          data-testid="button-mobile-menu"
          aria-label="Toggle menu"
          className="flex items-center justify-center flex-shrink-0"
          style={{ color: "var(--nav-text)", touchAction: "manipulation", width: 44, height: 44 }}
        >
          {collapsed ? <Menu size={21} /> : <X size={21} />}
        </button>

        {/* Center: wordmark — absolutely centered so it's always in the middle */}
        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none" style={{ height: "60px" }}>
          <img src={newHeaderWordmark} alt="RentFLO" className="dashboard-header-wordmark dashboard-header-wordmark-mobile" />
        </div>

        <div className="flex-1" />

        {/* Right: theme toggle */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44 }}>
          <ThemeToggle />
        </div>
      </div>

      {/* Backdrop overlay — mobile only, tap to close */}
      {!collapsed && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 md:hidden"
          style={{ top: "var(--topbar-h)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={toggle}
          aria-label="Close sidebar"
        />
      )}

      {/* ── Sidebar panel ── */}
      <nav
        className="fixed left-0 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          top: "var(--topbar-h)",
          height: "calc(100dvh - var(--topbar-h) - 64px - env(safe-area-inset-bottom, 0px))",
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
          className="w-64 px-5 py-5 flex items-center gap-3 flex-shrink-0 dashboard-brand-header"
          style={{ borderBottom: "1px solid var(--nav-border)" }}
        >
          <div className="flex flex-col gap-0.5">
            <img src={newHeaderWordmark} alt="RentFLO" className="dashboard-header-wordmark dashboard-header-wordmark-desktop" />
            {role && (
              <p className="text-[9px] uppercase tracking-[2px] leading-none" style={{ color: "var(--tiffany)", opacity: 0.6 }}>
                {role.charAt(0) + role.slice(1).toLowerCase()} Portal
              </p>
            )}
          </div>
          <div
            className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "var(--tiffany)", boxShadow: "0 0 8px rgba(111,255,233,0.6)" }}
          />
        </div>

        {/* ── Nav items — scrollable ── */}
        <div className="flex-1 min-h-0 overflow-y-auto w-64 py-4">
          <div className="space-y-1 px-4">
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
          className="w-64 px-4 pb-5 pt-4 flex flex-col gap-2 flex-shrink-0"
          style={{ borderTop: "1px solid var(--nav-border)" }}
        >
          {/* Alerts + Theme toggle row */}
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--nav-border)" }}
          >
            <NotificationBell />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest flex-1"
              style={{ color: "var(--nav-text-dim)" }}
            >
              {t("nav_alerts")}
            </span>
            <ThemeToggle />
          </div>

          {/* Sign out */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl transition-all duration-200"
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
            <LogOut size={16} className="flex-shrink-0" style={{ color: "var(--nav-text-dim)" }} />
            <span className="text-sm font-medium whitespace-nowrap">{t("nav_sign_out")}</span>
          </button>

          {/* Legal links */}
          <div className="px-3 pt-3 mt-1" style={{ borderTop: "1px solid var(--nav-border)" }}>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
              {[
                { label: t("nav_terms_short"),   href: "/terms" },
                { label: t("nav_privacy_short"), href: "/privacy" },
                { label: t("nav_refund_short"),  href: "/refund" },
                { label: t("nav_support_short"), href: "/support" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap"
                  style={{ color: "var(--nav-text-dim)" }}
                  data-testid={`nav-legal-${label.toLowerCase()}`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <a
              href="mailto:help@rentflo.com"
              className="text-[10px] block transition-colors mb-1"
              style={{ color: "var(--nav-text-dim)" }}
              data-testid="nav-legal-email"
            >
              help@rentflo.com
            </a>
            <p className="text-[9px] opacity-40 whitespace-nowrap" style={{ color: "var(--nav-text-dim)" }}>
              © {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.
            </p>
          </div>
        </div>
      </nav>

      {/* ── Edge grip — desktop only, shown when collapsed ── */}
      <button
        onClick={toggle}
        data-testid="button-expand-sidebar"
        title="Open sidebar"
        className="hidden md:flex flex-col items-center justify-center"
        style={{
          position: "fixed",
          top: "50%",
          left: collapsed ? "0px" : "-28px",
          transform: "translateY(-50%)",
          zIndex: 50,
          width: "18px",
          height: "52px",
          padding: 0,
          gap: "6px",
          background: "rgba(111,255,233,0.07)",
          border: "1px solid rgba(111,255,233,0.22)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          boxShadow: "0 0 12px rgba(111,255,233,0.12), inset 0 1px 0 rgba(111,255,233,0.10)",
          cursor: "pointer",
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          transition: "opacity 0.3s, left 0.3s",
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
        color: "var(--tiffany)",
        border: "1px solid rgba(111,255,233,0.22)",
        boxShadow: "inset 0 1px 0 rgba(111,255,233,0.12)",
      } : {
        color: "var(--nav-text)",
        border: "1px solid transparent",
      }}
      data-testid={`nav-${href.replace(/\//g, "-").slice(1) || "home"}`}
    >
      <span className="flex-shrink-0" style={{ color: active ? "var(--tiffany)" : "var(--nav-text-dim)" }}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {badge && badge > 0 ? (
        <span
          className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full"
          style={{ background: "var(--tiffany)", color: "var(--tiffany-badge-text, #000)" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : active ? (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--tiffany)", boxShadow: "0 0 6px rgba(111,255,233,0.5)" }}
        />
      ) : null}
    </Link>
  );
}
