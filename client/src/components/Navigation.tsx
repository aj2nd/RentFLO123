import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Home, LogOut, Wallet, Wrench, Receipt } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;

  // Simple role simulation for demo purposes based on route
  const isTenantView = location.startsWith("/tenant");
  const isOwnerView = location.startsWith("/owner");
  const isAdminView = location === "/admin";
  const isMaintenanceView = location === "/admin/maintenance";

  return (
    <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-background border-r border-white/10 flex flex-col justify-between py-8 z-50 transition-all duration-300">
      <div className="flex flex-col gap-2">
        <div className="px-6 mb-12">
          <h1 className="text-2xl font-bold tracking-tighter text-white hidden md:block">RentFLO.</h1>
          <h1 className="text-2xl font-bold tracking-tighter text-white md:hidden">RF.</h1>
        </div>

        <div className="space-y-1 px-3">
          <NavItem 
            href="/admin" 
            icon={<LayoutDashboard size={20} />} 
            label="Admin Console" 
            active={isAdminView} 
          />
          <NavItem 
            href="/admin/maintenance" 
            icon={<Wrench size={20} />} 
            label="Maintenance" 
            active={isMaintenanceView} 
          />
          <NavItem 
            href="/owner" 
            icon={<Wallet size={20} />} 
            label="Owner View" 
            active={isOwnerView} 
          />
          <NavItem 
            href="/tenant" 
            icon={<Home size={20} />} 
            label="Tenant View" 
            active={isTenantView} 
          />
          <NavItem 
            href="/ledger" 
            icon={<Receipt size={20} />} 
            label="Ledger" 
            active={location === "/ledger"} 
          />
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
    >
      {icon}
      <span className="font-medium hidden md:block" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </Link>
  );
}
