import { useRef, useState, useEffect } from 'react';

const TIFFANY = '#6FFFE9';

const METRICS = [
  {
    label: 'TOTAL ADVANCED',
    value: 240000,
    display: '₹2,40,000',
    delta: '+18.4%',
    up: true,
    spark: [30, 45, 38, 60, 52, 70, 65, 80, 72, 90, 85, 100],
  },
  {
    label: 'COLLECTED THIS MONTH',
    value: 85000,
    display: '₹85,000',
    delta: '+12.1%',
    up: true,
    spark: [50, 40, 60, 55, 70, 62, 75, 68, 82, 78, 88, 95],
  },
  {
    label: 'ACTIVE PROPERTIES',
    value: 12,
    display: '12',
    delta: '0 VACANT',
    up: true,
    spark: [8, 8, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12],
  },
  {
    label: 'SETTLEMENTS',
    value: 8,
    display: '8 / 8',
    delta: '100% ON TIME',
    up: true,
    spark: [3, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8],
  },
];

const FEED = [
  { time: '09:41', type: 'SETTLED', tenant: 'Ravi K.', prop: 'Koramangala 4B', amount: '₹32,000', color: TIFFANY },
  { time: '09:38', type: 'ADVANCED', tenant: '—', prop: 'Indiranagar 12A', amount: '₹48,000', color: '#fff' },
  { time: '09:22', type: 'PARTIAL', tenant: 'Meera S.', prop: 'HSR Sector 2', amount: '₹18,500', color: '#facc15' },
  { time: '08:55', type: 'SETTLED', tenant: 'Arjun T.', prop: 'Whitefield B3', amount: '₹27,000', color: TIFFANY },
  { time: '08:31', type: 'ADVANCED', tenant: '—', prop: 'JP Nagar 7', amount: '₹55,000', color: '#fff' },
  { time: '08:10', type: 'SETTLED', tenant: 'Priya N.', prop: 'Marathahalli 5A', amount: '₹29,000', color: TIFFANY },
];

