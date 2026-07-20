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

function NavTab({ href, icon, label, active, badge }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
      data-testid={`bottom-nav-${label.toLowerCase()}`}
    >
      <span
        className="relative transition-colors duration-200"
        style={{ color: active ? "var(--tiffany)" : "rgba(120,120,120,0.65)" }}
      >
        {icon}
        {!!badge && (
          <span
            className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            style={{ background: "var(--tiffany)", color: "#fff" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span
        className="text-[9px] uppercase tracking-widest font-medium transition-colors duration-200 leading-none"
        style={{ color: active ? "var(--tiffany)" : "rgba(120,120,120,0.55)" }}
      >
        {label}
      </span>
      {active && (
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

  if (!user?.role) return null;

  const role = user.role;

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
      { href: "/messages",       icon: <MessagesSquare size={22} strokeWidth={1.75} />,  label: t("nav_messages") },
      { href: "/notifications",  icon: <BellRing size={22} strokeWidth={1.75} />,        label: t("nav_inbox") },
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
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="w-full flex border-t"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderColor: "var(--nav-border)",
          boxShadow: "0 -1px 0 var(--border-subtle), 0 -8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {items.map(item => (
          <NavTab
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
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
