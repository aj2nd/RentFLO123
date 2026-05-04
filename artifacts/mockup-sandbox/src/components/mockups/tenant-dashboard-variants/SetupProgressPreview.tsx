
const CSS = `
  @keyframes sp-bounce {
    0%,100% { transform: translateY(0px) rotate(-3deg) scale(1); }
    40%      { transform: translateY(-12px) rotate(4deg) scale(1.06); }
    70%      { transform: translateY(-5px) rotate(-1deg) scale(1.02); }
  }
  @keyframes sp-idle {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-3px) rotate(1deg); }
  }
  @keyframes sp-blink {
    0%,74%,100% { transform: scaleY(1); }
    78%,88%     { transform: scaleY(0.05); }
  }
  @keyframes sp-pop {
    0%   { transform: scale(0.4) rotate(-20deg); opacity:0; }
    55%  { transform: scale(1.22) rotate(8deg);  opacity:1; }
    80%  { transform: scale(0.95) rotate(-3deg); }
    100% { transform: scale(1) rotate(0deg);    opacity:1; }
  }
  @keyframes sp-pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0;   }
  }
  @keyframes sp-write {
    0%,100% { transform: rotate(-28deg) translate(0px,0px); }
    50%     { transform: rotate(-28deg) translate(10px,1px); }
  }
  @keyframes sp-flip {
    0%,100% { transform: scaleX(1)    translateY(0px);  }
    25%     { transform: scaleX(1)    translateY(-9px); }
    50%     { transform: scaleX(0.08) translateY(0px);  }
    75%     { transform: scaleX(0.08) translateY(-6px); }
  }
  @keyframes sp-sleep {
    0%,100% { transform: translate(0,0);   opacity:0.55; }
    50%     { transform: translate(4px,-7px); opacity:0.12; }
  }
  @keyframes sp-sleep2 {
    0%,100% { transform: translate(0,0);    opacity:0.35; }
    50%     { transform: translate(5px,-11px); opacity:0.05; }
  }
  @keyframes sp-sparkle {
    0%   { transform: scale(0) rotate(0deg);   opacity:1; }
    60%  { transform: scale(1.2) rotate(60deg); opacity:0.9; }
    100% { transform: scale(0) rotate(120deg); opacity:0; }
  }
  @keyframes sp-sparkle2 {
    0%   { transform: scale(0) rotate(0deg);    opacity:1; }
    60%  { transform: scale(1.0) rotate(-45deg); opacity:0.8; }
    100% { transform: scale(0) rotate(-90deg);  opacity:0; }
  }
  @keyframes sp-bubble-in {
    0%   { transform: scale(0) translateY(4px); opacity:0; }
    70%  { transform: scale(1.08) translateY(-1px); opacity:1; }
    100% { transform: scale(1) translateY(0px);  opacity:1; }
  }
  @keyframes sp-dot-walk {
    0%,100% { opacity:0.15; transform:scale(0.65); }
    50%     { opacity:0.9;  transform:scale(1); }
  }
  @keyframes sp-card-glow {
    0%,100% { box-shadow: 0 0 0px rgba(111,255,233,0); }
    50%     { box-shadow: 0 0 22px rgba(111,255,233,0.08); }
  }
  @keyframes sp-eye-look {
    0%,40%,100% { transform:translateX(0px); }
    60%,80%     { transform:translateX(1.5px); }
  }
  @keyframes sp-shine-sweep {
    0%   { transform:translateX(-100%); opacity:0.5; }
    100% { transform:translateX(400%);  opacity:0;   }
  }
`;

const TEAL = "#6FFFE9";
const SILVER = "#D0D0D0";
type State = "pending" | "active" | "done";

function Sparkles() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
      {[
        { top:"-12px", left:"55%",  size:10, delay:"0s",    anim:"sp-sparkle"  },
        { top:"-8px",  left:"80%",  size:7,  delay:"0.3s",  anim:"sp-sparkle2" },
        { top:"10%",   left:"-10px",size:8,  delay:"0.6s",  anim:"sp-sparkle"  },
        { top:"70%",   left:"88%",  size:6,  delay:"0.15s", anim:"sp-sparkle2" },
        { top:"80%",   left:"5%",   size:7,  delay:"0.5s",  anim:"sp-sparkle"  },
      ].map((s,i) => (
        <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
          style={{ position:"absolute", top:s.top, left:s.left,
            animation:`${s.anim} 1.8s ease-in-out infinite ${s.delay}` }}>
          <path d="M5 0 L5.8 3.8 L10 5 L5.8 6.2 L5 10 L4.2 6.2 L0 5 L4.2 3.8 Z" fill={TEAL} />
        </svg>
      ))}
    </div>
  );
}

