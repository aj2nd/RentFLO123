import React, { useState } from "react";
import {
  MapPin, ShieldCheck, ChevronRight, CheckCircle2, CheckCircle,
  Circle, TrendingUp, CircleDot, Banknote, CalendarDays,
  Wrench, AlertCircle, ToggleRight, ToggleLeft
} from "lucide-react";

type Tab = "overview" | "payments" | "lease";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    SETTLED: { label: "Settled", classes: "bg-[#6FFFE9]/10 text-[#6FFFE9] border-[#6FFFE9]/25" },
    EXPOSED: { label: "Exposed", classes: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
    ARREARS: { label: "Arrears", classes: "bg-red-500/10 text-red-400 border-red-500/25" },
  };
  const s = map[status] ?? { label: status, classes: "bg-white/[0.06] text-zinc-400 border-white/[0.10]" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full backdrop-blur-sm ${s.classes}`}>
      {s.label}
    </span>
  );
}

export function LivePreview() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const totalDue = 18000;
  const amountPaid = 12000;
  const remaining = totalDue - amountPaid;
  const progressPercent = Math.round((amountPaid / totalDue) * 100);
  const daysUntilDue = 9;
  const totalPaidYTD = 72000;
  const settledMonths = 4;

  const onboardingSteps = [
    { label: "Join a property", done: true },
    { label: "Complete KYC verification", done: true },
    { label: "Sign the rental agreement", done: false },
    { label: "Make your first payment", done: true },
  ];

  const allLedgers = [
    { id: "1", monthYear: "2026-05", amountCollected: 12000, monthlyRent: 18000, status: "EXPOSED" },
    { id: "2", monthYear: "2026-04", amountCollected: 18000, monthlyRent: 18000, status: "SETTLED" },
    { id: "3", monthYear: "2026-03", amountCollected: 18000, monthlyRent: 18000, status: "SETTLED" },
    { id: "4", monthYear: "2026-02", amountCollected: 18000, monthlyRent: 18000, status: "SETTLED" },
    { id: "5", monthYear: "2026-01", amountCollected: 18000, monthlyRent: 18000, status: "SETTLED" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "lease", label: "Lease" },
  ];

  return (
    <div
      className="min-h-screen w-full max-w-[430px] mx-auto overflow-auto font-sans pb-24"
      style={{ background: "#000000", color: "#E8E8E8" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 320, height: 320, borderRadius: "50%", background: "rgba(111,255,233,0.07)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: "55%", right: "8%", width: 240, height: 240, borderRadius: "50%", background: "rgba(111,255,233,0.045)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "55%", width: 200, height: 200, borderRadius: "50%", background: "rgba(192,192,192,0.025)", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", bottom: "30%", left: "5%", width: 160, height: 160, borderRadius: "50%", background: "rgba(192,192,192,0.018)", filter: "blur(80px)" }} />
      </div>

      <div className="relative p-4 flex flex-col" style={{ zIndex: 1 }}>

        {/* Setup Progress */}
        <div className="flex gap-1 mb-5">
          {["Verify Identity ✓", "Sign Agreement", "Pay Rent ✓"].map((step, i) => (
            <div key={i} className="flex-1 flex items-center gap-1">
              <div
                className="flex-1 h-0.5 rounded-full"
                style={{ background: i !== 1 ? "#6FFFE9" : "rgba(255,255,255,0.12)" }}
              />
              <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: i !== 1 ? "#9DEFE4" : "rgba(255,255,255,0.3)" }}>{step}</span>
              <div
                className="flex-1 h-0.5 rounded-full"
                style={{ background: i !== 1 ? "#6FFFE9" : "rgba(255,255,255,0.12)" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ border: "1px solid rgba(111,255,233,0.25)", background: "rgba(111,255,233,0.06)" }}>
            <span style={{ width: 6, height: 6, background: "#6FFFE9", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#9DEFE4" }}>Secure Pay · RentFLO</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tighter mb-1"
            style={{
              background: "linear-gradient(135deg, #7A7A7A 0%, #D0D0D0 30%, #F5F5F5 50%, #C8C8C8 65%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter: "drop-shadow(0 0 20px rgba(192,192,192,0.30)) drop-shadow(0 0 40px rgba(111,255,233,0.08))",
            }}
          >
            Tenant Dashboard
          </h1>
          <p className="text-sm flex items-center gap-1.5" style={{ color: "rgba(157,239,228,0.70)" }}>
            <MapPin size={12} style={{ color: "rgba(111,255,233,0.60)" }} />
            204, Prestige Towers, Koramangala, Bengaluru
          </p>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Monthly Rent", value: `₹${totalDue.toLocaleString()}`, labelColor: "#C0C0C0", valueColor: "#C0C0C0", borderColor: "rgba(192,192,192,0.20)", bgColor: "rgba(192,192,192,0.06)" },
            { label: "Due In", value: `${daysUntilDue}d`, labelColor: "#C0C0C0", valueColor: "#E8E8E8", borderColor: "rgba(192,192,192,0.20)", bgColor: "rgba(192,192,192,0.06)" },
            { label: "Paid YTD", value: `₹${totalPaidYTD.toLocaleString()}`, labelColor: "#9DEFE4", valueColor: "#6FFFE9", borderColor: "rgba(111,255,233,0.25)", bgColor: "rgba(111,255,233,0.07)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-3 flex flex-col items-center text-center"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(40px)" }}
            >
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
                style={{ border: `1px solid ${stat.borderColor}`, background: stat.bgColor, color: stat.labelColor }}
              >
                {stat.label}
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: stat.valueColor }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          className="flex p-1 rounded-full mb-6"
          style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 px-3 rounded-full text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id
                ? { background: "rgba(111,255,233,0.13)", color: "#6FFFE9", border: "1px solid rgba(111,255,233,0.28)" }
                : { color: "rgba(192,192,192,0.60)", background: "transparent", border: "1px solid transparent" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">

            {/* Onboarding */}
            <div
              className="rounded-3xl p-5"
              style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(56px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 20px 56px rgba(0,0,0,0.70)" }}
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3
                    className="font-semibold text-lg"
                    style={{
                      background: "linear-gradient(135deg, #7A7A7A 0%, #D0D0D0 30%, #F5F5F5 50%, #C8C8C8 65%, #888888 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Getting Started
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "rgba(192,192,192,0.50)" }}>3 of 4 completed</p>
                </div>
                <div className="text-2xl font-bold" style={{ color: "#6FFFE9" }}>75%</div>
              </div>
              <div className="w-full h-2.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: "75%", background: "linear-gradient(to right, #6FFFE9, #5DEEDB)" }} />
              </div>
              <div className="space-y-2">
                {onboardingSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{
                      border: step.done ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(111,255,233,0.20)",
                      background: step.done ? "rgba(255,255,255,0.03)" : "rgba(111,255,233,0.04)",
                      opacity: step.done ? 0.55 : 1,
                    }}
                  >
                    {step.done
                      ? <CheckCircle size={16} style={{ color: "#6FFFE9", flexShrink: 0 }} />
                      : <Circle size={16} style={{ color: "#555", flexShrink: 0 }} />}
                    <span className="text-sm" style={{ color: step.done ? "#666" : "#ddd", textDecoration: step.done ? "line-through" : "none" }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Month Settlement */}
            <div
              className="rounded-3xl p-5"
              style={{
                background: "rgba(111,255,233,0.030)",
                backdropFilter: "blur(56px)",
                borderTop: "1px solid rgba(111,255,233,0.45)",
                borderLeft: "1px solid rgba(111,255,233,0.22)",
                borderRight: "1px solid rgba(111,255,233,0.08)",
                borderBottom: "1px solid rgba(111,255,233,0.08)",
                boxShadow: "0 20px 56px rgba(0,0,0,0.70), 0 0 48px rgba(111,255,233,0.07)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div
                    className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ background: "rgba(0,0,0,0.40)", color: "#C0C0C0", border: "1px solid rgba(192,192,192,0.18)" }}
                  >
                    Current Month
                  </div>
                  <div
                    className="text-4xl font-bold tracking-tighter font-mono leading-none"
                    style={{
                      background: "linear-gradient(135deg, #7A7A7A 0%, #D0D0D0 30%, #F5F5F5 50%, #C8C8C8 65%, #888888 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 20px rgba(192,192,192,0.30))",
                    }}
                  >
                    ₹{totalDue.toLocaleString()}
                  </div>
                </div>
                <StatusBadge status="EXPOSED" />
              </div>

              <div className="space-y-1.5 mb-5">
                <div className="flex justify-between text-xs font-medium">
                  <span style={{ color: "rgba(192,192,192,0.70)" }}>Settlement Progress</span>
                  <span style={{ color: "rgba(111,255,233,0.80)" }}>{progressPercent}% Settled</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, background: "linear-gradient(to right, #6FFFE9, #5DEEDB)" }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "rgba(192,192,192,0.50)" }}>
                  <span>Paid <span className="font-mono" style={{ color: "#6FFFE9" }}>₹{amountPaid.toLocaleString()}</span></span>
                  <span>Remaining <span className="font-mono" style={{ color: "#C0C0C0" }}>₹{remaining.toLocaleString()}</span></span>
                </div>
              </div>

              <button
                className="w-full font-bold text-sm rounded-full flex items-center justify-center gap-1"
                style={{ background: "#6FFFE9", color: "#000", height: 48, boxShadow: "0 4px 24px rgba(111,255,233,0.30)" }}
              >
                Pay Now — ₹{remaining.toLocaleString()}
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Recent Payments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(192,192,192,0.50)" }}>Recent Payments</p>
                <button className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(111,255,233,0.70)" }}>View All</button>
              </div>
              <div className="space-y-2">
                {[
                  { date: "3 May", amount: 12000 },
                  { date: "1 Apr", amount: 18000 },
                  { date: "2 Mar", amount: 18000 },
                ].map((pmt) => (
                  <div
                    key={pmt.date}
                    className="rounded-xl flex items-center justify-between p-3"
                    style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6FFFE9", flexShrink: 0 }} />
                      <span className="text-xs font-mono" style={{ color: "rgba(192,192,192,0.60)" }}>{pmt.date}</span>
                    </div>
                    <span className="font-mono text-sm" style={{ color: "#E8E8E8" }}>₹{pmt.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === "payments" && (
          <div className="space-y-5">
            <div
              className="rounded-3xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(56px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 20px 56px rgba(0,0,0,0.70)" }}
            >
              <div>
                <h3 className="text-lg font-bold" style={{ color: "#E8E8E8" }}>Make Payment</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(192,192,192,0.50)" }}>Choose your payment method</p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(111,255,233,0.030)", border: "1px solid rgba(111,255,233,0.22)" }}
              >
                <p className="text-xs mb-1" style={{ color: "rgba(192,192,192,0.50)" }}>Full Payment Amount</p>
                <p className="text-3xl font-bold font-mono" style={{ color: "#C0C0C0" }}>₹{remaining.toLocaleString()}</p>
              </div>
              <button
                className="w-full font-bold text-sm rounded-full flex items-center justify-center gap-2"
                style={{ background: "#6FFFE9", color: "#000", height: 48, boxShadow: "0 4px 24px rgba(111,255,233,0.30)" }}
              >
                Pay ₹{remaining.toLocaleString()} via Razorpay
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: "rgba(192,192,192,0.30)" }}>
                <ShieldCheck size={12} />
                <span>Bank-grade security</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(192,192,192,0.50)" }}>Payment History</p>
              <div className="space-y-2">
                {allLedgers.map(l => {
                  const [yr, mo] = l.monthYear.split("-");
                  const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                  const pct = Math.round((l.amountCollected / l.monthlyRent) * 100);
                  return (
                    <div
                      key={l.id}
                      className="rounded-xl p-4 space-y-2"
                      style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CircleDot size={12} style={{ color: "#555" }} />
                          <span className="text-sm" style={{ color: "#E8E8E8" }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm" style={{ color: "#C0C0C0" }}>
                            ₹{l.amountCollected.toLocaleString()}
                            <span style={{ color: "#555" }}> / ₹{l.monthlyRent.toLocaleString()}</span>
                          </span>
                          <StatusBadge status={l.status} />
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right, rgba(111,255,233,0.70), rgba(93,238,219,0.50))" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <TrendingUp size={14} style={{ color: "rgba(111,255,233,0.60)" }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(192,192,192,0.50)" }}>All Months</span>
                <span className="ml-auto text-[10px] font-mono" style={{ color: "rgba(111,255,233,0.60)" }}>{settledMonths} settled</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LEASE TAB ── */}
        {activeTab === "lease" && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(56px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 20px 56px rgba(0,0,0,0.70)" }}
            >
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(192,192,192,0.50)" }}>Property Details</p>
              <div className="space-y-3">
                {[
                  { Icon: MapPin, label: "Address", value: "204, Prestige Towers, Koramangala, Bengaluru", iconColor: "rgba(111,255,233,0.50)", valueColor: "#E8E8E8" },
                  { Icon: Banknote, label: "Monthly Rent", value: `₹${totalDue.toLocaleString()}`, iconColor: "rgba(192,192,192,0.50)", valueColor: "#C0C0C0" },
                  { Icon: CalendarDays, label: "Payment Due", value: "1st of every month", iconColor: "rgba(192,192,192,0.50)", valueColor: "#E8E8E8" },
                ].map(({ Icon, label, value, iconColor, valueColor }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon size={16} style={{ color: iconColor, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(192,192,192,0.45)" }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: valueColor }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-3xl p-5"
              style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(56px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 20px 56px rgba(0,0,0,0.70)" }}
            >
              <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "rgba(192,192,192,0.50)" }}>Agreement Status</p>
              <div className="space-y-3">
                {[
                  { label: "Agreement Created", done: true },
                  { label: "Owner Signed", done: true },
                  { label: "Tenant Signed", done: false },
                  { label: "Fully Executed", done: false },
                ].map(step => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        border: step.done ? "1px solid rgba(111,255,233,0.50)" : "1px solid rgba(255,255,255,0.12)",
                        background: step.done ? "rgba(111,255,233,0.10)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {step.done && <CheckCircle2 size={10} style={{ color: "#6FFFE9" }} />}
                    </div>
                    <span className="text-sm" style={{ color: step.done ? "#E8E8E8" : "#555" }}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl flex items-center justify-between p-4"
              style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <Wrench size={16} style={{ color: "rgba(192,192,192,0.50)" }} />
                <div>
                  <p className="text-sm" style={{ color: "#E8E8E8" }}>Maintenance Requests</p>
                  <p className="text-xs" style={{ color: "rgba(192,192,192,0.45)" }}>2 total · 1 open</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "#555" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
