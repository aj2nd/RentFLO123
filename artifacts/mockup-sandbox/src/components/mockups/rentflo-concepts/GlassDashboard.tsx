import { useEffect, useRef, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';
const FACE_SIZE = 260;
const HALF = FACE_SIZE / 2;

// Face data
const FACES = [
  {
    id: 'front', label: 'PORTFOLIO',
    icon: '◈',
    stat: '₹2,40,000',
    sub: 'Total Advanced',
    color: T,
    rows: [['Active Properties', '12'], ['Tenants', '12 / 12'], ['Vacancy', 'Zero']],
  },
  {
    id: 'right', label: 'COLLECTIONS',
    icon: '◉',
    stat: '₹85,000',
    sub: 'Collected · May',
    color: '#fff',
    rows: [['Collection Rate', '99.2%'], ['On-Time', '100%'], ['Pending', '₹0']],
  },
  {
    id: 'back', label: 'PROPERTIES',
    icon: '◧',
    stat: '12',
    sub: 'Active Units',
    color: T,
    rows: [['Koramangala', '4 units'], ['Indiranagar', '3 units'], ['HSR Layout', '5 units']],
  },
  {
    id: 'left', label: 'TENANTS',
    icon: '◌',
    stat: '12 / 12',
    sub: 'Settled This Month',
    color: '#fff',
    rows: [['Ravi K.', '₹32,000 ✓'], ['Meera S.', '₹18,500 ✓'], ['Arjun T.', '₹27,000 ✓']],
  },
  {
    id: 'top', label: 'ANALYTICS',
    icon: '◈',
    stat: '+18.4%',
    sub: 'YoY Growth',
    color: T,
    rows: [['Last FY', '₹2,02,720'], ['This FY', '₹2,40,000'], ['Delta', '+₹37,280']],
  },
  {
    id: 'bottom', label: 'QUICK PAY',
    icon: '◎',
    stat: 'UPI',
    sub: 'Instant Settlement',
    color: T,
    rows: [['Razorpay', 'ACTIVE'], ['NEFT', 'ACTIVE'], ['Avg. Time', '< 2 min']],
  },
];

// Spring simulation
function useSpring(target: number, config = { k: 0.08, c: 0.78 }) {
  const val = useRef(target);
  const vel = useRef(0);
  const raf = useRef(0);
  const [display, setDisplay] = useState(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const go = () => {
      vel.current += (targetRef.current - val.current) * config.k;
      vel.current *= config.c;
      val.current += vel.current;
      setDisplay(val.current);
      raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return display;
}

const FACE_TRANSFORMS: Record<string, string> = {
  front:  `translateZ(${HALF}px)`,
  back:   `rotateY(180deg) translateZ(${HALF}px)`,
  right:  `rotateY(90deg) translateZ(${HALF}px)`,
  left:   `rotateY(-90deg) translateZ(${HALF}px)`,
  top:    `rotateX(90deg) translateZ(${HALF}px)`,
  bottom: `rotateX(-90deg) translateZ(${HALF}px)`,
};

const FACE_TARGETS: Record<string, { rx: number; ry: number }> = {
  front:  { rx: 0,   ry: 0   },
  right:  { rx: 0,   ry: -90 },
  back:   { rx: 0,   ry: -180 },
  left:   { rx: 0,   ry: 90  },
  top:    { rx: -90, ry: 0   },
  bottom: { rx: 90,  ry: 0   },
};

export function GlassDashboard() {
  const [activeFace, setActiveFace] = useState('front');
  const [targetRx, setTargetRx] = useState(-18);
  const [targetRy, setTargetRy] = useState(24);
  const autoRef = useRef(true);
  const autoAngle = useRef(24);
  const raf = useRef(0);
  const [autoRy, setAutoRy] = useState(24);

  // Auto-rotate slowly when no face selected yet
  useEffect(() => {
    const go = () => {
      if (autoRef.current) {
        autoAngle.current += 0.12;
        setAutoRy(autoAngle.current);
      }
      raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const ry = useSpring(autoRef.current ? autoRy : targetRy);
  const rx = useSpring(autoRef.current ? -18 : targetRx);

  const handleFace = (faceId: string) => {
    autoRef.current = false;
    setActiveFace(faceId);
    setTargetRx(FACE_TARGETS[faceId].rx - 8);
    setTargetRy(FACE_TARGETS[faceId].ry);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes edgePulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
      `}</style>

      {/* Ambient glow behind cube */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${TRGB},0.08), transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Title */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 52, animation: 'fadeIn 0.6s ease-out both' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 10 }}>RENTFLO — DATA CUBE</div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 200, color: '#fff', letterSpacing: '-0.04em' }}>
          Click a face to <span style={{ color: T, fontWeight: 700 }}>explore</span>
        </h1>
      </div>

      {/* 3D Cube Scene */}
      <div style={{ position: 'relative', zIndex: 5, perspective: '900px', perspectiveOrigin: '50% 50%' }}>
        <div style={{
          width: FACE_SIZE, height: FACE_SIZE,
          transformStyle: 'preserve-3d' as const,
          transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}>
          {/* Cube edges — visible frame lines */}
          {/* (achieved via face borders) */}

          {FACES.map((face) => (
            <div
              key={face.id}
              onClick={() => handleFace(face.id)}
              style={{
                position: 'absolute',
                width: FACE_SIZE, height: FACE_SIZE,
                transform: FACE_TRANSFORMS[face.id],
                backfaceVisibility: 'hidden' as const,
                background: `linear-gradient(135deg, rgba(8,8,8,0.96) 0%, rgba(4,4,4,0.98) 100%)`,
                border: `1px solid rgba(${TRGB},${activeFace === face.id ? 0.6 : 0.18})`,
                boxShadow: activeFace === face.id
                  ? `inset 0 0 40px rgba(${TRGB},0.08), 0 0 0 1px rgba(${TRGB},0.3)`
                  : `inset 0 0 20px rgba(0,0,0,0.5)`,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '20px',
                overflow: 'hidden',
                transition: 'border-color 0.4s, box-shadow 0.4s',
              }}
            >
              {/* Face top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${face.color}, transparent)`,
                opacity: activeFace === face.id ? 1 : 0.3,
                transition: 'opacity 0.4s',
              }} />

              {/* Inner depth frame */}
              <div style={{ position: 'absolute', inset: 10, border: `1px solid rgba(255,255,255,0.04)`, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 18, border: `1px solid rgba(255,255,255,0.02)`, pointerEvents: 'none' }} />

              {/* Face label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 7, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{face.label}</div>
                <div style={{ fontSize: 16, color: `rgba(${TRGB},0.4)` }}>{face.icon}</div>
              </div>

              {/* Big stat */}
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 40, fontWeight: 200, color: face.color, letterSpacing: '-0.03em', lineHeight: 1, textShadow: `0 0 20px rgba(${TRGB},0.3)` }}>{face.stat}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 5 }}>{face.sub}</div>
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {face.rows.map(([k, v], ri) => (
                  <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 5 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{k}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Face selector */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 8, marginTop: 44, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeIn 0.6s 0.2s ease-out both' }}>
        {FACES.map(f => (
          <button key={f.id} onClick={() => handleFace(f.id)} style={{
            padding: '6px 14px', fontSize: 8, letterSpacing: '0.18em', fontWeight: 700,
            background: activeFace === f.id ? T : 'transparent',
            color: activeFace === f.id ? '#000' : 'rgba(255,255,255,0.3)',
            border: `1px solid ${activeFace === f.id ? T : 'rgba(255,255,255,0.1)'}`,
            cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            transition: 'all 0.25s',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 24, fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>
        AUTO-ROTATING — CLICK ANY FACE BUTTON TO FOCUS
      </div>
    </div>
  );
}
export default GlassDashboard;
