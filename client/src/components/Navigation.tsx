import { Link, useLocation } from "wouter";
import { LayoutDashboard, Home, LogOut, Wallet, Wrench, Receipt, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();

  const isActive = (path: string) => location === path;
  const role = user?.role;

  const navItems: { href: string; icon: React.ReactNode; label: string; roles: string[] }[] = [
    {
      href: "/admin",
      icon: <LayoutDashboard size={20} />,
      label: "Admin Console",
      roles: ["ADMIN"],
    },
    {
      href: "/admin/maintenance",
      icon: <Wrench size={20} />,
      label: "Maintenance",
      roles: ["ADMIN"],
    },
    {
      href: "/owner",
      icon: <Wallet size={20} />,
      label: "Owner Portal",
      roles: ["OWNER"],
    },
    {
      href: "/tenant",
      icon: <Home size={20} />,
      label: "Tenant Dashboard",
      roles: ["TENANT"],
    },
    {
      href: "/ledger",
      icon: <Receipt size={20} />,
      label: "Ledger",
      roles: ["ADMIN", "OWNER", "TENANT"],
    },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-background border-r border-white/10 flex flex-col justify-between py-8 z-50 transition-all duration-300">
      <div className="flex flex-col gap-2">
        <div className="px-6 mb-12">
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tighter text-white hidden md:block cursor-pointer" data-testid="link-logo">RentFLO.</h1>
            <h1 className="text-2xl font-bold tracking-tighter text-white md:hidden cursor-pointer" data-testid="link-logo-mobile">RF.</h1>
          </Link>
        </div>

        <div className="space-y-1 px-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : (
            visibleItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))
          )}
        </div>
      </div>

      <div className="px-3">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-4 px-3 py-3 w-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all duration-200 group"
          data-testid="button-logout"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-medium hidden md:block">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`
        flex items-center gap-4 px-3 py-3 transition-all duration-200
        ${active 
          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
          : "text-zinc-500 hover:text-white hover:bg-zinc-900"
        }
      `}
      data-testid={`nav-${href.replace(/\//g, '-').slice(1) || 'home'}`}
    >
      {icon}
      <span className="font-medium hidden md:block" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </Link>
  );
}