function Bubble({ text }: { text:string }) {
  return (
    <div style={{
      position:"absolute", top:"-36px", left:"50%",
      transform:"translateX(-50%)",
      background:"rgba(111,255,233,0.12)",
      border:`1px solid rgba(111,255,233,0.35)`,
      borderRadius:8, padding:"4px 9px",
      whiteSpace:"nowrap",
      animation:"sp-bubble-in 0.4s cubic-bezier(.17,.67,.35,1.4) forwards",
      backdropFilter:"blur(8px)",
    }}>
      <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em",
        color:TEAL, textTransform:"uppercase" as const }}>{text}</span>
      <div style={{
        position:"absolute", bottom:-5, left:"50%", transform:"translateX(-50%)",
        width:0, height:0,
        borderLeft:"5px solid transparent",
        borderRight:"5px solid transparent",
        borderTop:"5px solid rgba(111,255,233,0.35)",
      }} />
    </div>
  );
}

function ShieldChar({ state }: { state:State }) {
  const fill  = state==="done" ? TEAL : state==="active" ? SILVER : "#3a3a3a";
  const eye   = state==="pending" ? "#1e1e1e" : "#fff";
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      {state==="done" && <Sparkles />}
      {state==="active" && (
        <>
          <Bubble text="Tap to verify →" />
          <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
            border:`2px solid rgba(111,255,233,0.45)`,
            animation:"sp-pulse-ring 1.6s ease-out infinite" }} />
          <div style={{ position:"absolute", inset:-14, borderRadius:"50%",
            border:`1px solid rgba(111,255,233,0.2)`,
            animation:"sp-pulse-ring 1.6s ease-out infinite 0.5s" }} />
        </>
      )}
      <svg width="52" height="58" viewBox="0 0 52 58"
        style={{
          animation: state==="active" ? "sp-bounce 1.3s ease-in-out infinite"
                   : state==="done"   ? "sp-pop 0.6s cubic-bezier(.17,.67,.35,1.4) forwards"
                   :                    "sp-idle 3.5s ease-in-out infinite",
          filter: state==="active" ? `drop-shadow(0 8px 16px rgba(111,255,233,0.30))`
                : state==="done"   ? `drop-shadow(0 0 12px rgba(111,255,233,0.65))`
                :                    "none",
        }}>
        <ellipse cx="26" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.35)" opacity={state==="pending"?0.15:0.5} />
        <path d="M26 3 L44 9 L44 26 C44 40 26 52 26 52 C26 52 8 40 8 26 L8 9 Z"
          fill={fill} opacity={state==="pending"?0.3:1} />
        {state!=="pending" && <path d="M12 11 L20 11 L15 26 L10 20 Z" fill="rgba(255,255,255,0.18)" />}
        {state==="done" && <rect x="10" y="22" width="32" height="5" rx="2.5" fill="rgba(0,0,0,0.25)" />}
        <g style={{ transformOrigin:"26px 25px",
          animation: state==="active" ? "sp-blink 3.5s ease-in-out infinite" : "none" }}>
          <g style={{ animation: state==="active" ? "sp-eye-look 4s ease-in-out infinite" : "none" }}>
            <ellipse cx="19" cy="24" rx="4" ry="4.5" fill={eye} />
            <ellipse cx="33" cy="24" rx="4" ry="4.5" fill={eye} />
            <circle cx="20.5" cy="24" r="2" fill="#0a0a0a" />
            <circle cx="34.5" cy="24" r="2" fill="#0a0a0a" />
            {state!=="pending" && (<><circle cx="21.5" cy="22.5" r="1" fill="white" /><circle cx="35.5" cy="22.5" r="1" fill="white" /></>)}
          </g>
        </g>
        {state==="done"   ? <path d="M15 36 Q26 45 37 36" stroke={eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
         : state==="active" ? <path d="M17 34 Q26 41 35 34" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round"/>
         :                    <line x1="18" y1="33" x2="34" y2="33" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round"/>}
        {state==="active" && (<><ellipse cx="14" cy="30" rx="3.5" ry="2" fill="rgba(255,120,120,0.3)" /><ellipse cx="38" cy="30" rx="3.5" ry="2" fill="rgba(255,120,120,0.3)" /></>)}
        {state==="done"   && (<><ellipse cx="14" cy="31" rx="3.5" ry="2" fill="rgba(111,255,233,0.25)" /><ellipse cx="38" cy="31" rx="3.5" ry="2" fill="rgba(111,255,233,0.25)" /></>)}
        {state==="done" && (<g><circle cx="40" cy="12" r="10" fill="#000" /><circle cx="40" cy="12" r="9" fill={TEAL} /><path d="M35 12 L39 16 L45 8" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        {state==="pending" && (<><text x="36" y="16" fontSize="9" fontWeight="900" fill="#484848" style={{ animation:"sp-sleep 2.4s ease-in-out infinite" }}>z</text><text x="40" y="9" fontSize="6.5" fontWeight="900" fill="#383838" style={{ animation:"sp-sleep2 2.4s ease-in-out infinite 0.6s" }}>z</text></>)}
      </svg>
    </div>
  );
}

function DocChar({ state }: { state:State }) {
  const fill  = state==="done" ? TEAL : state==="active" ? "#EEEEEE" : "#3a3a3a";
  const lineC = state==="pending" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.22)";
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      {state==="done" && <Sparkles />}
      {state==="active" && (
        <>
          <Bubble text="Sign agreement →" />
          <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
            border:"2px solid rgba(111,255,233,0.40)", animation:"sp-pulse-ring 1.8s ease-out infinite" }} />
        </>
      )}
      <svg width="52" height="58" viewBox="0 0 52 58"
        style={{
          animation: state==="active" ? "sp-bounce 1.5s ease-in-out infinite"
                   : state==="done"   ? "sp-pop 0.6s cubic-bezier(.17,.67,.35,1.4) forwards"
                   :                    "sp-idle 4s ease-in-out infinite",
          filter: state==="active" ? "drop-shadow(0 8px 16px rgba(111,255,233,0.18))"
                : state==="done"   ? "drop-shadow(0 0 12px rgba(111,255,233,0.55))"
                :                    "none",
        }}>
        <ellipse cx="26" cy="56" rx="11" ry="3" fill="rgba(0,0,0,0.35)" opacity={state==="pending"?0.15:0.45} />
        <rect x="7" y="3" width="32" height="44" rx="4" fill={fill} opacity={state==="pending"?0.28:0.92} />
        <path d="M31 3 L39 11 L31 11 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M31 3 L31 11 L39 11" fill={state==="done"?"#5DEEDB":state==="active"?"#D0D0D0":"#2e2e2e"} opacity={state==="pending"?0.18:0.8} />
        {[17,23,29,35].map((y,i) => (<line key={i} x1="13" y1={y} x2={i===3?26:35} y2={y} stroke={lineC} strokeWidth="1.8" strokeLinecap="round" />))}
        {state!=="pending" && <rect x="9" y="5" width="8" height="40" rx="2" fill="rgba(255,255,255,0.06)" />}
        {state==="active" && (
          <g style={{ animation:"sp-write 1.6s ease-in-out infinite", transformOrigin:"23px 38px" }}>
            <rect x="21" y="36" width="6" height="15" rx="2" fill="#FFD700" transform="rotate(-30 24 43.5)" />
            <polygon points="20,49 25,49 22.5,56" fill="#888" transform="rotate(-30 22.5 52)" />
            <rect x="24" y="34" width="2" height="8" rx="1" fill="#E85D04" transform="rotate(-30 25 38)" />
            <rect x="21.5" y="33" width="5" height="5" rx="1.5" fill="#C94000" transform="rotate(-30 24 35.5)" />
          </g>
        )}
        {state==="done" && (<g><circle cx="40" cy="12" r="10" fill="#000" /><circle cx="40" cy="12" r="9" fill={TEAL} /><path d="M35 12 L39 16 L45 8" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        {state==="pending" && (<><text x="34" y="16" fontSize="9" fontWeight="900" fill="#484848" style={{ animation:"sp-sleep 2.8s ease-in-out infinite" }}>z</text><text x="38" y="9" fontSize="6.5" fontWeight="900" fill="#383838" style={{ animation:"sp-sleep2 2.8s ease-in-out infinite 0.8s" }}>z</text></>)}
      </svg>
    </div>
  );
}

