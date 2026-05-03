import { useEffect, useRef, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';

// ─── Neural Network Canvas ──────────────────────────────────────────
interface Node { x: number; y: number; vx: number; vy: number; pulse: number; }
interface Packet { from: number; to: number; progress: number; speed: number; }

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<Node[]>([]);
  const packets = useRef<Packet[]>([]);
  const raf = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;

    const N = 40;
    nodes.current = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Pre-build some packets
    const addPacket = () => {
      const from = Math.floor(Math.random() * N);
      const to = Math.floor(Math.random() * N);
      if (from !== to) packets.current.push({ from, to, progress: 0, speed: 0.004 + Math.random() * 0.008 });
      if (packets.current.length < 12) setTimeout(addPacket, 300 + Math.random() * 600);
    };
    setTimeout(addPacket, 500);

    const THRESH = 160;

    const render = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) { raf.current = requestAnimationFrame(render); return; }
      ctx.clearRect(0, 0, W, H);

      const ns = nodes.current;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      ns.forEach(n => {
        // Mouse repel
        const dx = n.x - mx, dy = n.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 150) { n.vx += (dx / d) * 0.04; n.vy += (dy / d) * 0.04; }
        n.vx *= 0.98; n.vy *= 0.98;
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Edges
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const d = Math.hypot(ns[j].x - ns[i].x, ns[j].y - ns[i].y);
          if (d < THRESH) {
            ctx.beginPath(); ctx.moveTo(ns[i].x, ns[i].y); ctx.lineTo(ns[j].x, ns[j].y);
            ctx.strokeStyle = `rgba(${TRGB},${(1 - d / THRESH) * 0.08})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }

      // Data packets
      packets.current.forEach((pk, idx) => {
        pk.progress += pk.speed;
        if (pk.progress > 1) { pk.progress = 0; pk.from = pk.to; pk.to = Math.floor(Math.random() * ns.length); }
        const a = ns[pk.from], b = ns[pk.to];
        const px = lerp(a.x, b.x, pk.progress), py = lerp(a.y, b.y, pk.progress);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grd.addColorStop(0, `rgba(${TRGB},0.9)`); grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,0.9)`; ctx.fill();
      });

      // Nodes
      ns.forEach(n => {
        const pulse = (Math.sin(n.pulse) + 1) * 0.5;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 8 + pulse * 4);
        grd.addColorStop(0, `rgba(${TRGB},${0.4 + pulse * 0.3})`); grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(n.x, n.y, 8 + pulse * 4, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI * 2); ctx.fillStyle = `rgba(${TRGB},${0.6 + pulse * 0.4})`; ctx.fill();
      });

      raf.current = requestAnimationFrame(render);
    };
    render();

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('mousemove', onMove); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function useCounter(target: number, active: boolean, dur = 1800) {
  const [v, setV] = useState(0);
  const s = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return; s.current = null;
    const go = (ts: number) => {
      if (!s.current) s.current = ts;
      const p = Math.min((ts - s.current) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, [active, target, dur]);
  return v;
}

// ─── Radial Arc Chart ───────────────────────────────────────────────
function ArcChart({ pct, label, size = 100 }: { pct: number; label: string; size?: number }) {
  const r = size * 0.38, c = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <style>{`@keyframes arcFill { from{stroke-dashoffset:${circ}} to{stroke-dashoffset:${circ * (1 - pct / 100)}} }`}</style>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={T} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ strokeDashoffset: circ * (1 - pct / 100), animation: 'arcFill 1.4s 0.3s ease-out both', filter: `drop-shadow(0 0 4px ${T})` }} />
      <text x={c} y={c + 4} textAnchor="middle" fill="#fff" fontSize={size * 0.16} fontFamily="Inter,sans-serif" fontWeight="300">{pct}%</text>
      <text x={c} y={size * 0.88} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={size * 0.09} fontFamily="Inter,sans-serif" letterSpacing="1" fontWeight="600">{label}</text>
    </svg>
  );
}

