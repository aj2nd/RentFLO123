import { Link } from "wouter";

const CSS = `
  @keyframes sp-bounce {
    0%,100% { transform: translateY(0px) rotate(-4deg); }
    50%      { transform: translateY(-10px) rotate(4deg); }
  }
  @keyframes sp-blink {
    0%,78%,100% { transform: scaleY(1); }
    82%,92%     { transform: scaleY(0.06); }
  }
  @keyframes sp-pop {
    0%   { transform: scale(0.5) rotate(-15deg); }
    65%  { transform: scale(1.18) rotate(6deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes sp-pulse {
    0%   { transform: scale(1); opacity: 0.55; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes sp-write {
    0%,100% { transform: rotate(-28deg) translate(0px, 0px); }
    50%     { transform: rotate(-28deg) translate(9px, 1px); }
  }
  @keyframes sp-flip {
    0%,100% { transform: rotateY(0deg) translateY(0px); }
    25%     { transform: rotateY(0deg) translateY(-8px); }
    50%     { transform: rotateY(180deg) translateY(0px); }
    75%     { transform: rotateY(180deg) translateY(-6px); }
  }
  @keyframes sp-sleep {
    0%,100% { transform: translate(0px, 0px); opacity: 0.5; }
    50%     { transform: translate(3px, -5px); opacity: 0.15; }
  }
  @keyframes sp-sleep2 {
    0%,100% { transform: translate(0px, 0px); opacity: 0.35; }
    50%     { transform: translate(4px, -8px); opacity: 0.08; }
  }
  @keyframes sp-dot {
    0%,100% { opacity: 0.15; transform: scale(0.7); }
    50%     { opacity: 0.8; transform: scale(1); }
  }
  @keyframes sp-star {
    0%   { transform: scale(0) rotate(0deg); opacity: 1; }
    100% { transform: scale(1.4) rotate(80deg); opacity: 0; }
  }
  @keyframes sp-glow {
    0%,100% { filter: drop-shadow(0 0 4px rgba(111,255,233,0.4)); }
    50%     { filter: drop-shadow(0 0 14px rgba(111,255,233,0.9)); }
  }
`;

type State = "pending" | "active" | "done";

