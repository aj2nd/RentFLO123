import { Link } from "wouter";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

const CSS = `
  @keyframes sp-check {
    to { stroke-dashoffset: 0; }
  }
  @keyframes sp-circle-in {
    0%   { transform: scale(0.55) translateZ(0); opacity: 0; }
    65%  { transform: scale(1.06) translateZ(0); }
    100% { transform: scale(1)   translateZ(0); opacity: 1; }
  }
  @keyframes sp-glow-pulse {
    0%,100% {
      box-shadow: 0 0 0 0 rgba(111,255,233,0.0),
                  0 0 6px rgba(111,255,233,0.05),
                  inset 0 0 0 1.5px rgba(111,255,233,0.30),
                  inset 0 -4px 12px rgba(0,0,0,0.4),
                  inset 0 2px 4px rgba(111,255,233,0.04);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(111,255,233,0.12),
                  0 0 36px rgba(111,255,233,0.55),
                  0 0 70px rgba(111,255,233,0.25),
                  inset 0 0 0 2px rgba(111,255,233,1.0),
                  inset 0 -4px 12px rgba(0,0,0,0.3),
                  inset 0 2px 10px rgba(111,255,233,0.30);
    }
  }

  @keyframes sp-glow-ambient {
    0%,100% { opacity: 0.08; transform: scale(1);   }
    50%     { opacity: 0.55; transform: scale(1.35); }
  }
  @keyframes sp-fade-up {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-bar {
    from { width: 0%; }
  }

  /* 3D flip for done transition */
  @keyframes sp-flip-in {
    0%   { transform: perspective(200px) rotateY(-90deg) scale(0.8); opacity: 0; }
    60%  { transform: perspective(200px) rotateY(12deg)  scale(1.04); }
    100% { transform: perspective(200px) rotateY(0deg)   scale(1);   opacity: 1; }
  }

  /* Floating particle drift */
  @keyframes sp-particle-a {
    0%,100% { transform: translate(0px, 0px) scale(1);   opacity: 0.35; }
    33%     { transform: translate(8px, -12px) scale(1.4); opacity: 0.7;  }
    66%     { transform: translate(-5px, -7px) scale(0.8); opacity: 0.25; }
  }
  @keyframes sp-particle-b {
    0%,100% { transform: translate(0px, 0px) scale(0.9); opacity: 0.2;  }
    40%     { transform: translate(-10px, -8px) scale(1.3); opacity: 0.55; }
    70%     { transform: translate(6px, -14px) scale(1);  opacity: 0.3;  }
  }
  @keyframes sp-particle-c {
    0%,100% { transform: translate(0px, 0px);   opacity: 0.15; }
    50%     { transform: translate(12px, -10px); opacity: 0.5;  }
  }

  /* Shimmer sweep on card surface */
  @keyframes sp-shimmer {
    0%   { transform: translateX(-120%) skewX(-18deg); }
    100% { transform: translateX(220%)  skewX(-18deg); }
  }

  /* CTA button glow breathe — synced to sp-glow-ambient (2.2s) */
  @keyframes sp-cta-breathe {
    0%,100% {
      box-shadow: 0 0 0 0 rgba(111,255,233,0.0),
                  0 2px 6px rgba(111,255,233,0.05),
                  inset 0 0 0 1px rgba(111,255,233,0.12);
      border-color: rgba(111,255,233,0.14);
      background: linear-gradient(135deg, rgba(111,255,233,0.05), rgba(111,255,233,0.02));
    }
    50% {
      box-shadow: 0 0 0 5px rgba(111,255,233,0.10),
                  0 0 28px rgba(111,255,233,0.50),
                  0 0 56px rgba(111,255,233,0.20),
                  inset 0 0 0 1px rgba(111,255,233,0.80),
                  inset 0 0 18px rgba(111,255,233,0.12);
      border-color: rgba(111,255,233,0.70);
      background: linear-gradient(135deg, rgba(111,255,233,0.16), rgba(111,255,233,0.07));
    }
  }

  /* Shimmer that sweeps through the CTA on each bright peak */
  @keyframes sp-cta-shimmer {
    0%   { transform: translateX(-160%) skewX(-20deg); opacity: 0;   }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(260%)  skewX(-20deg); opacity: 0;   }
  }

  /* Connector fill sweep */
  @keyframes sp-connector-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }

  /* Done badge pop */
  @keyframes sp-badge-pop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1);   opacity: 1; }
  }

  .sp-card {
    transform-style: preserve-3d;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .sp-cta-btn:hover {
    background: rgba(111,255,233,0.12) !important;
    border-color: rgba(111,255,233,0.38) !important;
    transform: translateY(-1px) scale(1.01);
  }
  .sp-cta-btn:active {
    transform: translateY(1px) scale(0.98) !important;
    box-shadow: none !important;
  }
`;