// ─── Glass Panel ────────────────────────────────────────────────────
function Glass({ children, style = {}, b = 20, a = 0.055 }: { children: React.ReactNode; style?: React.CSSProperties; b?: number; a?: number; }) {
  return (
    <div style={{
      background: `rgba(255,255,255,${a})`,
      backdropFilter: `blur(${b}px) saturate(200%)`,
      WebkitBackdropFilter: `blur(${b}px) saturate(200%)`,
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 40px rgba(0,0,0,0.35)',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

const ACTIVITIES = [
  { name: 'Ravi K.', prop: 'Koramangala 4B', amt: '₹32,000', s: 'SETTLED', t: '09:41' },
  { name: 'Meera S.', prop: 'HSR Sector 2', amt: '₹18,500', s: 'PARTIAL', t: '09:22' },
  { name: 'Arjun T.', prop: 'Whitefield B3', amt: '₹27,000', s: 'SETTLED', t: '08:55' },
  { name: 'Priya N.', prop: 'JP Nagar 7', amt: '₹29,000', s: 'SETTLED', t: '08:31' },
  { name: 'Suresh M.', prop: 'Indiranagar 12A', amt: '₹44,000', s: 'PENDING', t: '08:10' },
];
const SC: Record<string, string> = { SETTLED: T, PARTIAL: '#facc15', PENDING: 'rgba(255,255,255,0.3)' };

export function GlassDashboard() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 100); return () => clearTimeout(t); }, []);
  const adv = useCounter(240000, on);
  const col = useCounter(85000, on, 1500);
  const props = useCounter(12, on, 1200);
  const rate = useCounter(99, on, 1900);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter,sans-serif', background: '#020509', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes aurora1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(6%,-8%) scale(1.12)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes aurora2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-8%,6%) scale(0.92)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes aurora3 { 0%{transform:translate(0,0) scale(1.1)} 50%{transform:translate(10%,4%) scale(0.88)} 100%{transform:translate(0,0) scale(1.1)} }
        @keyframes sweep { 0%{left:-50%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{left:160%;opacity:0} }
        @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes iridescent { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
      `}</style>

      {/* Aurora background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-25%', left: '-20%', width: '70vw', height: '70vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,68,84,0.95), rgba(4,68,84,0.4) 45%, transparent 70%)', filter: 'blur(70px)', animation: 'aurora1 30s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-25%', width: '80vw', height: '80vw', borderRadius: '50%', background: `radial-gradient(circle, rgba(${TRGB},0.15), rgba(10,100,85,0.3) 40%, transparent 65%)`, filter: 'blur(90px)', animation: 'aurora2 36s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '35%', left: '25%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,10,60,0.8), transparent 60%)', filter: 'blur(80px)', animation: 'aurora3 24s ease-in-out infinite' }} />
      </div>

      {/* Neural canvas */}
      <NeuralCanvas />

      {/* Iridescent border accent at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T}, rgba(200,100,255,0.6), rgba(100,200,255,0.6), ${T}, transparent)`, zIndex: 99, animation: 'iridescent 4s linear infinite' }} />

      {/* Layout */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: '100vh' }}>

        {/* Sidebar */}
        <Glass b={40} a={0.035} style={{ borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '30px 0' }}>
          <div style={{ padding: '0 22px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.25)', marginBottom: 5, fontWeight: 700 }}>RENTFLO</div>
            <div style={{ fontSize: 20, fontWeight: 200, color: '#fff', letterSpacing: '-0.02em' }}>Owner<span style={{ color: T, fontWeight: 700 }}>Suite</span></div>
          </div>
          <div style={{ padding: '18px 0', flex: 1 }}>
            {[['Dashboard', true], ['Ledger', false], ['Properties', false], ['Tenants', false], ['Agreements', false], ['Analytics', false]].map(([l, a]) => (
              <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 22px', background: a ? `rgba(${TRGB},0.06)` : 'transparent', borderLeft: a ? `2px solid ${T}` : '2px solid transparent', cursor: 'pointer', marginBottom: 2 }}>
                {a && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T, animation: 'pulse 2s infinite', boxShadow: `0 0 6px ${T}` }} />}
                <span style={{ fontSize: 11, color: a ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: a ? 500 : 400 }}>{String(l)}</span>
              </div>
            ))}
          </div>
          {/* Arc charts */}
          <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <ArcChart pct={rate} label="COLLECT" size={78} />
            <ArcChart pct={91} label="SETTLED" size={78} />
          </div>
          <div style={{ padding: '14px 22px 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, rgba(${TRGB},0.3), rgba(255,255,255,0.05))`, border: `1px solid rgba(${TRGB},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: T, fontWeight: 700 }}>RK</div>
            <div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>Rahul K.</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>OWNER PRO</div>
            </div>
          </div>
        </Glass>

        {/* Main */}
        <div style={{ padding: '28px 28px 36px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', marginBottom: 5, fontWeight: 700 }}>PORTFOLIO OVERVIEW — MAY 2026</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 200, color: '#fff', letterSpacing: '-0.02em' }}>Morning, <span style={{ fontWeight: 700, color: T, textShadow: `0 0 20px rgba(${TRGB},0.5)` }}>Rahul</span></h1>
            </div>
            <Glass b={14} a={0.04} style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, animation: 'pulse 1.8s infinite', boxShadow: `0 0 8px ${T}` }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>NEURAL NET ACTIVE</span>
            </Glass>
          </div>

          {/* HERO stat */}
          <Glass b={28} a={0.06} style={{ padding: '32px 36px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(${TRGB},0.03), transparent 60%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, background: `linear-gradient(to bottom, transparent, ${T}, transparent)`, opacity: 0.5 }} />
            {/* Sweep */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)', animation: 'sweep 5s 1s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 10, fontWeight: 700 }}>TOTAL RENT ADVANCED · FY 2025–26</div>
                <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 58, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
                  ₹{adv.toLocaleString('en-IN')}
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T, fontWeight: 700, letterSpacing: '0.08em' }}>▲ 18.4% YoY</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>vs ₹2,02,720 last year</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <ArcChart pct={84} label="DEPLOYED" size={96} />
              </div>
            </div>
          </Glass>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { l: 'COLLECTED · MAY', v: `₹${col.toLocaleString('en-IN')}`, sub: '12 / 12 tenants' },
              { l: 'ACTIVE PROPERTIES', v: String(props), sub: 'Zero vacancy' },
              { l: 'ON-TIME RATE', v: `${rate}%`, sub: 'Month to date' },
            ].map((s, i) => (
              <Glass key={i} b={18} a={0.045} style={{ padding: '20px 22px', animation: `fadein 0.4s ${0.1 + i * 0.1}s both` }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 10 }}>{s.l}</div>
                <div style={{ fontSize: 30, fontWeight: 200, color: T, letterSpacing: '-0.02em', marginBottom: 5 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
              </Glass>
            ))}
          </div>

          {/* Activity */}
          <Glass b={16} a={0.04} style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 16 }}>RECENT ACTIVITY</div>
            {ACTIVITIES.map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 60px', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < ACTIVITIES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animation: `fadein 0.35s ${0.25 + i * 0.05}s both` }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{a.t}</span>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{a.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{a.prop}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', textAlign: 'right' }}>{a.amt}</span>
                <span style={{ fontSize: 8, letterSpacing: '0.14em', color: SC[a.s], textAlign: 'right', fontWeight: 700 }}>{a.s}</span>
              </div>
            ))}
          </Glass>
        </div>
      </div>
    </div>
  );
}
export default GlassDashboard;
