import { useEffect, useRef, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';

// ── Spring physics ──────────────────────────────────────────────────
function useMouseSpring(k = 0.10, c = 0.78) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const go = () => {
      velRef.current.x += (targetRef.current.x - posRef.current.x) * k;
      velRef.current.y += (targetRef.current.y - posRef.current.y) * k;
      velRef.current.x *= c;
      velRef.current.y *= c;
      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;
      setPos({ x: posRef.current.x, y: posRef.current.y });
      raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    const W = window.innerWidth, H = window.innerHeight;
    targetRef.current = {
      x: (e.clientX / W - 0.5) * 2,   // -1 to +1
      y: (e.clientY / H - 0.5) * 2,
    };
  };

  const onMouseLeave = () => { targetRef.current = { x: 0, y: 0 }; };
  return { pos, onMouseMove, onMouseLeave };
}

// ── Depth layer ─────────────────────────────────────────────────────
function Layer({ z, children, style = {} }: { z: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', transformStyle: 'preserve-3d' as const, transform: `translateZ(${z}px)`, ...style }}>
      {children}
    </div>
  );
}

// ── Floating card ───────────────────────────────────────────────────
function FloatCard({ children, style = {}, glow = false }: { children: React.ReactNode; style?: React.CSSProperties; glow?: boolean }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,10,10,0.98), rgba(5,5,5,0.99))',
      border: `1px solid rgba(${TRGB},${glow ? 0.4 : 0.1})`,
      boxShadow: glow
        ? `0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${TRGB},0.12), inset 0 0 30px rgba(${TRGB},0.03)`
        : '0 20px 60px rgba(0,0,0,0.6)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {glow && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T}, transparent)` }} />}
      {children}
    </div>
  );
}

// ── Metric mini card ────────────────────────────────────────────────
function MiniCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      padding: '14px 16px', minWidth: 120,
    }}>
      <div style={{ fontSize: 7, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 200, color: accent ? T : '#fff', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

export function HeroLanding() {
  const { pos, onMouseMove, onMouseLeave } = useMouseSpring(0.09, 0.80);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const rotX = -pos.y * 10;
  const rotY = pos.x * 12;

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter,sans-serif', overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes driftA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,-4%) scale(1.08)} }
        @keyframes driftB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-4%,3%) scale(0.94)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #6FFFE9} 50%{opacity:0.35;box-shadow:0 0 16px #6FFFE9} }
        @keyframes scanH { 0%{top:0;opacity:0} 3%{opacity:1} 97%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes bgGrid { from{background-position:0 0} to{background-position:60px 60px} }
      `}</style>

      {/* Ambient blobs — blurred background depth */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: `radial-gradient(circle, rgba(4,60,76,0.85), transparent 65%)`, filter: 'blur(80px)', animation: 'driftA 28s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: `radial-gradient(circle, rgba(${TRGB},0.1), rgba(10,80,65,0.2) 35%, transparent 60%)`, filter: 'blur(100px)', animation: 'driftB 34s ease-in-out infinite' }} />
      </div>

      {/* Scanning line */}
      <div style={{ position: 'fixed', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${TRGB},0.3), transparent)`, animation: 'scanH 10s linear infinite', zIndex: 1, pointerEvents: 'none' }} />

      {/* 3D SCENE — everything inside gets the parallax tilt */}
      <div style={{
        position: 'relative', zIndex: 5,
        perspective: '1000px',
        perspectiveOrigin: '50% 50%',
        width: '100%', height: '100vh',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d' as const,
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: 'none',
        }}>

          {/* ── Layer -200px: Grid background ── */}
          <Layer z={-200} style={{ inset: '-100px', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(rgba(${TRGB},0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(${TRGB},0.04) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              opacity: 0.6,
            }} />
          </Layer>

          {/* ── Layer -100px: Side panels ── */}
          <Layer z={-100} style={{ top: '50%', left: '6%', transform: 'translateY(-50%)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s 0.3s' }}>
              <MiniCard label="ADVANCED" value="₹2.4L" accent />
              <MiniCard label="RATE" value="99.2%" accent />
              <MiniCard label="PROPS" value="12" />
            </div>
          </Layer>

          <Layer z={-100} style={{ top: '50%', right: '6%', transform: 'translateY(-50%)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s 0.4s' }}>
              <MiniCard label="TENANTS" value="12 / 12" accent />
              <MiniCard label="SETTLED" value="100%" accent />
              <MiniCard label="PENDING" value="₹0" />
            </div>
          </Layer>

          {/* ── Layer 0px: Main hero card ── */}
          <Layer z={0} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <FloatCard style={{ width: 440 }} glow>
              <div style={{ fontSize: 8, letterSpacing: '0.28em', color: `rgba(${TRGB},0.6)`, fontWeight: 700, marginBottom: 16 }}>RENTFLO OWNER DASHBOARD</div>

              <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 50, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 8 }}>
                May 2026<br />
                <span style={{ color: T, textShadow: `0 0 30px rgba(${TRGB},0.4)` }}>Portfolio</span>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, rgba(${TRGB},0.3), transparent)`, margin: '16px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['Total Advanced', '₹2,40,000'], ['Collected', '₹85,000'], ['Properties', '12 Active'], ['Collection', '99.2%']].map(([l, v]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 15, color: '#fff', fontWeight: 300 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>ALL SYSTEMS NOMINAL — RAZORPAY ACTIVE</span>
              </div>
            </FloatCard>
          </Layer>

          {/* ── Layer +80px: Floating title above main ── */}
          <Layer z={80} style={{ top: 'calc(50% - 260px)', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ textAlign: 'center', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s 0.1s', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.35em', color: `rgba(${TRGB},0.5)`, fontWeight: 700, marginBottom: 8 }}>RENTFLO</div>
              <div style={{ fontSize: 28, fontWeight: 200, color: '#fff', letterSpacing: '-0.03em' }}>
                Move your mouse
              </div>
            </div>
          </Layer>

          {/* ── Layer +140px: Very close — action button ── */}
          <Layer z={140} style={{ bottom: 'calc(50% - 260px)', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s 0.5s', display: 'flex', gap: 12 }}>
              <button style={{
                padding: '14px 32px', background: T, color: '#000', border: 'none',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
                boxShadow: `0 0 30px rgba(${TRGB},0.4), 0 8px 24px rgba(0,0,0,0.5)`,
              }}>
                GET STARTED →
              </button>
              <button style={{
                padding: '14px 24px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 500,
                letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>
                VIEW DEMO
              </button>
            </div>
          </Layer>

          {/* ── Layer +200px: Extremely close — status pill ── */}
          <Layer z={200} style={{ top: 'calc(50% - 310px)', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{
              background: `rgba(${TRGB},0.08)`, border: `1px solid rgba(${TRGB},0.25)`,
              padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(${TRGB},0.08)`,
              opacity: mounted ? 1 : 0, transition: 'opacity 0.5s',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 9, color: T, fontWeight: 700, letterSpacing: '0.18em' }}>LIVE PLATFORM</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>· BANGALORE · MUMBAI · PUNE</span>
            </div>
          </Layer>

        </div>
      </div>

      {/* Depth guide */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.15)', fontWeight: 600, zIndex: 10, whiteSpace: 'nowrap' }}>
        ↕ MOVE MOUSE — EACH LAYER FLOATS AT A DIFFERENT DEPTH
      </div>
    </div>
  );
}
export default HeroLanding;
