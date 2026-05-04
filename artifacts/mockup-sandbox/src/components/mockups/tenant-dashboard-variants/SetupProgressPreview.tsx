
const CSS = `
  @keyframes sp-check {
    to { stroke-dashoffset: 0; }
  }
  @keyframes sp-circle-in {
    0%   { transform: scale(0.7); opacity: 0; }
    65%  { transform: scale(1.04); }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes sp-glow-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(111,255,233,0.1),  inset 0 0 0 1.5px rgba(111,255,233,0.7); }
    50%     { box-shadow: 0 0 24px rgba(111,255,233,0.22), inset 0 0 0 1.5px rgba(111,255,233,0.9); }
  }
  @keyframes sp-fade-up {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-bar { from { width: 0%; } }
`;

const TEAL   = "#6FFFE9";
const FONT   = `"-apple-system","BlinkMacSystemFont","SF Pro Display","Helvetica Neue","Arial",sans-serif`;
const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";

function ShieldPersonIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2.5 L23 6.5 V15 C23 20.5 14 25.5 14 25.5 C14 25.5 5 20.5 5 15 V6.5 Z"
        stroke={color} strokeWidth="1.75" />
      <circle cx="14" cy="12.5" r="3" stroke={color} strokeWidth="1.75" />
      <path d="M8.5 22.5 C8.5 19 11 17 14 17 C17 17 19.5 19 19.5 22.5"
        stroke={color} strokeWidth="1.75" />
    </svg>
  );
}

function DocumentSignIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5 H18 L22 7.5 V25 H7 Z" stroke={color} strokeWidth="1.75" />
      <path d="M18 3.5 V7.5 H22" stroke={color} strokeWidth="1.75" />
      <line x1="11" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.75" />
      <line x1="11" y1="16" x2="18" y2="16" stroke={color} strokeWidth="1.75" />
      <line x1="11" y1="20" x2="15" y2="20" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}

function RupeeCircleIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" strokeLinecap="round">
      <circle cx="14" cy="14" r="10.5" stroke={color} strokeWidth="1.75" />
      <line x1="10" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.75" />
      <line x1="10" y1="13.5" x2="18" y2="13.5" stroke={color} strokeWidth="1.75" />
      <line x1="12.5" y1="10" x2="10" y2="19" stroke={color} strokeWidth="1.75" />
      <line x1="14.5" y1="13.5" x2="10" y2="19" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.5 9.5 L7 13 L14.5 5.5"
        stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="22" strokeDashoffset="22"
        style={{ animation: `sp-check 0.38s ${SPRING} 0.12s forwards` }} />
    </svg>
  );
}

type State = "pending" | "active" | "done";
const ICONS = [ShieldPersonIcon, DocumentSignIcon, RupeeCircleIcon];

