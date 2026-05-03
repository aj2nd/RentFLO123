import React, { useState } from "react";
import {
  Home, LogOut, Receipt, Wrench, ShieldCheck,
  FileSignature, MessageSquare, ChevronRight, Bell,
} from "lucide-react";

type NavItemDef = { href: string; icon: React.ReactNode; label: string; active?: boolean; badge?: number };

const navItems: NavItemDef[] = [
  { href: "/tenant",      icon: <Home size={18} />,          label: "Dashboard",    active: true },
  { href: "/ledger",      icon: <Receipt size={18} />,       label: "Ledger" },
  { href: "/verify",      icon: <ShieldCheck size={18} />,   label: "KYC Verify" },
  { href: "/agreement",   icon: <FileSignature size={18} />, label: "Agreement" },
  { href: "/maintenance", icon: <Wrench size={18} />,        label: "Maintenance" },
  { href: "/messages",    icon: <MessageSquare size={18} />, label: "Messages", badge: 3 },
];

function NavItem({ item }: { item: NavItemDef }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all duration-150"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={item.active ? {
        background: "rgba(111,255,233,0.10)",
        color: "#6FFFE9",
        border: "1px solid rgba(111,255,233,0.22)",
        boxShadow: "inset 0 1px 0 rgba(111,255,233,0.12)",
      } : hovered ? {
        color: "rgba(192,192,192,0.85)",
        border: "1px solid rgba(192,192,192,0.10)",
        background: "rgba(192,192,192,0.05)",
      } : {
        color: "rgba(192,192,192,0.50)",
        border: "1px solid transparent",
      }}
    >
      <span style={{ color: item.active ? "#6FFFE9" : "rgba(192,192,192,0.45)", flexShrink: 0 }}>
        {item.icon}
      </span>
      <span className="text-sm font-medium">{item.label}</span>
      {item.badge && item.badge > 0 ? (
        <span
          className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full"
          style={{ background: "#6FFFE9", color: "#000" }}
        >
          {item.badge}
        </span>
      ) : item.active ? (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: "#6FFFE9", boxShadow: "0 0 6px rgba(111,255,233,0.7)" }}
        />
      ) : null}
    </div>
  );
}

export function SidebarPreview() {
  return (
    <div
      className="w-full min-h-screen flex font-sans"
      style={{ background: "#0a0a0a" }}
    >
      {/* Sidebar */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: 256,
          minHeight: "100vh",
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(40px) saturate(200%)",
          borderRight: "1px solid rgba(192,192,192,0.08)",
          boxShadow: "inset -1px 0 0 rgba(111,255,233,0.04), 4px 0 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Brand header */}
        <div
          className="px-4 py-4 flex items-center gap-2.5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(192,192,192,0.07)" }}
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
            <p className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "rgba(157,239,228,0.55)" }}>
              Tenant
            </p>
          </div>
          <div
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#6FFFE9", boxShadow: "0 0 6px rgba(111,255,233,0.7)" }}
          />
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-3 flex flex-col gap-1 pb-6 pt-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(192,192,192,0.07)" }}
        >
          {/* Alerts row */}
          <div className="flex items-center gap-2 px-3 py-2">
            <Bell size={16} style={{ color: "rgba(192,192,192,0.35)" }} />
            <span className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(192,192,192,0.30)" }}>
              Alerts
            </span>
            <span
              className="ml-auto flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full"
              style={{ background: "#6FFFE9", color: "#000" }}
            >
              2
            </span>
          </div>

          {/* Sign out */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{ color: "rgba(192,192,192,0.45)", border: "1px solid transparent" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.color = "rgba(192,192,192,0.85)";
              (e.currentTarget as HTMLDivElement).style.background = "rgba(192,192,192,0.05)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(192,192,192,0.10)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.color = "rgba(192,192,192,0.45)";
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
              (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            <span className="text-sm font-medium">Sign out</span>
          </div>
        </div>
      </div>

      {/* Fake page content to show sidebar in context */}
      <div className="flex-1 flex flex-col p-6">
        {/* Mini ambient blobs */}
        <div style={{ position: "absolute", top: "10%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "rgba(111,255,233,0.055)", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "60%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(192,192,192,0.02)", filter: "blur(80px)", pointerEvents: "none" }} />

        <div className="mb-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
            style={{ border: "1px solid rgba(111,255,233,0.25)", background: "rgba(111,255,233,0.06)" }}
          >
            <span style={{ width: 6, height: 6, background: "#6FFFE9", borderRadius: "50%", display: "inline-block" }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#9DEFE4" }}>Secure Pay · RentFLO</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tighter mb-1"
            style={{
              background: "linear-gradient(135deg, #7A7A7A 0%, #D0D0D0 30%, #F5F5F5 50%, #C8C8C8 65%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 16px rgba(192,192,192,0.25))",
            }}
          >
            Tenant Dashboard
          </h1>
          <p className="text-sm flex items-center gap-1.5" style={{ color: "rgba(157,239,228,0.60)" }}>
            204, Prestige Towers, Koramangala
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Monthly Rent", value: "₹18,000", lc: "#C0C0C0", vc: "#C0C0C0", bc: "rgba(192,192,192,0.20)", bg: "rgba(192,192,192,0.06)" },
            { label: "Due In", value: "9d", lc: "#C0C0C0", vc: "#E8E8E8", bc: "rgba(192,192,192,0.20)", bg: "rgba(192,192,192,0.06)" },
            { label: "Paid YTD", value: "₹72K", lc: "#9DEFE4", vc: "#6FFFE9", bc: "rgba(111,255,233,0.25)", bg: "rgba(111,255,233,0.07)" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(40px)" }}>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium mb-2" style={{ border: `1px solid ${s.bc}`, background: s.bg, color: s.lc }}>{s.label}</span>
              <span className="text-sm font-bold font-mono" style={{ color: s.vc }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Settlement card */}
        <div className="rounded-3xl p-5" style={{ background: "rgba(111,255,233,0.030)", borderTop: "1px solid rgba(111,255,233,0.40)", borderLeft: "1px solid rgba(111,255,233,0.20)", borderRight: "1px solid rgba(111,255,233,0.08)", borderBottom: "1px solid rgba(111,255,233,0.08)", boxShadow: "0 0 40px rgba(111,255,233,0.06)" }}>
          <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2" style={{ background: "rgba(0,0,0,0.40)", color: "#C0C0C0", border: "1px solid rgba(192,192,192,0.18)" }}>Current Month</div>
          <div className="text-4xl font-bold font-mono mb-4" style={{ background: "linear-gradient(135deg, #7A7A7A 0%, #D0D0D0 30%, #F5F5F5 50%, #C8C8C8 65%, #888888 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>₹18,000</div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "rgba(192,192,192,0.70)" }}>Settlement Progress</span>
            <span style={{ color: "rgba(111,255,233,0.80)" }}>67% Settled</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: "67%", background: "linear-gradient(to right, #6FFFE9, #5DEEDB)" }} />
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: "rgba(192,192,192,0.50)" }}>
            <span>Paid <span className="font-mono" style={{ color: "#6FFFE9" }}>₹12,000</span></span>
            <span>Remaining <span className="font-mono" style={{ color: "#C0C0C0" }}>₹6,000</span></span>
          </div>
          <button className="w-full font-bold text-sm rounded-full py-3 flex items-center justify-center gap-1" style={{ background: "#6FFFE9", color: "#000", boxShadow: "0 4px 24px rgba(111,255,233,0.30)" }}>
            Pay Now — ₹6,000 <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
