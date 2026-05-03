import { useEffect, useState, useRef } from 'react';

const T = '#6FFFE9';

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const RAIN_CHARS = '0123456789₹$%#@!&';
const rnd = (n: number) => Math.floor(Math.random() * n);

function usePhase(active: boolean) {
  const [phase, setPhase] = useState<Phase>(0);
  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const times: [Phase, number][] = [
      [1, 0], [2, 700], [3, 1600], [4, 2500], [5, 3400], [6, 4000], [7, 4700],
    ];
    const ids = times.map(([p, t]) => setTimeout(() => setPhase(p), t));
    return () => ids.forEach(clearTimeout);
  }, [active]);
  return phase;
}

function NumberRain({ phase }: { phase: Phase }) {
  const [cols, setCols] = useState<{ char: string; delay: number; dur: number }[][]>([]);
  useEffect(() => {
    const N = 22, rows = 8;
    setCols(Array.from({ length: N }, () =>
      Array.from({ length: rows }, () => ({
        char: RAIN_CHARS[rnd(RAIN_CHARS.length)],
        delay: rnd(400),
        dur: 200 + rnd(300),
      }))
    ));
  }, []);

  if (phase < 1 || phase > 2) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1,
      display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center',
      opacity: phase === 2 ? 0 : 1,
      transition: phase === 2 ? 'opacity 0.8s ease-out' : 'opacity 0.3s',
      pointerEvents: 'none',
      fontFamily: 'monospace',
    }}>
      <style>{`
        @keyframes colFall { 0%{opacity:0;transform:translateY(-20px)} 30%{opacity:1} 100%{opacity:0.15;transform:translateY(20px)} }
      `}</style>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {col.map((cell, ri) => (
            <span key={ri} style={{
              fontSize: 11, color: `rgba(111,255,233,${0.2 + Math.random() * 0.5})`,
              animation: `colFall ${cell.dur}ms ${cell.delay}ms ease-in-out infinite alternate`,
              display: 'block',
            }}>{cell.char}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function ScanLine({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`@keyframes scanDown { 0%{top:-2px} 100%{top:100vh} }`}</style>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${T} 30%, #fff 50%, ${T} 70%, transparent 100%)`,
        boxShadow: `0 0 20px 4px ${T}`,
        animation: 'scanDown 0.7s cubic-bezier(0.4,0,0.6,1) forwards',
      }} />
    </div>
  );
}

function Ring({ phase }: { phase: Phase }) {
  const r = 70, c = 88, stroke = 5;
  const circ = 2 * Math.PI * r;
  const segments = 16;
  const segAngle = 360 / segments;

  return (
    <svg width={c * 2} height={c * 2} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)' }}>
      <style>{`@keyframes segIn { from{stroke-dashoffset:${circ / segments}} to{stroke-dashoffset:0} }`}</style>
      {Array.from({ length: segments }).map((_, i) => {
        const dash = circ / segments - 3;
        const offset = (circ / segments) * i;
        const delay = phase >= 3 ? i * 60 : 9999;
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
            stroke={i % 2 === 0 ? T : `rgba(111,255,233,0.3)`}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / segments - offset}
            style={{
              transformOrigin: `${c}px ${c}px`,
              transform: `rotate(${i * segAngle}deg)`,
              animation: phase >= 3 ? `segIn 0.15s ${delay}ms cubic-bezier(0,0,0.2,1) both` : 'none',
              opacity: phase >= 3 ? 1 : 0,
            }}
          />
        );
      })}
    </svg>
  );
}

function Check({ phase }: { phase: Phase }) {
  const len = 85;
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
      <style>{`@keyframes drawPath { to { stroke-dashoffset: 0 } }`}</style>
      <polyline points="10,26 20,36 38,14" stroke={T} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: len, strokeDashoffset: phase >= 4 ? 0 : len,
          transition: phase >= 4 ? 'stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1) 0ms' : 'none',
        }}
      />
    </svg>
  );
}