function CoinChar({ state }: { state:State }) {
  const outerFill = state==="done" ? "#5DEEDB" : state==="active" ? "#A8A8A8" : "#252525";
  const faceFill  = state==="done" ? TEAL       : state==="active" ? SILVER    : "#323232";
  const textC     = state==="done" ? "#000"      : state==="active" ? "#111"    : "#1a1a1a";
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      {state==="done" && <Sparkles />}
      {state==="active" && (
        <>
          <Bubble text="Pay rent →" />
          <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
            border:"2px solid rgba(192,192,192,0.50)", animation:"sp-pulse-ring 1.4s ease-out infinite" }} />
          <div style={{ position:"absolute", inset:-14, borderRadius:"50%",
            border:"1px solid rgba(192,192,192,0.22)", animation:"sp-pulse-ring 1.4s ease-out infinite 0.4s" }} />
        </>
      )}
      <svg width="52" height="58" viewBox="0 0 52 58"
        style={{
          animation: state==="active" ? "sp-flip 2.4s ease-in-out infinite"
                   : state==="done"   ? "sp-pop 0.6s cubic-bezier(.17,.67,.35,1.4) forwards"
                   :                    "sp-idle 4.5s ease-in-out infinite",
          filter: state==="active" ? "drop-shadow(0 8px 18px rgba(192,192,192,0.32))"
                : state==="done"   ? "drop-shadow(0 0 14px rgba(111,255,233,0.65))"
                :                    "none",
        }}>
        <ellipse cx="26" cy="56" rx="13" ry="3.5" fill="rgba(0,0,0,0.4)" opacity={state==="pending"?0.12:0.5} />
        <circle cx="26" cy="27" r="22" fill={outerFill} opacity={state==="pending"?0.22:0.7} />
        <circle cx="26" cy="27" r="19" fill={faceFill} opacity={state==="pending"?0.26:1} />
        <circle cx="26" cy="27" r="15" fill="none" stroke={state==="pending"?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.15)"} strokeWidth="1.5" />
        {state!=="pending" && <ellipse cx="17" cy="19" rx="5" ry="7" fill="rgba(255,255,255,0.22)" />}
        <text x="26" y="35" textAnchor="middle" fontSize="22" fontWeight="900"
          fontFamily="system-ui,-apple-system,sans-serif"
          fill={state==="pending"?"#1a1a1a":textC} opacity={state==="pending"?0.32:1}>₹</text>
        {state==="done" && (<><ellipse cx="26" cy="52" rx="19" ry="4" fill="#5DEEDB" opacity={0.7}/><ellipse cx="26" cy="49" rx="19" ry="4" fill={TEAL} opacity={0.8}/></>)}
        {state==="done" && (<g><circle cx="42" cy="11" r="10" fill="#000" /><circle cx="42" cy="11" r="9" fill={TEAL} /><path d="M37 11 L41 15 L47 7" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        {state==="pending" && (<><text x="37" y="14" fontSize="9" fontWeight="900" fill="#484848" style={{ animation:"sp-sleep 3.2s ease-in-out infinite" }}>z</text><text x="41" y="7" fontSize="6.5" fontWeight="900" fill="#383838" style={{ animation:"sp-sleep2 3.2s ease-in-out infinite 0.9s" }}>z</text></>)}
      </svg>
    </div>
  );
}

