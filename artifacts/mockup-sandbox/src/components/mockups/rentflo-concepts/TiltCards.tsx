import { useEffect, useRef, useState, useCallback } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';

// ─── Particle Constellation Canvas ─────────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; }

function useConstellation(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let W = 0, H = 0;

    const init = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      particles.current = Array.from({ length: 130 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        size: 0.8 + Math.random() * 1.8, alpha: 0.15 + Math.random() * 0.55,
      }));
    };
    init();

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const ps = particles.current;
      const mx = mouse.current.x, my = mouse.current.y;

      ps.forEach(p => {
        const dx = mx - p.x, dy = my - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 220) { const f = (1 - d / 220) * 0.018; p.vx += dx * f * 0.12; p.vy += dy * f * 0.12; }
        p.vx *= 0.975; p.vy *= 0.975;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 2.5) { p.vx *= 2.5 / spd; p.vy *= 2.5 / spd; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }
      });

      // Draw connections
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const d = Math.hypot(ps[j].x - ps[i].x, ps[j].y - ps[i].y);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(${TRGB},${(1 - d / 120) * 0.12})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      // Draw particles with glow
      ps.forEach(p => {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        grd.addColorStop(0, `rgba(${TRGB},${p.alpha * 0.9})`);
        grd.addColorStop(0.3, `rgba(${TRGB},${p.alpha * 0.3})`);
        grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TRGB},${p.alpha})`; ctx.fill();
      });
      raf.current = requestAnimationFrame(render);
    };
    render();

    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onResize = () => { init(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', onResize); };
  }, []);
}

// ─── Holographic Card ───────────────────────────────────────────────
function useHoloCard(ref: React.RefObject<HTMLDivElement | null>) {
  const [style, setStyle] = useState({ rx: 0, ry: 0, holoAngle: 135, hovered: false, mx: 0, my: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onEnter = () => setStyle(s => ({ ...s, hovered: true }));
    const onLeave = () => setStyle({ rx: 0, ry: 0, holoAngle: 135, hovered: false, mx: 0, my: 0 });
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = -((y - r.height / 2) / (r.height / 2)) * 22;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 22;
      const angle = Math.atan2(y - r.height / 2, x - r.width / 2) * (180 / Math.PI) + 180;
      setStyle({ rx, ry, holoAngle: angle, hovered: true, mx: x, my: y });
    };
    el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); el.addEventListener('mousemove', onMove as EventListener);
    return () => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); el.removeEventListener('mousemove', onMove as EventListener); };
  }, []);
  return style;
}

// ─── Glitch Counter ─────────────────────────────────────────────────
function GlitchCounter({ target, delay = 0 }: { target: string; delay?: number }) {
  const chars = '0123456789₹,./';
  const [shown, setShown] = useState('·'.repeat(target.length));
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t0 = setTimeout(() => {
      let frame = 0; const total = 22;
      const id = setInterval(() => {
        frame++; if (frame >= total) { setShown(target); setDone(true); clearInterval(id); return; }
        const p = frame / total;
        setShown(target.split('').map((c, i) => i / target.length < p ? c : chars[Math.floor(Math.random() * chars.length)]).join(''));
      }, 45);
    }, delay);
    return () => clearTimeout(t0);
  }, [target, delay]);
  return <span style={{ textShadow: done ? 'none' : `0 0 8px rgba(${TRGB},0.8)` }}>{shown}</span>;
}

// ─── Sparkline ──────────────────────────────────────────────────────
function Spark({ data, color = T }: { data: number[]; color?: string }) {
  const w = 90, h = 32, mn = Math.min(...data), mx2 = Math.max(...data), r = mx2 - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / r) * h}`).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  const id = `sg${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - mn) / r) * h} r="2.5" fill={color} />
    </svg>
  );
}

const METRICS = [
  { label: 'TOTAL ADVANCED', value: '₹2,40,000', delta: '+18.4% YoY', spark: [22, 35, 28, 48, 40, 62, 55, 71, 65, 82, 78, 100], accent: T },
  { label: 'COLLECTED · MAY', value: '₹85,000', delta: '+12.1% MoM', spark: [50, 40, 60, 54, 70, 62, 75, 68, 83, 78, 90, 95], accent: T },
  { label: 'PROPERTIES LIVE', value: '12', delta: 'ZERO VACANT', spark: [8, 8, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12], accent: '#fff' },
  { label: 'COLLECTION RATE', value: '99.2%', delta: 'ALL ON TIME', spark: [82, 85, 84, 88, 87, 90, 91, 94, 93, 96, 98, 99], accent: T },
];

const FEED = [
  { t: '09:41', type: 'SETTLED', info: 'Ravi K. · Koramangala 4B', amt: '₹32,000', c: T },
  { t: '09:38', type: 'ADVANCED', info: 'RentFLO · Indiranagar 12A', amt: '₹48,000', c: '#fff' },
  { t: '09:22', type: 'PARTIAL', info: 'Meera S. · HSR Sector 2', amt: '₹18,500', c: '#facc15' },
  { t: '08:55', type: 'SETTLED', info: 'Arjun T. · Whitefield B3', amt: '₹27,000', c: T },
  { t: '08:31', type: 'ADVANCED', info: 'RentFLO · JP Nagar 7', amt: '₹55,000', c: '#fff' },
  { t: '08:10', type: 'SETTLED', info: 'Priya N. · Marathahalli 5A', amt: '₹29,000', c: T },
];

function HoloCard({ metric, idx }: { metric: typeof METRICS[0]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { rx, ry, holoAngle, hovered, mx, my } = useHoloCard(ref as React.RefObject<HTMLDivElement | null>);

  const hue1 = (holoAngle * 1.2) % 360;
  const hue2 = (holoAngle * 0.8 + 120) % 360;
  const hue3 = (holoAngle * 0.5 + 240) % 360;

  return (
    <div ref={ref} style={{
      transformStyle: 'preserve-3d',
      transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${hovered ? 1.06 : 1})`,
      transition: hovered ? 'transform 0.08s ease-out' : 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
      position: 'relative', cursor: 'crosshair',
      animationDelay: `${idx * 80}ms`,
    }}>
      {/* Bloom shadow */}
      <div style={{
        position: 'absolute', inset: -8, zIndex: -1,
        background: `radial-gradient(ellipse at ${hovered ? `${mx}px ${my}px` : '50% 50%'}, rgba(${TRGB},${hovered ? 0.35 : 0.08}), transparent 70%)`,
        filter: 'blur(16px)', transition: 'opacity 0.3s',
      }} />

      {/* Card */}
      <div style={{
        background: `linear-gradient(160deg, #0a0a0a 0%, #050505 100%)`,
        border: `1px solid rgba(${TRGB},${hovered ? 0.55 : 0.1})`,
        padding: '24px 22px 20px', position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.2s',
        transform: 'translateZ(0)',
      }}>
        {/* Holographic foil layer */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
            background: `
              linear-gradient(${holoAngle}deg,
                hsla(${hue1},100%,70%,0.12) 0%,
                hsla(${hue2},100%,60%,0.08) 33%,
                hsla(${hue3},100%,75%,0.12) 66%,
                hsla(${hue1},100%,70%,0.08) 100%
              )`,
            transition: 'opacity 0.1s',
          }} />
        )}
        {/* Cursor highlight */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(circle 100px at ${mx}px ${my}px, rgba(255,255,255,0.04), transparent 80%)`,
          }} />
        )}
        {/* Corner brackets */}
        {hovered && [
          { top: 0, left: 0, borderTop: `1.5px solid ${T}`, borderLeft: `1.5px solid ${T}` },
          { top: 0, right: 0, borderTop: `1.5px solid ${T}`, borderRight: `1.5px solid ${T}` },
          { bottom: 0, left: 0, borderBottom: `1.5px solid ${T}`, borderLeft: `1.5px solid ${T}` },
          { bottom: 0, right: 0, borderBottom: `1.5px solid ${T}`, borderRight: `1.5px solid ${T}` },
        ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 12, height: 12, ...s }} />)}

        {/* LIVE dot */}
        <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, animation: 'dot 2s ease-in-out infinite', boxShadow: `0 0 6px ${T}` }} />
          <span style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em' }}>LIVE</span>
        </div>

        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)', fontWeight: 700, marginBottom: 14 }}>{metric.label}</div>

        {/* Big value */}
        <div style={{
          fontFamily: 'Inter,sans-serif', fontSize: 34, fontWeight: 200, color: hovered ? metric.accent : '#fff',
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
          transform: `translateZ(${hovered ? 20 : 0}px)`,
          transition: 'color 0.2s, transform 0.12s',
          textShadow: hovered ? `0 0 30px rgba(${TRGB},0.4)` : 'none',
        }}>
          <GlitchCounter target={metric.value} delay={idx * 100 + 300} />
        </div>

        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: metric.accent === T ? T : 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 16 }}>
          {metric.delta}
        </div>

        <Spark data={metric.spark} color={metric.accent} />
      </div>
    </div>
  );
}

export function TiltCards() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useConstellation(canvasRef as React.RefObject<HTMLCanvasElement | null>);
  const [feedOff, setFeedOff] = useState(0);
  useEffect(() => { const id = setInterval(() => setFeedOff(o => (o + 1) % FEED.length), 2400); return () => clearInterval(id); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes dot { 0%,100%{opacity:1;box-shadow:0 0 6px #6FFFE9} 50%{opacity:0.3;box-shadow:0 0 14px #6FFFE9} }
        @keyframes rowSlide { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanH { 0%{top:-1px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
      `}</style>

      {/* Canvas constellation */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

      {/* Horizontal scan line */}
      <div style={{ position: 'fixed', left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(${TRGB},0.4),transparent)`, animation: 'scanH 8s linear infinite', zIndex: 1, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '44px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 10 }}>
              RENTFLO // INTELLIGENCE TERMINAL // MAY 2026
            </div>
            <h1 style={{ margin: 0, fontSize: 40, fontWeight: 200, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Portfolio<br />
              <span style={{ fontWeight: 700, color: T, textShadow: `0 0 40px rgba(${TRGB},0.5)` }}>Command Center</span>
            </h1>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 24 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>SYSTEM TIME</div>
            <div style={{ fontFamily: 'monospace', fontSize: 20, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 8, letterSpacing: '0.15em', color: T, marginTop: 4, fontWeight: 600 }}>● ALL SYSTEMS NOMINAL</div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
          {METRICS.map((m, i) => <HoloCard key={i} metric={m} idx={i} />)}
        </div>

        {/* Live feed */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 22 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 14 }}>
            ● LIVE TRANSACTION FEED
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[0, 1, 2].map(i => {
              const row = FEED[(feedOff + i) % FEED.length];
              return (
                <div key={`${feedOff}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  padding: '10px 14px',
                  animation: i === 0 ? 'rowSlide 0.35s ease-out' : 'none',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', minWidth: 34 }}>{row.t}</span>
                  <span style={{ fontSize: 7, letterSpacing: '0.18em', color: row.c, fontWeight: 700, minWidth: 50 }}>{row.type}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.info}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', fontWeight: 500 }}>{row.amt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default TiltCards;
