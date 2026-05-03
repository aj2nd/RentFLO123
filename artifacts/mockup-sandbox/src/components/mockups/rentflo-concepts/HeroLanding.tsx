import { useEffect, useState, useRef } from 'react';

const T = '#6FFFE9';

/* ── Cursor spotlight ─────────────────────────── */
function Spotlight() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
      background: `radial-gradient(circle 400px at ${pos.x}px ${pos.y}px, rgba(111,255,233,0.06), transparent 70%)`,
      transition: 'background 0.05s',
    }} />
  );
}

/* ── Topology SVG background ──────────────────── */
function Topology() {
  const lines = Array.from({ length: 22 }, (_, i) => {
    const y = (i / 21) * 100;
    const amp = 6 + (i % 4) * 3;
    const freq = 0.015 + (i % 3) * 0.006;
    const phase = i * 0.8;
    const pts = Array.from({ length: 120 }, (_, j) => {
      const x = (j / 119) * 100;
      const yy = y + Math.sin(j * freq + phase) * amp;
      return `${x}%,${yy}%`;
    }).join(' ');
    return { pts, opacity: 0.03 + (i % 5) * 0.015, delay: i * 0.12 };
  });
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} preserveAspectRatio="none">
      <style>{`
        @keyframes topoLine { 0%{stroke-dashoffset:2000} 100%{stroke-dashoffset:0} }
      `}</style>
      {lines.map((l, i) => (
        <polyline key={i} points={l.pts} fill="none"
          stroke={T} strokeWidth="0.5" opacity={l.opacity}
          style={{ strokeDasharray: 2000, animation: `topoLine 4s ${l.delay}s ease-out both` }}
        />
      ))}
    </svg>
  );
}

/* ── Typewriter ───────────────────────────────── */
function useTypewriter(words: string[], startDelay = 200) {
  const [texts, setTexts] = useState(words.map(() => ''));
  useEffect(() => {
    let totalDelay = startDelay;
    words.forEach((word, wi) => {
      word.split('').forEach((_, ci) => {
        const t = totalDelay + ci * 55;
        setTimeout(() => {
          setTexts(prev => {
            const next = [...prev];
            next[wi] = word.slice(0, ci + 1);
            return next;
          });
        }, t);
      });
      totalDelay += word.length * 55 + 180;
    });
  }, []);
  return texts;
}