/* ─── Character 1: Shield Guy (Verify Identity) ─── */
function ShieldChar({ state }: { state: State }) {
  const teal = "#6FFFE9";
  const silver = "#D0D0D0";
  const fill = state === "done" ? teal : state === "active" ? silver : "#3a3a3a";
  const eyeFill = state === "pending" ? "#252525" : "#fff";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {state === "active" && (
        <div style={{
          position: "absolute", inset: -6, borderRadius: "50%",
          border: `2px solid rgba(111,255,233,0.45)`,
          animation: "sp-pulse 1.6s ease-out infinite",
        }} />
      )}
      <svg
        width="44" height="48" viewBox="0 0 44 48"
        style={{
          animation: state === "active" ? "sp-bounce 1.2s ease-in-out infinite" : state === "done" ? "sp-pop 0.5s cubic-bezier(.17,.67,.35,1.4) forwards" : "none",
          filter: state === "active" ? "drop-shadow(0 6px 10px rgba(111,255,233,0.22))" : state === "done" ? "drop-shadow(0 0 8px rgba(111,255,233,0.55))" : "none",
        }}
      >
        {/* Shield body */}
        <path
          d="M22 3 L38 8 L38 24 C38 36 22 45 22 45 C22 45 6 36 6 24 L6 8 Z"
          fill={fill}
          opacity={state === "pending" ? 0.32 : 1}
        />
        {/* Shine */}
        {state !== "pending" && (
          <path d="M10 9 L17 9 L13 22 L8 17 Z" fill="rgba(255,255,255,0.17)" />
        )}
        {/* Eyes container — blinks when active */}
        <g style={{ transformOrigin: "22px 22px", animation: state === "active" ? "sp-blink 3.5s ease-in-out infinite" : "none" }}>
          <ellipse cx="16" cy="21" rx="3.2" ry="3.8" fill={eyeFill} />
          <ellipse cx="28" cy="21" rx="3.2" ry="3.8" fill={eyeFill} />
          <circle cx="17" cy="21" r="1.6" fill={state === "pending" ? "#111" : "#111"} />
          <circle cx="29" cy="21" r="1.6" fill={state === "pending" ? "#111" : "#111"} />
          {state !== "pending" && (
            <>
              <circle cx="18" cy="19.5" r="0.8" fill="white" />
              <circle cx="30" cy="19.5" r="0.8" fill="white" />
            </>
          )}
        </g>
        {/* Mouth */}
        {state === "done"
          ? <path d="M13 30 Q22 38 31 30" stroke={eyeFill} strokeWidth="2" fill="none" strokeLinecap="round" />
          : state === "active"
          ? <path d="M15 29 Q22 35 29 29" stroke={eyeFill} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          : <line x1="16" y1="28" x2="28" y2="28" stroke="#2a2a2a" strokeWidth="1.8" strokeLinecap="round" />
        }
        {/* Done badge */}
        {state === "done" && (
          <>
            <circle cx="34" cy="11" r="9" fill="#000" />
            <circle cx="34" cy="11" r="8" fill={teal} />
            <path d="M29 11 L33 15 L39 7" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* Sleeping Zs */}
        {state === "pending" && (
          <>
            <text x="31" y="14" fontSize="7" fontWeight="900" fill="#4a4a4a" style={{ animation: "sp-sleep 2.2s ease-in-out infinite" }}>z</text>
            <text x="34" y="8" fontSize="5" fontWeight="900" fill="#3a3a3a" style={{ animation: "sp-sleep2 2.2s ease-in-out infinite 0.5s" }}>z</text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Character 2: Paper + Pen (Sign Agreement) ─── */
function DocChar({ state }: { state: State }) {
  const teal = "#6FFFE9";
  const fill = state === "done" ? teal : state === "active" ? "#E8E8E8" : "#3a3a3a";
  const lineC = state === "pending" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.25)";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {state === "active" && (
        <div style={{
          position: "absolute", inset: -6, borderRadius: "50%",
          border: "2px solid rgba(111,255,233,0.40)",
          animation: "sp-pulse 1.8s ease-out infinite",
        }} />
      )}
      <svg
        width="44" height="48" viewBox="0 0 44 48"
        style={{
          animation: state === "active" ? "sp-bounce 1.4s ease-in-out infinite" : state === "done" ? "sp-pop 0.5s cubic-bezier(.17,.67,.35,1.4) forwards" : "none",
          filter: state === "active" ? "drop-shadow(0 6px 10px rgba(111,255,233,0.18))" : state === "done" ? "drop-shadow(0 0 8px rgba(111,255,233,0.50))" : "none",
        }}
      >
        {/* Paper body */}
        <rect x="5" y="2" width="28" height="38" rx="3" fill={fill} opacity={state === "pending" ? 0.28 : 0.92} />
        {/* Folded corner */}
        <path d="M27 2 L33 8 L27 8 Z" fill="rgba(0,0,0,0.18)" />
        <path d="M27 2 L27 8 L33 8" fill={state === "done" ? "#5DEEDB" : state === "active" ? "#C8C8C8" : "#333"} opacity={state === "pending" ? 0.2 : 0.8} />
        {/* Lines */}
        <line x1="11" y1="15" x2="28" y2="15" stroke={lineC} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="11" y1="21" x2="28" y2="21" stroke={lineC} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="11" y1="27" x2="22" y2="27" stroke={lineC} strokeWidth="1.8" strokeLinecap="round" />
        {/* Animated pen */}
        {state === "active" && (
          <g style={{ animation: "sp-write 1.5s ease-in-out infinite", transformOrigin: "20px 32px" }}>
            <rect x="18" y="30" width="5" height="13" rx="1.5" fill="#FFD700" transform="rotate(-28 20.5 36.5)" />
            <polygon points="17.5,41 22,41 19.75,47" fill="#999" transform="rotate(-28 19.75 44)" />
            <rect x="18.5" y="28" width="4" height="4" rx="1" fill="#D94F04" transform="rotate(-28 20.5 30)" />
          </g>
        )}
        {/* Done badge */}
        {state === "done" && (
          <>
            <circle cx="34" cy="11" r="9" fill="#000" />
            <circle cx="34" cy="11" r="8" fill={teal} />
            <path d="M29 11 L33 15 L39 7" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* Sleeping Zs */}
        {state === "pending" && (
          <>
            <text x="30" y="14" fontSize="7" fontWeight="900" fill="#4a4a4a" style={{ animation: "sp-sleep 2.6s ease-in-out infinite" }}>z</text>
            <text x="33" y="8" fontSize="5" fontWeight="900" fill="#3a3a3a" style={{ animation: "sp-sleep2 2.6s ease-in-out infinite 0.7s" }}>z</text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Character 3: Rupee Coin (Pay Rent) ─── */
function CoinChar({ state }: { state: State }) {
  const teal = "#6FFFE9";
  const silver = "#C8C8C8";
  const fill = state === "done" ? teal : state === "active" ? silver : "#3a3a3a";
  const textColor = state === "done" ? "#000" : state === "active" ? "#111" : "#1a1a1a";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {state === "active" && (
        <div style={{
          position: "absolute", inset: -6, borderRadius: "50%",
          border: "2px solid rgba(192,192,192,0.45)",
          animation: "sp-pulse 1.4s ease-out infinite",
        }} />
      )}
      <svg
        width="44" height="48" viewBox="0 0 44 48"
        style={{
          animation: state === "active" ? "sp-flip 2.2s ease-in-out infinite" : state === "done" ? "sp-pop 0.5s cubic-bezier(.17,.67,.35,1.4) forwards" : "none",
          filter: state === "active" ? "drop-shadow(0 6px 14px rgba(192,192,192,0.30))" : state === "done" ? "drop-shadow(0 0 10px rgba(111,255,233,0.55))" : "none",
        }}
      >
        {/* Outer ring */}
        <circle cx="22" cy="24" r="19" fill={state === "pending" ? "#2a2a2a" : state === "done" ? "#5DEEDB" : "#A0A0A0"} opacity={state === "pending" ? 0.25 : 0.6} />
        {/* Coin face */}
        <circle cx="22" cy="24" r="17" fill={fill} opacity={state === "pending" ? 0.28 : 1} />
        {/* Shine */}
        {state !== "pending" && (
          <ellipse cx="15" cy="17" rx="4" ry="6" fill="rgba(255,255,255,0.22)" />
        )}
        {/* ₹ symbol */}
        <text
          x="22" y="32"
          textAnchor="middle"
          fontSize="19"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={state === "pending" ? "#1a1a1a" : textColor}
          opacity={state === "pending" ? 0.35 : 1}
        >₹</text>
        {/* Done badge */}
        {state === "done" && (
          <>
            <circle cx="35" cy="10" r="9" fill="#000" />
            <circle cx="35" cy="10" r="8" fill={teal} />
            <path d="M30 10 L34 14 L40 7" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* Sleeping Zs */}
        {state === "pending" && (
          <>
            <text x="32" y="13" fontSize="7" fontWeight="900" fill="#4a4a4a" style={{ animation: "sp-sleep 3s ease-in-out infinite" }}>z</text>
            <text x="35" y="7" fontSize="5" fontWeight="900" fill="#3a3a3a" style={{ animation: "sp-sleep2 3s ease-in-out infinite 0.8s" }}>z</text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Animated dots connector ─── */
function DotConnector({ lit }: { lit: boolean }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 mb-6">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 4, height: 4, borderRadius: "50%",
            background: lit ? "#6FFFE9" : "#2a2a2a",
            animation: lit ? `sp-dot 1.2s ease-in-out infinite ${i * 0.22}s` : "none",
            opacity: lit ? 0.7 : 0.3,
            transition: "background 0.4s",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Public component ─── */
export interface ProgressStep {
  label: string;
  done: boolean;
  href?: string;
}

export function SetupProgress({ steps }: { steps: ProgressStep[] }) {
  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  const activeIdx = steps.findIndex(s => !s.done);
  const doneCount = steps.filter(s => s.done).length;

  const chars = [ShieldChar, DocChar, CoinChar];

  return (
    <div
      className="mb-6 rounded-2xl px-4 pt-4 pb-3"
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
      data-testid="setup-progress"
    >
      <style>{CSS}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-[3px]" style={{ color: "rgba(192,192,192,0.45)" }}>
          Getting Started
        </p>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: doneCount === steps.length - 1 ? "#6FFFE9" : "rgba(192,192,192,0.35)" }}>
          {doneCount}/{steps.length} done
        </span>
      </div>

      {/* Characters row */}
      <div className="flex items-end justify-center gap-0">
        {steps.map((step, i) => {
          const Char = chars[i] ?? chars[0];
          const state: State = step.done ? "done" : i === activeIdx ? "active" : "pending";

          return (
            <div key={step.label} className="flex items-end">
              {/* Character + label */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Character */}
                {step.href && state === "active" ? (
                  <Link href={step.href} style={{ display: "block" }}>
                    <Char state={state} />
                  </Link>
                ) : (
                  <Char state={state} />
                )}

                {/* Step label */}
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider text-center leading-tight px-1 whitespace-nowrap"
                  style={{
                    color: step.done
                      ? "rgba(111,255,233,0.50)"
                      : i === activeIdx
                      ? "#6FFFE9"
                      : "rgba(255,255,255,0.20)",
                  }}
                >
                  {step.label}
                </span>

                {/* Status micro-tag */}
                <span
                  className="text-[8px] font-bold uppercase tracking-[1.5px]"
                  style={{
                    color: step.done
                      ? "rgba(111,255,233,0.30)"
                      : i === activeIdx
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.12)",
                    animation: i === activeIdx && !step.done ? "sp-dot 1.8s ease-in-out infinite" : "none",
                  }}
                >
                  {step.done ? "✓ done" : i === activeIdx ? "← tap" : "pending"}
                </span>
              </div>

              {/* Animated dot connector between steps */}
              {i < steps.length - 1 && (
                <DotConnector lit={step.done} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