const TEAL   = "#6FFFE9";
const FONT   = `"-apple-system","BlinkMacSystemFont","SF Pro Display","Helvetica Neue","Arial",sans-serif`;
const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";

/* ─── Icons ─── */
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 10.5 L8 14.5 L16 6"
        stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="24" strokeDashoffset="24"
        style={{ animation: `sp-check 0.42s ${SPRING} 0.08s forwards` }}
      />
    </svg>
  );
}

type State = "pending" | "active" | "done";
const ICONS = [ShieldPersonIcon, DocumentSignIcon, RupeeCircleIcon];

/* ─── Floating particles ─── */
function Particles() {
  const pts = [
    { x: "18%",  y: "22%", r: 2.5,  anim: "sp-particle-a 4.2s ease-in-out infinite" },
    { x: "72%",  y: "18%", r: 1.8,  anim: "sp-particle-b 5.8s ease-in-out infinite 0.9s" },
    { x: "85%",  y: "55%", r: 2.0,  anim: "sp-particle-c 3.6s ease-in-out infinite 0.4s" },
    { x: "45%",  y: "80%", r: 1.4,  anim: "sp-particle-a 6.1s ease-in-out infinite 1.7s" },
    { x: "10%",  y: "65%", r: 1.6,  anim: "sp-particle-b 4.9s ease-in-out infinite 2.1s" },
    { x: "60%",  y: "35%", r: 1.2,  anim: "sp-particle-c 5.3s ease-in-out infinite 0.6s" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.x, top: p.y,
          width: p.r * 2, height: p.r * 2,
          borderRadius: "50%",
          background: TEAL,
          animation: p.anim,
          filter: "blur(0.5px)",
        }} />
      ))}
    </div>
  );
}

/* ─── Step circle ─── */
function StepCircle({ state, idx, href }: { state: State; idx: number; href?: string }) {
  const Icon = ICONS[idx] ?? ICONS[0];

  /* 3D sphere-like shading */
  const sphereHighlight = "radial-gradient(circle at 38% 30%, rgba(255,255,255,0.22) 0%, transparent 58%)";

  const baseStyle: CSSProperties = {
    width: 54, height: 54, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative",
    transformStyle: "preserve-3d",
  };

  const doneStyle: CSSProperties = {
    ...baseStyle,
    background: `${sphereHighlight}, radial-gradient(circle at 50% 110%, rgba(0,0,0,0.35) 0%, transparent 60%), ${TEAL}`,
    boxShadow: `
      0 0 0 2px rgba(111,255,233,0.55),
      0 0 24px rgba(111,255,233,0.45),
      0 0 48px rgba(111,255,233,0.18),
      0 8px 20px rgba(0,0,0,0.55),
      inset 0 -5px 14px rgba(0,0,0,0.25),
      inset 0 3px 8px rgba(255,255,255,0.30)
    `,
    animation: `sp-flip-in 0.55s ${SPRING} both`,
  };

  const activeStyle: CSSProperties = {
    ...baseStyle,
    background: `${sphereHighlight}, rgba(111,255,233,0.06)`,
    animation: `sp-glow-pulse 3.0s ease-in-out infinite, sp-circle-in 0.52s ${SPRING} both`,
  };

  const pendingStyle: CSSProperties = {
    ...baseStyle,
    background: `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.06) 0%, transparent 58%), rgba(255,255,255,0.045)`,
    boxShadow: `
      inset 0 0 0 1px rgba(255,255,255,0.08),
      0 4px 12px rgba(0,0,0,0.45),
      inset 0 -3px 8px rgba(0,0,0,0.25),
      inset 0 2px 4px rgba(255,255,255,0.05)
    `,
    animation: `sp-circle-in 0.5s ${SPRING} both`,
  };

  return (
    <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
      {/* Wide ambient glow behind active — pulses with circle */}
      {state === "active" && (
        <div style={{
          position: "absolute", inset: -24, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(111,255,233,0.55) 0%, rgba(111,255,233,0.15) 40%, transparent 70%)",
          pointerEvents: "none",
          animation: "sp-glow-ambient 2.2s ease-in-out infinite",
        }} />
      )}

      {href ? (
        <Link href={href} style={{ display: "block", borderRadius: "50%", textDecoration: "none" }}>
          <div style={{ ...(state === "done" ? doneStyle : state === "active" ? activeStyle : pendingStyle), cursor: "pointer" }}>
            <div style={{
              position: "absolute", top: 6, left: 7, width: 14, height: 8,
              borderRadius: "50%", background: "rgba(255,255,255,0.25)",
              filter: "blur(3px)", pointerEvents: "none",
              opacity: state === "pending" ? 0.4 : 0.7,
            }} />
            {state === "done" ? <CheckmarkIcon /> : <Icon color={state === "active" ? TEAL : "rgba(255,255,255,0.20)"} />}
          </div>
        </Link>
      ) : (
        <div style={state === "done" ? doneStyle : state === "active" ? activeStyle : pendingStyle}>
          <div style={{
            position: "absolute", top: 6, left: 7, width: 14, height: 8,
            borderRadius: "50%", background: "rgba(255,255,255,0.25)",
            filter: "blur(3px)", pointerEvents: "none",
            opacity: state === "pending" ? 0.4 : 0.7,
          }} />
          {state === "done" ? <CheckmarkIcon /> : <Icon color={state === "active" ? TEAL : "rgba(255,255,255,0.20)"} />}
        </div>
      )}
    </div>
  );
}

