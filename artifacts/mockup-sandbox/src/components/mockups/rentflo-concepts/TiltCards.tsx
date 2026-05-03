import { useEffect, useRef, useState, useCallback } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';
const N = 5;
const RADIUS = 360;

const CARDS = [
  { label: 'TOTAL ADVANCED', value: '₹2,40,000', sub: '+18.4% YoY', idx: 0 },
  { label: 'COLLECTED · MAY', value: '₹85,000', sub: '+12.1% MoM', idx: 1 },
  { label: 'PROPERTIES', value: '12', sub: 'Zero Vacancy', idx: 2 },
  { label: 'COLLECTION RATE', value: '99.2%', sub: 'All On Time', idx: 3 },
  { label: 'SETTLEMENTS', value: '8 / 8', sub: '100% Complete', idx: 4 },
];

function useDrag(onDrag: (dx: number) => void) {
  const dragging = useRef(false);
  const last = useRef(0);
  const onDown = useCallback((e: React.MouseEvent) => { dragging.current = true; last.current = e.clientX; }, []);
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    onDrag(e.clientX - last.current);
    last.current = e.clientX;
  }, [onDrag]);
  const onUp = useCallback(() => { dragging.current = false; }, []);
  return { onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp };
}

export function TiltCards() {
  const rot = useRef(0);
  const vel = useRef(0);
  const paused = useRef(false);
  const raf = useRef(0);
  const [display, setDisplay] = useState(0);
  const [focused, setFocused] = useState<number | null>(null);

  useEffect(() => {
    const go = () => {
      if (!paused.current) {
        vel.current += 0.08;
        vel.current *= 0.98;
        rot.current += vel.current;
      } else {
        vel.current *= 0.92;
      }
      setDisplay(rot.current);
      raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const drag = useDrag((dx) => {
    vel.current = dx * 0.6;
    rot.current += dx * 0.5;
  });

  return (
    <div
      style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'grab', userSelect: 'none', fontFamily: 'Inter,sans-serif', position: 'relative' }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; setFocused(null); }}
      {...drag}
    >
      <style>{`
        @keyframes floatUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #6FFFE9} 50%{opacity:0.4;box-shadow:0 0 18px #6FFFE9} }
        @keyframes floorShimmer { 0%{opacity:0.4} 50%{opacity:0.7} 100%{opacity:0.4} }
      `}</style>

      {/* Floor grid */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', pointerEvents: 'none', zIndex: 0,
        background: `linear-gradient(rgba(${TRGB},0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(${TRGB},0.06) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        transform: 'perspective(400px) rotateX(70deg)',
        transformOrigin: 'bottom center',
        maskImage: 'linear-gradient(to top, black 0%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 80%)',
        animation: 'floorShimmer 4s ease-in-out infinite',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 60, animation: 'floatUp 0.6s ease-out both' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 10 }}>RENTFLO — ORBITAL METRICS</div>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 200, color: '#fff', letterSpacing: '-0.04em' }}>
          Drag to <span style={{ color: T, fontWeight: 700 }}>explore</span>
        </h1>
      </div>

      {/* 3D Carousel */}
      <div style={{ position: 'relative', zIndex: 5, width: 320, height: 220 }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' as const, perspective: '1400px' }}>
          {CARDS.map((card, i) => {
            const angle = (360 / N) * i + display;
            const rad = (angle * Math.PI) / 180;
            const facing = Math.cos(rad);
            const isFront = facing > 0.5;
            const isFocusTarget = focused === i;
            const extraZ = isFocusTarget ? 80 : 0;

            return (
              <div
                key={i}
                onMouseEnter={() => setFocused(i)}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: 260, height: 180,
                  marginLeft: -130, marginTop: -90,
                  borderRadius: 18,
                  transform: `perspective(1400px) rotateY(${angle}deg) translateZ(${RADIUS + extraZ}px)`,
                  transition: 'box-shadow 0.3s',
                  cursor: isFront ? 'pointer' : 'default',
                  background: `linear-gradient(135deg, #0d0d0d 0%, #070707 100%)`,
                  border: `1px solid rgba(${TRGB},${0.1 + facing * 0.35})`,
                  boxShadow: isFocusTarget
                    ? `0 0 60px rgba(${TRGB},0.4), 0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(${TRGB},0.05)`
                    : `0 ${20 + facing * 20}px ${40 + facing * 40}px rgba(0,0,0,0.9)`,
                  opacity: Math.max(0.25, (facing + 1) / 2),
                  padding: '24px 22px 20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  overflow: 'hidden',
                  backfaceVisibility: 'hidden' as const,
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, rgba(${TRGB},${0.3 + facing * 0.5}), transparent)`,
                  opacity: isFocusTarget ? 1 : facing,
                  borderRadius: '18px 18px 0 0',
                }} />

                {/* Inner depth frame */}
                <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(255,255,255,0.025)', borderRadius: 12, pointerEvents: 'none' }} />

                <div>
                  <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 12 }}>{card.label}</div>
                  <div style={{
                    fontSize: 36, fontWeight: 200, color: isFocusTarget ? T : '#fff',
                    letterSpacing: '-0.03em', transition: 'color 0.3s',
                    textShadow: isFocusTarget ? `0 0 30px rgba(${TRGB},0.6)` : 'none',
                  }}>{card.value}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: T, letterSpacing: '0.12em', fontWeight: 600 }}>{card.sub}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: T, animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>LIVE</span>
                  </div>
                </div>

                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  fontFamily: 'monospace', fontSize: 9, color: `rgba(${TRGB},0.3)`,
                  letterSpacing: '0.1em',
                }}>0{i + 1} / 0{N}</div>

                <div style={{
                  position: 'absolute', bottom: -24, left: '10%', right: '10%', height: 24,
                  background: `rgba(0,0,0,${0.6 * facing})`,
                  filter: 'blur(12px)',
                  transform: 'translateZ(-40px)',
                  pointerEvents: 'none',
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot nav */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 10, marginTop: 60, animation: 'floatUp 0.6s 0.3s ease-out both' }}>
        {CARDS.map((_, i) => {
          const angle = ((360 / N) * i + display) % 360;
          const norm = ((angle % 360) + 360) % 360;
          const isFront = norm < 50 || norm > 310;
          return (
            <div key={i} onClick={() => { vel.current = 0; rot.current = -(360 / N) * i; }} style={{
              width: isFront ? 20 : 6, height: 6, borderRadius: 100,
              background: isFront ? T : 'rgba(255,255,255,0.2)',
              cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: isFront ? `0 0 8px ${T}` : 'none',
            }} />
          );
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)', fontWeight: 600, zIndex: 10 }}>
        ← DRAG TO ROTATE →
      </div>
    </div>
  );
}
export default TiltCards;
