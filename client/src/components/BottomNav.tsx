/** Design: tenant and owner utility pages use a five-item, violet-accented smoky-glass navigation matching the supplied references. */
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid, WalletMinimal, House, BookOpenText, Hammer,
  MessagesSquare, ShieldCheck, FileSignature, BellRing, CircleUserRound,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavTab({ href, icon, label, active, badge, tenantStyle = false }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number; tenantStyle?: boolean;
}) {
  const activeColor = tenantStyle ? "#FFFFFF" : "var(--tiffany)";
  const inactiveColor = tenantStyle ? "rgba(255,255,255,0.62)" : "rgba(120,120,120,0.65)";
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 flex-1 relative transition-all duration-200 ${tenantStyle ? "min-h-[68px] py-1.5 rounded-[22px]" : "py-2"}`}
      style={tenantStyle && active ? { background: "rgba(255,255,255,0.13)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), 0 6px 16px rgba(0,0,0,0.10)" } : undefined}
      data-testid={`bottom-nav-${label.toLowerCase()}`}
    >
      <span
        className="relative transition-colors duration-200"
        style={{ color: active ? activeColor : inactiveColor }}
      >
        {icon}
        {!!badge && (
          <span
            className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            style={{ background: activeColor, color: "#fff" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span
        className="text-[9px] uppercase tracking-widest font-medium transition-colors duration-200 leading-none"
        style={{ color: active ? activeColor : tenantStyle ? "rgba(255,255,255,0.56)" : "rgba(120,120,120,0.55)" }}
      >
        {label}
      </span>
      {active && !tenantStyle && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b-full"
          style={{ background: "var(--tiffany)" }}
        />
      )}
    </Link>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [location] = useLocation();

  const { data: badgeCounts } = useQuery<{ notifications: number; messages: number }>({
    queryKey: ["/api/user/badge-counts"],
    refetchInterval: 60000,
    enabled: !!user,
  });
  const unreadCount = badgeCounts?.messages ?? 0;
  const unreadNotifCount = badgeCounts?.notifications ?? 0;

  const previewRole = new URLSearchParams(window.location.search).get("preview");
  const previewTenantMode = import.meta.env.DEV && (previewRole === "tenant" || (!previewRole && sessionStorage.getItem("rentflo:tenant-preview") === "1"));
  const previewOwnerMode = import.meta.env.DEV && (previewRole === "owner" || (!previewRole && sessionStorage.getItem("rentflo:owner-preview") === "1"));
  const role = user?.role ?? (previewTenantMode ? "TENANT" : previewOwnerMode ? "OWNER" : undefined);
  if (!role) return null;
  const isTenant = role === "TENANT";
  const isImageLedRole = isTenant || role === "OWNER";

  const itemsByRole: Record<string, NavItem[]> = {
    TENANT: [
      { href: "/tenant",         icon: <House size={22} strokeWidth={1.75} />,           label: t("nav_home") },
      { href: "/ledger",         icon: <BookOpenText size={22} strokeWidth={1.75} />,    label: t("nav_ledger") },
      { href: "/maintenance",    icon: <Hammer size={22} strokeWidth={1.75} />,          label: t("nav_repairs") },
      { href: "/messages",       icon: <MessagesSquare size={22} strokeWidth={1.75} />,  label: t("nav_messages") },
      { href: "/profile",        icon: <CircleUserRound size={22} strokeWidth={1.75} />, label: t("nav_profile") },
    ],
    OWNER: [
      { href: "/owner",          icon: <WalletMinimal size={22} strokeWidth={1.75} />,   label: t("nav_home") },
      { href: "/ledger",         icon: <BookOpenText size={22} strokeWidth={1.75} />,    label: t("nav_ledger") },
      { href: "/maintenance",    icon: <Hammer size={22} strokeWidth={1.75} />,           label: t("nav_repairs") },
      { href: "/messages",       icon: <MessagesSquare size={22} strokeWidth={1.75} />,  label: t("nav_messages") },
      { href: "/profile",        icon: <CircleUserRound size={22} strokeWidth={1.75} />, label: t("nav_profile") },
    ],
    ADMIN: [
      { href: "/admin",              icon: <LayoutGrid size={22} strokeWidth={1.75} />,     label: t("nav_admin_short") },
      { href: "/ledger",             icon: <BookOpenText size={22} strokeWidth={1.75} />,   label: t("nav_ledger") },
      { href: "/admin/maintenance",  icon: <Hammer size={22} strokeWidth={1.75} />,         label: t("nav_repairs") },
      { href: "/admin/messages",     icon: <MessagesSquare size={22} strokeWidth={1.75} />, label: t("nav_messages") },
      { href: "/verify",             icon: <ShieldCheck size={22} strokeWidth={1.75} />,    label: t("nav_kyc_short") },
    ],
  };

  const items = itemsByRole[role] ?? [];

  return (
    <div
      className={`fixed left-0 right-0 z-50 flex ${isImageLedRole ? "bottom-0 px-0" : "bottom-0"}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className={`w-full flex ${isImageLedRole ? "max-w-none rounded-t-[34px] border-x border-t px-2 pt-1.5" : "border-t"}`}
        style={{
          background: isImageLedRole ? "rgba(8,13,24,0.42)" : "var(--nav-bg)",
          backdropFilter: isImageLedRole ? "blur(30px) saturate(135%)" : "blur(28px) saturate(180%)",
          WebkitBackdropFilter: isImageLedRole ? "blur(30px) saturate(135%)" : "blur(28px) saturate(180%)",
          borderColor: isImageLedRole ? "rgba(255,255,255,0.16)" : "var(--nav-border)",
          boxShadow: isImageLedRole ? "0 14px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.14)" : "0 -1px 0 var(--border-subtle), 0 -8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {items.map(item => (
          <NavTab
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
            tenantStyle={isImageLedRole}
            badge={
              item.href === "/messages" ? unreadCount :
              item.href === "/notifications" ? unreadNotifCount :
              undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