function StepCircle({ state, idx }: { state: State; idx: number }) {
  const Icon = ICONS[idx] ?? ICONS[0];
  return (
    <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
      {state === "active" && (
        <div style={{
          position: "absolute", inset: -6, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(111,255,233,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: `sp-circle-in 0.5s ${SPRING} both`,
        ...(state === "done" ? {
          background: TEAL,
          boxShadow: `0 0 16px rgba(111,255,233,0.30)`,
        } : state === "active" ? {
          background: "rgba(111,255,233,0.05)",
          animation: `sp-glow-pulse 3.2s ease-in-out infinite, sp-circle-in 0.5s ${SPRING} both`,
        } : {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
        }),
      }}>
        {state === "done" ? <CheckmarkIcon /> : <Icon color={state === "active" ? TEAL : "rgba(255,255,255,0.22)"} />}
      </div>
    </div>
  );
}

function Connector({ filled }: { filled: boolean }) {
  return (
    <div style={{ flex: 1, height: 1.5, position: "relative", marginBottom: 62, zIndex: 1 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.08)", borderRadius: 999 }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: 999,
        background: `linear-gradient(90deg, rgba(111,255,233,0.55), ${TEAL})`,
        opacity: filled ? 1 : 0,
        transition: "opacity 0.6s ease",
        boxShadow: filled ? `0 0 6px rgba(111,255,233,0.4)` : "none",
      }} />
    </div>
  );
}

interface Step { label: string; done: boolean; }

function Card({ steps, title }: { steps: Step[]; title: string }) {
  const activeIdx = steps.findIndex(s => !s.done);
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div>
      {/* Scenario label */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
        marginBottom: 8, paddingLeft: 2,
      }}>{title}</div>

      {/* Card */}
      <div style={{
        borderRadius: 22, padding: "18px 18px 20px",
        background: "rgba(16, 16, 16, 0.92)",
        border: "0.5px solid rgba(255,255,255,0.11)",
        backdropFilter: "blur(40px) saturate(160%)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset",
        fontFamily: FONT, position: "relative", overflow: "hidden",
      }}>
        <style>{CSS}</style>

        {/* Rim light */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.28)" }}>
            Getting Started
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
            color: done === steps.length - 1 ? "rgba(111,255,233,0.65)" : "rgba(255,255,255,0.22)",
          }}>
            {done} of {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden", marginBottom: 22 }}>
          <div style={{
            height: "100%", borderRadius: 999,
            background: `linear-gradient(90deg, rgba(111,255,233,0.5) 0%, ${TEAL} 100%)`,
            width: `${pct}%`,
            boxShadow: `0 0 8px rgba(111,255,233,0.5)`,
            transition: `width 0.8s ${SPRING}`,
          }} />
        </div>

        {/* Step row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {steps.map((step, i) => {
            const state: State = step.done ? "done" : i === activeIdx ? "active" : "pending";
            return (
              <div key={i} style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10 }}>
                  <StepCircle state={state} idx={i} />
                  <div style={{
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5,
                    animation: `sp-fade-up 0.5s ease ${i * 0.08}s both`,
                  }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, letterSpacing: "-0.01em",
                      textAlign: "center" as const, lineHeight: 1.2, whiteSpace: "nowrap" as const,
                      color: step.done ? "rgba(255,255,255,0.32)" : i === activeIdx ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.22)",
                    }}>
                      {step.label}
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 600, letterSpacing: "0.02em",
                      padding: "2.5px 8px", borderRadius: 100,
                      ...(step.done ? {
                        background: "rgba(111,255,233,0.08)", color: "rgba(111,255,233,0.55)",
                      } : i === activeIdx ? {
                        background: "rgba(111,255,233,0.10)", color: TEAL,
                      } : {
                        background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.20)",
                      }),
                    }}>
                      {step.done ? "✓  Done" : i === activeIdx ? "Next →" : "Pending"}
                    </span>
                  </div>
                </div>
                {i < steps.length - 1 && <Connector filled={step.done} />}
              </div>
            );
          })}
        </div>

        {/* CTA pill */}
        {activeIdx >= 0 && (
          <div style={{
            marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, height: 42, borderRadius: 12,
            background: "rgba(111,255,233,0.07)",
            border: "1px solid rgba(111,255,233,0.20)",
            cursor: "pointer",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: TEAL }}>
              {steps[activeIdx].label}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6 H10 M7 3 L10 6 L7 9" stroke={TEAL} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

const STEPS = [
  { label: "Verify Identity", done: false },
  { label: "Sign Agreement", done: false },
  { label: "Collect Rent",   done: false },
];

export default function SetupProgressPreview() {
  const scenarios = [
    { title: "Step 1 — Verify Identity", steps: [
      { ...STEPS[0], done: false },
      { ...STEPS[1], done: false },
      { ...STEPS[2], done: false },
    ]},
    { title: "Step 2 — Sign Agreement", steps: [
      { ...STEPS[0], done: true  },
      { ...STEPS[1], done: false },
      { ...STEPS[2], done: false },
    ]},
    { title: "Step 3 — Collect Rent", steps: [
      { ...STEPS[0], done: true  },
      { ...STEPS[1], done: true  },
      { ...STEPS[2], done: false },
    ]},
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      padding: "28px 20px",
      display: "flex", flexDirection: "column", gap: 28,
      fontFamily: FONT,
    }}>
      {scenarios.map((s, i) => <Card key={i} steps={s.steps} title={s.title} />)}
    </div>
  );
}
