import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Wallet, Home, Receipt, Wrench,
  MessageSquare, ShieldCheck, FileSignature, Bell, UserCircle,
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
    <Link href={href} className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative" data-testid={`bottom-nav-${label.toLowerCase()}`}>
      <span className={`relative transition-colors duration-200 ${active ? "text-[#6FFFE9]" : "text-zinc-500"}`}>
        {icon}
        {!!badge && (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-[#6FFFE9] text-black text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className={`text-[9px] uppercase tracking-widest font-medium transition-colors duration-200 leading-none ${active ? "text-[#6FFFE9]" : "text-zinc-600"}`}>
        {label}
      </span>
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#6FFFE9] rounded-b-full" />
      )}
    </Link>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    refetchInterval: 15000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  const { data: unreadNotifsData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadNotifCount = unreadNotifsData?.count ?? 0;

  if (!user?.role) return null;

  const role = user.role;

  const itemsByRole: Record<string, NavItem[]> = {
    TENANT: [
      { href: "/tenant",         icon: <Home size={22} />,          label: "Home" },
      { href: "/ledger",         icon: <Receipt size={22} />,       label: "Ledger" },
      { href: "/maintenance",    icon: <Wrench size={22} />,        label: "Repairs" },
      { href: "/messages",       icon: <MessageSquare size={22} />, label: "Messages" },
      { href: "/notifications",  icon: <Bell size={22} />,          label: "Inbox" },
    ],
    OWNER: [
      { href: "/owner",          icon: <Wallet size={22} />,        label: "Home" },
      { href: "/ledger",         icon: <Receipt size={22} />,       label: "Ledger" },
      { href: "/messages",       icon: <MessageSquare size={22} />, label: "Messages" },
      { href: "/notifications",  icon: <Bell size={22} />,          label: "Inbox" },
      { href: "/profile",        icon: <UserCircle size={22} />,    label: "Profile" },
    ],
    ADMIN: [
      { href: "/admin",              icon: <LayoutDashboard size={22} />, label: "Admin" },
      { href: "/ledger",             icon: <Receipt size={22} />,         label: "Ledger" },
      { href: "/admin/maintenance",  icon: <Wrench size={22} />,          label: "Repairs" },
      { href: "/admin/messages",     icon: <MessageSquare size={22} />,   label: "Messages" },
      { href: "/verify",             icon: <ShieldCheck size={22} />,     label: "KYC" },
    ],
  };

  const items = itemsByRole[role] ?? [];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glass background */}
      <div
        className="w-full flex border-t border-white/[0.07]"
        style={{
          background: "rgba(0, 0, 0, 0.82)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: "0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.6)",
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