function Sparkline({ data, w = 80, h = 28, color = TIFFANY }: { data: number[]; w?: number; h?: number; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const filled = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={filled} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function GlitchNumber({ display, active }: { display: string; active: boolean }) {
  const [shown, setShown] = useState('--------');
  const chars = '0123456789₹,';
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const total = 18;
    const id = setInterval(() => {
      frame++;
      if (frame >= total) { setShown(display); clearInterval(id); return; }
      const progress = frame / total;
      setShown(display.split('').map((c, i) => {
        if (i / display.length < progress) return c;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
    }, 40);
    return () => clearInterval(id);
  }, [active]);
  return <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{shown}</span>;
}

function Card({ metric, mouseX, mouseY, containerRef, idx }: {
  metric: typeof METRICS[0]; mouseX: number; mouseY: number;
  containerRef: React.RefObject<HTMLDivElement | null>; idx: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 200 + idx * 120);
    return () => clearTimeout(t);
  }, []);

  let rx = 0, ry = 0, dist = 0;
  if (ref.current && containerRef.current) {
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx, dy = mouseY - cy;
    dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 600;
    const factor = Math.max(0, 1 - dist / maxDist);
    rx = -(dy / (r.height / 2)) * 18 * factor;
    ry = (dx / (r.width / 2)) * 18 * factor;
  }

  const glowOpacity = hov ? 0.5 : Math.max(0, 0.15 * (1 - dist / 500));

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${hov ? 1.04 : 1})`,
        transition: hov ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Glow bloom behind card */}
      <div style={{
        position: 'absolute', inset: '-12px',
        background: `radial-gradient(ellipse at 50% 50%, rgba(111,255,233,${glowOpacity}), transparent 70%)`,
        filter: 'blur(20px)',
        transform: 'translateZ(-30px)',
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
        borderRadius: 0,
      }} />

      {/* Card body */}
      <div style={{
        background: '#050505',
        border: `1px solid rgba(111,255,233,${hov ? 0.45 : 0.12})`,
        padding: '28px 24px 20px',
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateZ(0px)',
        transition: 'border-color 0.25s',
      }}>
        {/* Scanline shimmer on hover */}
        {hov && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, transparent 0%, rgba(111,255,233,0.04) 50%, transparent 100%)',
            backgroundSize: '100% 4px',
            animation: 'scanMove 1.2s linear infinite',
          }} />
        )}

        {/* Corner brackets */}
        {[['top:0;left:0','borderTop,borderLeft'],['top:0;right:0','borderTop,borderRight'],['bottom:0;left:0','borderBottom,borderLeft'],['bottom:0;right:0','borderBottom,borderRight']].map(([pos, _], i) => (
          <div key={i} style={{
            position: 'absolute',
            ...(pos.includes('top:0;left:0') ? { top: 0, left: 0, borderTop: `2px solid ${TIFFANY}`, borderLeft: `2px solid ${TIFFANY}` } : {}),
            ...(pos.includes('top:0;right:0') ? { top: 0, right: 0, borderTop: `2px solid ${TIFFANY}`, borderRight: `2px solid ${TIFFANY}` } : {}),
            ...(pos.includes('bottom:0;left:0') ? { bottom: 0, left: 0, borderBottom: `2px solid ${TIFFANY}`, borderLeft: `2px solid ${TIFFANY}` } : {}),
            ...(pos.includes('bottom:0;right:0') ? { bottom: 0, right: 0, borderBottom: `2px solid ${TIFFANY}`, borderRight: `2px solid ${TIFFANY}` } : {}),
            width: 10, height: 10,
            opacity: hov ? 1 : 0,
            transition: 'opacity 0.2s',
          }} />
        ))}

        {/* Label */}
        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase' }}>
          {metric.label}
        </div>

        {/* Big number — floats in Z */}
        <div style={{
          fontFamily: 'Inter,sans-serif', fontSize: 32, fontWeight: 300, color: '#fff',
          marginBottom: 6, transform: `translateZ(${hov ? 18 : 0}px)`,
          transition: 'transform 0.15s',
          lineHeight: 1,
        }}>
          <GlitchNumber display={metric.display} active={active} />
        </div>

        {/* Delta */}
        <div style={{
          fontFamily: 'Inter,sans-serif', fontSize: 10, letterSpacing: '0.12em',
          color: TIFFANY, fontWeight: 600, marginBottom: 16, transform: `translateZ(${hov ? 10 : 0}px)`,
          transition: 'transform 0.15s',
        }}>
          {metric.delta}
        </div>

        {/* Sparkline */}
        <div style={{ transform: `translateZ(${hov ? 6 : 0}px)`, transition: 'transform 0.15s' }}>
          <Sparkline data={metric.spark} color={TIFFANY} />
        </div>

        {/* Live dot */}
        <div style={{ position: 'absolute', top: 22, right: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: TIFFANY, boxShadow: `0 0 6px ${TIFFANY}`, animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}

export function TiltCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [feedIdx, setFeedIdx] = useState(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setFeedIdx(i => (i + 1) % FEED.length), 2200);
    return () => clearInterval(id);
  }, []);

  const visible = [
    FEED[(feedIdx + 0) % FEED.length],
    FEED[(feedIdx + 1) % FEED.length],
    FEED[(feedIdx + 2) % FEED.length],
  ];

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter,sans-serif', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes scanMove { 0%{background-position:0 -100%} 100%{background-position:0 200%} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #6FFFE9} 50%{opacity:0.4;box-shadow:0 0 14px #6FFFE9} }
        @keyframes feedSlide { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanH { 0%{top:-2px} 100%{top:100%} }
      `}</style>

      {/* Dot grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(111,255,233,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Scanning line */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${TIFFANY}60, transparent)`,
        animation: 'scanH 6s linear infinite', zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.25)', marginBottom: 10, fontWeight: 700 }}>
            RENTFLO // PORTFOLIO INTELLIGENCE
          </div>
          <h1 style={{ fontFamily: 'Inter,sans-serif', fontSize: 38, fontWeight: 200, color: '#fff', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Financial<br /><span style={{ color: TIFFANY, fontWeight: 600 }}>Command Center</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>LAST UPDATED</div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative', zIndex: 2, marginBottom: 40 }}>
        {METRICS.map((m, i) => (
          <Card key={i} metric={m} mouseX={mouse.x} mouseY={mouse.y} containerRef={containerRef} idx={i} />
        ))}
      </div>

      {/* Live transaction feed */}
      <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 14, fontWeight: 700 }}>
          LIVE TRANSACTION FEED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {visible.map((row, i) => (
            <div key={`${feedIdx}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 14px',
              animation: i === 0 ? 'feedSlide 0.4s ease-out' : 'none',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', minWidth: 32 }}>{row.time}</span>
              <span style={{ fontSize: 8, letterSpacing: '0.15em', fontWeight: 700, color: row.color, minWidth: 54 }}>{row.type}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.prop}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', fontWeight: 500 }}>{row.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System status bar */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 28, display: 'flex', alignItems: 'center', gap: 24, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>
        {['API CONNECTED', 'RAZORPAY ACTIVE', 'DB HEALTHY', 'ALL SYSTEMS NOMINAL'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: TIFFANY, boxShadow: `0 0 5px ${TIFFANY}` }} />
            <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TiltCards;