/* ── Counter ──────────────────────────────────── */
function Counter({ to, suffix = '', prefix = '', dur = 1800, delay = 0 }: { to: number; suffix?: string; prefix?: string; dur?: number; delay?: number }) {
  const [v, setV] = useState(0);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, []);
  const s = useRef<number | null>(null);
  useEffect(() => {
    if (!go) return;
    s.current = null;
    const frame = (ts: number) => {
      if (!s.current) s.current = ts;
      const p = Math.min((ts - s.current) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setV(Math.round(e * to));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [go, to, dur]);
  return <>{prefix}{v.toLocaleString('en-IN')}{suffix}</>;
}

/* ── Ticker ───────────────────────────────────── */
const TICKER = [
  '500+ Landlords', '₹24 Cr Advanced', '99.2% On-Time', 'Koramangala', 'Indiranagar',
  'HSR Layout', 'Whitefield', 'Zero Defaults', '12,000+ Payments', 'Bangalore · Mumbai · Pune',
];
function Ticker() {
  const [offset, setOffset] = useState(0);
  const itemW = 180;
  useEffect(() => {
    let frame: number;
    let last: number;
    const go = (ts: number) => {
      if (!last) last = ts;
      const dt = ts - last; last = ts;
      setOffset(o => (o + dt * 0.035) % (itemW * TICKER.length));
      frame = requestAnimationFrame(go);
    };
    frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, []);
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '9px 0', position: 'relative' }}>
      <div style={{ display: 'flex', transform: `translateX(-${offset}px)`, willChange: 'transform' }}>
        {items.map((t, i) => (
          <div key={i} style={{ minWidth: itemW, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: T, opacity: 0.5, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Phone Mockup ─────────────────────────────── */
function Phone() {
  return (
    <div style={{
      width: 200, height: 400,
      border: '1.5px solid rgba(255,255,255,0.15)',
      borderRadius: 28,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {/* Notch */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 14, background: '#000', borderRadius: '0 0 10px 10px', zIndex: 2 }} />
      {/* Screen content */}
      <div style={{ padding: '24px 14px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>RENTFLO</span>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, boxShadow: `0 0 6px ${T}` }} />
        </div>
        {/* Hero number */}
        <div style={{ background: `rgba(111,255,233,0.06)`, border: `1px solid rgba(111,255,233,0.15)`, padding: '14px 12px' }}>
          <div style={{ fontSize: 7, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>RENT DUE</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: '#fff' }}>₹32,000</div>
          <div style={{ fontSize: 7, color: T, marginTop: 2 }}>DUE 1 JUN ·  7 DAYS</div>
        </div>
        {/* Mini cards */}
        {['PAY via UPI', 'VIEW LEDGER', 'RAISE TICKET'].map((label, i) => (
          <div key={i} style={{
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{label}</span>
            <span style={{ fontSize: 8, color: T }}>→</span>
          </div>
        ))}
        {/* Bottom nav dots */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[T, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)'].map((c, i) => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────── */
export function HeroLanding() {
  const lines = useTypewriter(['Never Chase', 'Rent. Ever.'], 300);

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter,sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes lineGrow { from{width:0;opacity:0} to{width:100%;opacity:1} }
        @keyframes wordIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatPhone { 0%,100%{transform:translateY(0) rotateX(4deg) rotateY(-8deg)} 50%{transform:translateY(-12px) rotateX(4deg) rotateY(-8deg)} }
        @keyframes fadeup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(111,255,233,0.3)} 50%{box-shadow:0 0 22px rgba(111,255,233,0.7)} }
      `}</style>

      <Spotlight />
      <Topology />

      {/* NAV */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', fontWeight: 700, color: '#fff' }}>RENTFLO</div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['How it works', 'For Owners', 'Pricing', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', letterSpacing: '0.05em' }}>{l}</span>
          ))}
        </div>
        <button style={{
          padding: '9px 20px', background: 'transparent', border: `1px solid ${T}`,
          color: T, fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Inter,sans-serif',
        }}>
          LOG IN →
        </button>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center', padding: '80px 48px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Left */}
        <div>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            border: '1px solid rgba(111,255,233,0.2)', padding: '6px 14px',
            animation: 'fadeup 0.5s 0.1s both',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, animation: 'glow 2s infinite' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.2em', color: T, fontWeight: 600 }}>INDIA'S #1 RENT ADVANCE PLATFORM</span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: '0 0 8px', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: '#fff', display: 'block', minHeight: '1.1em' }}>
              {lines[0]}<span style={{ color: T, animation: 'glow 1.2s infinite' }}>_</span>
            </div>
            <div style={{
              fontSize: 72, fontWeight: 700, display: 'block', minHeight: '1.1em',
              background: `linear-gradient(90deg, #fff 0%, ${T} 60%, #fff 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {lines[1]}
            </div>
          </h1>

          {/* Accent line */}
          <div style={{
            height: 2, background: `linear-gradient(90deg, ${T}, transparent)`,
            marginBottom: 24, marginTop: 4,
            animation: 'lineGrow 0.8s 1.8s ease-out both',
          }} />

          {/* Sub */}
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 460, lineHeight: 1.65, margin: '0 0 36px', animation: 'fadeup 0.5s 2s both' }}>
            Landlords get paid on the 1st. Always. RentFLO advances rent instantly and collects from tenants — so you never chase, negotiate, or wait.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, animation: 'fadeup 0.5s 2.2s both' }}>
            <button style={{
              padding: '14px 32px', background: T, color: '#000', border: 'none',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', cursor: 'pointer',
              fontFamily: 'Inter,sans-serif',
              boxShadow: `0 0 30px rgba(111,255,233,0.25)`,
            }}>
              GET STARTED FREE →
            </button>
            <button style={{
              padding: '14px 28px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            }}>
              ▶ WATCH DEMO
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 40, animation: 'fadeup 0.5s 2.4s both' }}>
            {[
              { label: 'ADVANCED', value: 24, prefix: '₹', suffix: ' Cr+', dur: 2000, delay: 2500 },
              { label: 'LANDLORDS', value: 500, suffix: '+', dur: 1600, delay: 2600 },
              { label: 'ON-TIME RATE', value: 99.2, suffix: '%', dur: 1800, delay: 2700 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 28, fontWeight: 300, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <Counter to={s.value} prefix={s.prefix || ''} suffix={s.suffix} dur={s.dur} delay={s.delay} />
                </div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone */}
        <div style={{
          perspectiveOrigin: '50% 50%',
          animation: 'floatPhone 5s ease-in-out infinite',
          animationDelay: '0.5s',
          opacity: 0,
          animationFillMode: 'forwards',
          animationName: 'floatPhone, fadeup',
          animationDuration: '5s, 0.5s',
          animationDelay: '0s, 2s',
          animationTimingFunction: 'ease-in-out, ease-out',
          animationIterationCount: 'infinite, 1',
          animationFillMode: 'none, both',
        } as React.CSSProperties}>
          <Phone />
        </div>
      </div>

      {/* Ticker */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 8 }}>
        <Ticker />
      </div>

      {/* Social proof row */}
      <div style={{ position: 'relative', zIndex: 10, padding: '28px 48px', display: 'flex', alignItems: 'center', gap: 32, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>TRUSTED BY LANDLORDS IN</span>
        {['Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai'].map(city => (
          <span key={city} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>{city}</span>
        ))}
      </div>
    </div>
  );
}

export default HeroLanding;
