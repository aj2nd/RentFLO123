import { useState, useEffect, useRef } from 'react';

const T = '#6FFFE9';

function useCounter(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    ref.current = null;
    const go = (ts: number) => {
      if (!ref.current) ref.current = ts;
      const p = Math.min((ts - ref.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, [active, target, duration]);
  return val;
}

function Waveform({ active }: { active: boolean }) {
  const bars = 42;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 4 + Math.abs(Math.sin(i * 0.8 + 1.2)) * 28 + Math.abs(Math.cos(i * 0.4)) * 8;
        return (
          <div key={i} style={{
            width: 2, height: `${h}px`,
            background: `rgba(111,255,233,${0.15 + (h / 36) * 0.55})`,
            animation: active ? `barPulse ${0.8 + (i % 5) * 0.15}s ${(i % 7) * 0.08}s ease-in-out infinite alternate` : 'none',
            flexShrink: 0,
          }} />
        );
      })}
    </div>
  );
}

function GlassPanel({ children, style = {}, blur = 18, opacity = 0.06 }: {
  children: React.ReactNode; style?: React.CSSProperties; blur?: number; opacity?: number;
}) {
  return (
    <div style={{
      background: `rgba(255,255,255,${opacity})`,
      backdropFilter: `blur(${blur}px) saturate(180%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.4)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {/* Glass sheen line */}
      <div style={{
        position: 'absolute', top: 0, left: '-100%', right: '-100%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}

const ACTIVITIES = [
  { name: 'Ravi K.',    prop: 'Koramangala 4B', amt: '₹32,000', s: 'SETTLED',  t: '09:41' },
  { name: 'Meera S.',   prop: 'HSR Sector 2',   amt: '₹18,500', s: 'PARTIAL',  t: '09:22' },
  { name: 'Arjun T.',   prop: 'Whitefield B3',  amt: '₹27,000', s: 'SETTLED',  t: '08:55' },
  { name: 'Priya N.',   prop: 'JP Nagar 7',     amt: '₹29,000', s: 'SETTLED',  t: '08:31' },
  { name: 'Suresh M.',  prop: 'Indiranagar 12A',amt: '₹44,000', s: 'PENDING',  t: '08:10' },
];

const STATUS_COLOR: Record<string, string> = {
  SETTLED: T, PARTIAL: '#facc15', PENDING: 'rgba(255,255,255,0.35)',
};

export function GlassDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const advanced = useCounter(240000, mounted);
  const collected = useCounter(85000, mounted, 1400);
  const properties = useCounter(12, mounted, 1200);
  const rate = useCounter(98, mounted, 1800);

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'Inter,sans-serif',
      background: '#020508',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes auroraShift {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(8%, -12%) scale(1.15); }
          66%  { transform: translate(-6%, 8%) scale(0.9); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes auroraShift2 {
          0%   { transform: translate(0%, 0%) scale(1); }
          40%  { transform: translate(-10%, 10%) scale(1.2); }
          80%  { transform: translate(6%, -6%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes auroraShift3 {
          0%   { transform: translate(0%, 0%) scale(1.1); }
          50%  { transform: translate(12%, 6%) scale(0.85); }
          100% { transform: translate(0%, 0%) scale(1.1); }
        }
        @keyframes barPulse {
          from { transform: scaleY(0.6); }
          to   { transform: scaleY(1.1); }
        }
        @keyframes lightSweep {
          0%   { left: -60%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 160%; opacity: 0; }
        }
        @keyframes fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      {/* === AURORA BACKGROUND === */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#020508' }}>
        {/* Blob 1 — deep teal left */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,78,92,0.9) 0%, rgba(6,78,92,0.4) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'auroraShift 28s ease-in-out infinite',
        }} />
        {/* Blob 2 — tiffany tint bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-25%', right: '-20%',
          width: '75vw', height: '75vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(111,255,233,0.18) 0%, rgba(20,120,100,0.3) 35%, transparent 65%)',
          filter: 'blur(100px)',
          animation: 'auroraShift2 34s ease-in-out infinite',
        }} />
        {/* Blob 3 — indigo/violet hint for depth */}
        <div style={{
          position: 'absolute', top: '40%', left: '30%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,20,80,0.7) 0%, transparent 60%)',
          filter: 'blur(90px)',
          animation: 'auroraShift3 22s ease-in-out infinite',
        }} />
        {/* Noise texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          opacity: 0.6,
        }} />
      </div>

      {/* === CONTENT === */}
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>

        {/* ── SIDEBAR ── */}
        <GlassPanel blur={32} opacity={0.04} style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '32px 0', display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 700 }}>RENTFLO</div>
            <div style={{ fontSize: 18, fontWeight: 300, color: '#fff', letterSpacing: '-0.02em' }}>Owner<span style={{ color: T, fontWeight: 600 }}>Suite</span></div>
          </div>

          {/* Nav items */}
          <div style={{ padding: '20px 0', flex: 1 }}>
            {[
              { label: 'Dashboard', active: true, dot: T },
              { label: 'Ledger', active: false },
              { label: 'Properties', active: false },
              { label: 'Tenants', active: false },
              { label: 'Messages', active: false },
              { label: 'Agreements', active: false },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 24px', cursor: 'pointer',
                background: item.active ? 'rgba(111,255,233,0.08)' : 'transparent',
                borderLeft: item.active ? `2px solid ${T}` : '2px solid transparent',
                marginBottom: 2,
              }}>
                {item.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T, boxShadow: `0 0 8px ${T}`, animation: 'pulseGlow 2s infinite' }} />}
                <span style={{ fontSize: 12, color: item.active ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: item.active ? 500 : 400, letterSpacing: '0.02em' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* User */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${T}40, #fff1)`, border: `1px solid ${T}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T, fontWeight: 700 }}>RK</div>
            <div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>Rahul K.</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>OWNER</div>
            </div>
          </div>
        </GlassPanel>

        {/* ── MAIN CONTENT ── */}
        <div style={{ padding: '32px 32px 40px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 6, fontWeight: 700 }}>OVERVIEW — MAY 2026</div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 200, color: '#fff', letterSpacing: '-0.02em' }}>
                Good morning, <span style={{ fontWeight: 600, color: T }}>Rahul</span>
              </h1>
            </div>
            <GlassPanel blur={14} opacity={0.05} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, animation: 'pulseGlow 1.8s infinite' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>ALL SYSTEMS LIVE</span>
            </GlassPanel>
          </div>

          {/* HERO METRIC */}
          <GlassPanel blur={24} opacity={0.06} style={{ padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
            {/* Light sweep animation */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
              animation: 'lightSweep 5s 1s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 700 }}>TOTAL RENT ADVANCED — FY 2025–26</div>
                <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 64, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 12 }}>
                  ₹{advanced.toLocaleString('en-IN')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: T, fontWeight: 600, letterSpacing: '0.1em' }}>+18.4% YoY</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>vs ₹2,02,720 last FY</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>FREQUENCY</div>
                <Waveform active={mounted} />
              </div>
            </div>
          </GlassPanel>

          {/* STAT TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'COLLECTED THIS MONTH', value: `₹${collected.toLocaleString('en-IN')}`, sub: '12 of 12 tenants', accent: T },
              { label: 'ACTIVE PROPERTIES', value: properties.toString(), sub: 'Zero vacancy', accent: '#fff' },
              { label: 'COLLECTION RATE', value: `${rate}%`, sub: 'All on time', accent: T },
            ].map((s, i) => (
              <GlassPanel key={i} blur={20} opacity={0.05} style={{ padding: '22px 24px', animation: `fadein 0.5s ${0.2 + i * 0.1}s both` }}>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', marginBottom: 10, fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 300, color: s.accent, letterSpacing: '-0.02em', marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.sub}</div>
              </GlassPanel>
            ))}
          </div>

          {/* ACTIVITY */}
          <GlassPanel blur={16} opacity={0.04} style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 16 }}>RECENT ACTIVITY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 60px',
                  alignItems: 'center', gap: 12,
                  padding: '11px 0',
                  borderBottom: i < ACTIVITIES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  animation: `fadein 0.4s ${0.3 + i * 0.06}s both`,
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{a.t}</span>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{a.prop}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', textAlign: 'right' }}>{a.amt}</span>
                  <span style={{ fontSize: 8, letterSpacing: '0.15em', color: STATUS_COLOR[a.s], textAlign: 'right', fontWeight: 700 }}>{a.s}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

export default GlassDashboard;