/* ─── Connector ─── */
function Connector({ filled }: { filled: boolean }) {
  return (
    <div style={{ flex: 1, height: 2, position: "relative", marginBottom: 52, zIndex: 1 }}>
      {/* Track with 3D inset illusion */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 999,
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
      }} />
      {/* Glowing fill */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        borderRadius: 999,
        background: `linear-gradient(90deg, rgba(111,255,233,0.45), ${TEAL})`,
        width: filled ? "100%" : "0%",
        transition: `width 0.9s ${SPRING}`,
        boxShadow: filled ? `0 0 6px rgba(111,255,233,0.5), 0 0 12px rgba(111,255,233,0.25)` : "none",
        animation: filled ? `sp-connector-fill 0.9s ${SPRING} both` : "none",
      }} />
      {/* Moving light dot on fill edge */}
      {filled && (
        <div style={{
          position: "absolute", top: "50%", right: 0,
          width: 6, height: 6, borderRadius: "50%",
          background: TEAL,
          transform: "translate(50%, -50%)",
          boxShadow: `0 0 8px ${TEAL}`,
        }} />
      )}
    </div>
  );
}

/* ─── Public component ─── */
export interface ProgressStep {
  label: string;
  done:  boolean;
  href?: string;
}

export function SetupProgress({ steps }: { steps: ProgressStep[] }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  /* 3D tilt on mouse move */
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5; // -0.5 to 0.5
    const y = (e.clientY - top)  / height - 0.5;
    setTilt({ rx: -y * 7, ry: x * 9 });
  }
  function onMouseLeave() {
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  }

  if (steps.every(s => s.done)) return null;

  const activeIdx = steps.findIndex(s => !s.done);
  const done      = steps.filter(s => s.done).length;
  const pct       = Math.round((done / steps.length) * 100);
  const active    = steps[activeIdx];

  const cardTransform = `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`;

  return (
    <div
      ref={cardRef}
      data-testid="setup-progress"
      className="sp-card"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setHovered(true)}
      style={{
        borderRadius: 22,
        padding: "18px 18px 20px",
        background: "rgba(14, 14, 14, 0.92)",
        border: "0.5px solid rgba(255,255,255,0.11)",
        backdropFilter: "blur(40px) saturate(170%)",
        WebkitBackdropFilter: "blur(40px) saturate(170%)",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(111,255,233,0.10) inset, 0 1px 0 rgba(255,255,255,0.07) inset"
          : "0 4px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.05) inset",
        fontFamily: FONT,
        overflow: "hidden",
        position: "relative",
        marginBottom: 24,
        transform: cardTransform,
        transition: "transform 0.18s ease, box-shadow 0.25s ease",
        willChange: "transform",
      }}
    >
      <style>{CSS}</style>

      {/* Floating particles */}
      <Particles />

      {/* Top rim light */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)",
        pointerEvents: "none",
      }} />

      {/* Shimmer sweep (on hover) */}
      {hovered && (
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0,
          width: "45%",
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.025) 50%, transparent 70%)",
          animation: "sp-shimmer 1.2s ease forwards",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      )}

      {/* Ambient teal corner glow */}
      <div style={{
        position: "absolute", bottom: -20, right: -20, width: 120, height: 120,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(111,255,233,0.09) 0%, transparent 70%)",
        pointerEvents: "none",
        transition: "opacity 0.4s ease",
        opacity: hovered ? 1 : 0.5,
      }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, position: "relative", zIndex: 2,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
        }}>
          Getting Started
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: done === steps.length - 1 ? "rgba(111,255,233,0.70)" : "rgba(255,255,255,0.22)",
          transition: "color 0.4s ease",
        }}>
          {done} of {steps.length}
        </span>
      </div>

      {/* 3D progress bar */}
      <div style={{
        height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 999,
        overflow: "hidden", marginBottom: 22, position: "relative", zIndex: 2,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.45)",
      }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: `linear-gradient(90deg, rgba(111,255,233,0.45) 0%, ${TEAL} 100%)`,
          width: `${pct}%`,
          boxShadow: `0 0 10px rgba(111,255,233,0.55), 0 0 24px rgba(111,255,233,0.22)`,
          transition: `width 0.9s ${SPRING}`,
          animation: "sp-bar 0.9s ease both",
          position: "relative",
        }}>
          {/* Moving shimmer on progress bar */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 20,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6))",
            borderRadius: "0 999px 999px 0",
            filter: "blur(2px)",
          }} />
        </div>
      </div>

      {/* Steps row */}
      <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
        {steps.map((step, i) => {
          const state: State = step.done ? "done" : i === activeIdx ? "active" : "pending";
          return (
            <div key={step.label} style={{ display: "contents" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              }}>
                <StepCircle state={state} idx={i} href={step.href} />

                {/* Label + badge */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  animation: `sp-fade-up 0.5s ease ${i * 0.09}s both`,
                }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, letterSpacing: "-0.01em",
                    textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap",
                    color: step.done       ? "rgba(255,255,255,0.30)"
                         : i === activeIdx ? "rgba(255,255,255,0.92)"
                         :                   "rgba(255,255,255,0.22)",
                    transition: "color 0.4s ease",
                  }}>
                    {step.label}
                  </span>

                  {/* 3D badge */}
                  <span style={{
                    fontSize: 9.5, fontWeight: 700,
                    letterSpacing: "0.02em",
                    padding: "2.5px 8px", borderRadius: 100,
                    transition: "all 0.4s ease",
                    position: "relative",
                    ...(step.done ? {
                      background: "linear-gradient(135deg, rgba(111,255,233,0.12), rgba(111,255,233,0.06))",
                      color: "rgba(111,255,233,0.60)",
                      border: "0.5px solid rgba(111,255,233,0.18)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(111,255,233,0.10)",
                      animation: "sp-badge-pop 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
                    } : i === activeIdx ? {
                      background: "linear-gradient(135deg, rgba(111,255,233,0.15), rgba(111,255,233,0.07))",
                      color: TEAL,
                      border: `0.5px solid rgba(111,255,233,0.30)`,
                      boxShadow: `0 0 10px rgba(111,255,233,0.18), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(111,255,233,0.12)`,
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.20)",
                      border: "0.5px solid rgba(255,255,255,0.07)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
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

      {/* 3D CTA button */}
      {active?.href && (
        <Link href={active.href} style={{ display: "block", marginTop: 20, position: "relative", zIndex: 2 }}>
          <div
            className="sp-cta-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, height: 44, borderRadius: 14,
              border: "1px solid rgba(111,255,233,0.14)",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              animation: "sp-cta-breathe 2.2s ease-in-out infinite",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top rim highlight */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(111,255,233,0.30), transparent)",
              pointerEvents: "none",
            }} />
            {/* Repeating shimmer sweep in sync with glow peak */}
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              width: "35%",
              background: "linear-gradient(105deg, transparent 20%, rgba(111,255,233,0.10) 50%, transparent 80%)",
              animation: "sp-cta-shimmer 2.2s ease-in-out infinite",
              pointerEvents: "none",
            }} />
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: TEAL,
              textShadow: "0 0 14px rgba(111,255,233,0.55)",
              position: "relative", zIndex: 1,
            }}>
              {active.label}
            </span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position: "relative", zIndex: 1 }}>
              <path d="M2 6.5 H11 M8 3.5 L11 6.5 L8 9.5"
                stroke={TEAL} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      )}
    </div>
  );
}