function Stamp({ phase }: { phase: Phase }) {
  return (
    <div style={{
      position: 'absolute', top: '14%', right: '8%',
      transform: phase >= 5 ? 'rotate(-12deg) scale(1)' : 'rotate(-12deg) scale(0)',
      opacity: phase >= 5 ? 1 : 0,
      transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
      transitionDelay: '0s',
      border: `3px solid ${T}`,
      padding: '4px 12px',
      fontFamily: 'Inter,sans-serif',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.3em',
      color: T,
      boxShadow: `inset 0 0 0 1px rgba(111,255,233,0.2), 0 0 20px rgba(111,255,233,0.15)`,
    }}>
      SETTLED
    </div>
  );
}

const ROWS = [
  { label: 'PAYMENT ID', value: 'pay_Q3rKxF9mNjL2' },
  { label: 'DATE', value: '03 May 2026, 09:41 AM' },
  { label: 'PROPERTY', value: 'Koramangala 4B — Unit 204' },
  { label: 'TENANT', value: 'Ravi Krishnamurthy' },
  { label: 'METHOD', value: 'UPI · RAZORPAY' },
  { label: 'STATUS', value: 'SETTLED ✓' },
];

function Counter({ target, active }: { target: number; active: boolean }) {
  const [val, setVal] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    start.current = null;
    const dur = 1400;
    const go = (ts: number) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, [active, target]);
  return <span>{val.toLocaleString('en-IN')}</span>;
}

export function PaymentReceipt() {
  const [go, setGo] = useState(false);
  const phase = usePhase(go);

  useEffect(() => {
    const t = setTimeout(() => setGo(true), 400);
    return () => clearTimeout(t);
  }, []);

  const replay = () => { setGo(false); setTimeout(() => setGo(true), 50); };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(111,255,233,0.25)} 50%{box-shadow:0 0 60px rgba(111,255,233,0.5)} }
        @keyframes rowIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <ScanLine active={phase === 1} />
      <NumberRain phase={phase} />

      {/* Radial glow behind */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(111,255,233,${phase >= 3 ? 0.07 : 0}), transparent 70%)`,
        transition: 'background 1s',
      }} />

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 3, width: 420,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Ring + Check — centered above card */}
        <div style={{ position: 'relative', width: 176, height: 176, margin: '0 auto 32px' }}>
          <Ring phase={phase} />
          <Check phase={phase} />
          {phase >= 3 && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              animation: 'glow 2.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Amount — huge */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, fontWeight: 600 }}>
            AMOUNT SETTLED
          </div>
          <div style={{
            fontFamily: '"Playfair Display",serif', fontSize: 62, fontWeight: 700,
            color: '#fff', letterSpacing: '-0.02em', lineHeight: 1,
            opacity: phase >= 5 ? 1 : 0,
            transform: phase >= 5 ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.4s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            ₹{phase >= 5 ? <Counter target={50000} active={phase >= 5} /> : '0'}
          </div>
        </div>

        {/* Stamp */}
        <div style={{ position: 'relative', height: 0 }}>
          <Stamp phase={phase} />
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)', margin: '28px 0',
          opacity: phase >= 6 ? 1 : 0, transition: 'opacity 0.4s 0.1s',
        }} />

        {/* Receipt rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROWS.map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: phase >= 7 ? 1 : 0,
              animation: phase >= 7 ? `rowIn 0.4s ${i * 70}ms cubic-bezier(0.22,1,0.36,1) both` : 'none',
            }}>
              <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: row.label === 'STATUS' ? T : 'rgba(255,255,255,0.75)', fontFamily: row.label === 'PAYMENT ID' ? 'monospace' : 'inherit', fontWeight: row.label === 'STATUS' ? 700 : 400 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 32,
          opacity: phase >= 7 ? 1 : 0,
          transform: phase >= 7 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.4s 0.5s, transform 0.5s 0.5s',
        }}>
          <button onClick={replay} style={{
            flex: 1, padding: '12px', background: T, color: '#000', border: 'none',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
          }}>
            DOWNLOAD RECEIPT
          </button>
          <button onClick={replay} style={{
            flex: 1, padding: '12px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          }}>
            REPLAY ↺
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReceipt;