function PathConnector({ lit }: { lit:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", flexShrink:0, marginBottom:32, gap:3, marginLeft:4, marginRight:4 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width:5, height:5, borderRadius:"50%",
          background: lit ? TEAL : "#2a2a2a",
          opacity: lit ? 0.75 : 0.28,
          animation: lit ? `sp-dot-walk 1.2s ease-in-out infinite ${i*0.18}s` : "none",
          transition:"background 0.5s, opacity 0.5s",
        }} />
      ))}
    </div>
  );
}

function ProgressBar({ pct }: { pct:number }) {
  return (
    <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:999, overflow:"hidden", marginBottom:20 }}>
      <div style={{
        height:"100%", borderRadius:999,
        background:`linear-gradient(90deg, rgba(111,255,233,0.4) 0%, ${TEAL} 100%)`,
        width:`${pct}%`,
        transition:"width 0.7s cubic-bezier(0.4,0,0.2,1)",
        boxShadow:`0 0 8px rgba(111,255,233,0.5)`,
      }} />
    </div>
  );
}

interface ProgressStep { label:string; done:boolean; }

function Card({ steps }: { steps:ProgressStep[] }) {
  const activeIdx = steps.findIndex(s => !s.done);
  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const Chars = [ShieldChar, DocChar, CoinChar];
  return (
    <div style={{
      borderRadius:20, padding:"18px 16px 14px",
      background:"rgba(255,255,255,0.022)",
      border:"1px solid rgba(255,255,255,0.08)",
      backdropFilter:"blur(24px)",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:0, left:"-60%",
        width:"40%", height:"100%",
        background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.025),transparent)",
        animation:"sp-shine-sweep 5s ease-in-out infinite 2s",
        pointerEvents:"none",
      }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase" as const, color:"rgba(192,192,192,0.45)" }}>Getting Started</span>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" as const, color: doneCount===steps.length-1 ? TEAL : "rgba(192,192,192,0.32)" }}>{doneCount}/{steps.length} complete</span>
      </div>
      <ProgressBar pct={pct} />
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
        {steps.map((step, i) => {
          const Char = Chars[i];
          const state:State = step.done ? "done" : i===activeIdx ? "active" : "pending";
          return (
            <div key={i} style={{ display:"flex", alignItems:"flex-end" }}>
              <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:8, minWidth:72 }}>
                <Char state={state} />
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, textAlign:"center" as const, lineHeight:1.3,
                  color: step.done ? "rgba(111,255,233,0.45)" : i===activeIdx ? TEAL : "rgba(255,255,255,0.18)" }}>
                  {step.label}
                </span>
                <span style={{
                  fontSize:8, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase" as const,
                  padding:"2px 7px", borderRadius:999,
                  background: step.done ? "rgba(111,255,233,0.10)" : i===activeIdx ? "rgba(111,255,233,0.14)" : "rgba(255,255,255,0.05)",
                  border: step.done ? "1px solid rgba(111,255,233,0.25)" : i===activeIdx ? "1px solid rgba(111,255,233,0.30)" : "1px solid rgba(255,255,255,0.07)",
                  color: step.done ? "rgba(111,255,233,0.6)" : i===activeIdx ? TEAL : "rgba(255,255,255,0.18)",
                }}>
                  {step.done ? "✓ done" : i===activeIdx ? "← next" : "pending"}
                </span>
              </div>
              {i < steps.length-1 && <PathConnector lit={step.done} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SetupProgressPreview() {
  const scenarios = [
    { label: "Step 1 active", steps: [
      { label:"Verify Identity", done:false },
      { label:"Sign Agreement", done:false },
      { label:"Pay Rent", done:false },
    ]},
    { label: "Step 2 active", steps: [
      { label:"Verify Identity", done:true },
      { label:"Sign Agreement", done:false },
      { label:"Pay Rent", done:false },
    ]},
    { label: "Step 3 active", steps: [
      { label:"Verify Identity", done:true },
      { label:"Sign Agreement", done:true },
      { label:"Pay Rent", done:false },
    ]},
  ];

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0a0a0a",
      padding:20,
      display:"flex",
      flexDirection:"column",
      gap:20,
      fontFamily:"system-ui,-apple-system,sans-serif",
    }}>
      <style>{CSS}</style>
      {scenarios.map((s, i) => (
        <div key={i}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase",
            color:"rgba(255,255,255,0.2)", marginBottom:8, paddingLeft:4 }}>{s.label}</div>
          <Card steps={s.steps} />
        </div>
      ))}
    </div>
  );
}
