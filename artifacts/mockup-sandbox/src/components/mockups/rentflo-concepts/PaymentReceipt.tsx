import { useEffect, useRef, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';
const COUNT = 500;

interface PParticle { x: number; y: number; tx: number; ty: number; vx: number; vy: number; size: number; alpha: number; hue: number; phase: 'scatter' | 'converge' | 'ring' | 'done'; }

type Stage = 'idle' | 'scan' | 'explode' | 'converge' | 'ring' | 'check' | 'receipt' | 'stamp';

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeOutBack(t: number) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

// ─── Particle Canvas ────────────────────────────────────────────────
function ParticleCanvas({ stage, onExplodeDone, onConvergeDone }: { stage: Stage; onExplodeDone: () => void; onConvergeDone: () => void; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ps = useRef<PParticle[]>([]);
  const raf = useRef(0);
  const explodeDoneFired = useRef(false);
  const convergeDoneFired = useRef(false);
  const t0 = useRef<number>(0);
  const prevStage = useRef<Stage>('idle');

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const cx = W / 2, cy = H / 2;

    // Build ring target positions
    const ringR = 90;
    const angles = Array.from({ length: COUNT }, (_, i) => (i / COUNT) * Math.PI * 2);

    ps.current = Array.from({ length: COUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * Math.max(W, H) * 0.4;
      return {
        x: cx + Math.cos(angle) * dist * 0.3,
        y: cy + Math.sin(angle) * dist * 0.3,
        tx: cx + Math.cos(angles[i]) * ringR,
        ty: cy + Math.sin(angles[i]) * ringR,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        size: 0.8 + Math.random() * 2.2,
        alpha: 0.4 + Math.random() * 0.6,
        hue: Math.random() < 0.7 ? 170 : (Math.random() < 0.5 ? 0 : 200),
        phase: 'scatter',
      };
    });
  }, []);

  useEffect(() => {
    if (stage === prevStage.current) return;
    prevStage.current = stage;
    t0.current = performance.now();
    if (stage === 'explode') { explodeDoneFired.current = false; }
    if (stage === 'converge') { convergeDoneFired.current = false; }
  }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = (now: number) => {
      const ctx = canvas.getContext('2d'); if (!ctx) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const elapsed = now - t0.current;

      if (stage === 'idle' || stage === 'scan') {
        // Ambient drift
        ps.current.forEach(p => {
          p.vx *= 0.99; p.vy *= 0.99;
          p.x += p.vx; p.y += p.vy;
          // wrap
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},100%,75%,${p.alpha * 0.12})`; ctx.fill();
        });
      }

      if (stage === 'explode') {
        const dur = 900;
        const prog = Math.min(elapsed / dur, 1);
        ps.current.forEach((p, i) => {
          const angle = (i / COUNT) * Math.PI * 2;
          const dist = 150 + (i % 7) * 40;
          const ex = cx + Math.cos(angle) * dist;
          const ey = cy + Math.sin(angle) * dist;
          const e = easeOutExpo(prog);
          p.x = lerp(cx, ex, e);
          p.y = lerp(cy, ey, e);
          const a = p.alpha * (1 - prog * 0.3);
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grd.addColorStop(0, `hsla(${p.hue},100%,80%,${a})`);
          grd.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},100%,90%,${a})`; ctx.fill();
        });
        if (prog >= 1 && !explodeDoneFired.current) { explodeDoneFired.current = true; onExplodeDone(); }
      }

      if (stage === 'converge') {
        const dur = 1200;
        const prog = Math.min(elapsed / dur, 1);
        ps.current.forEach(p => {
          const e = easeOutExpo(prog);
          p.x = lerp(p.x, p.tx, e * 0.08 + prog * 0.04);
          p.y = lerp(p.y, p.ty, e * 0.08 + prog * 0.04);
          const d = Math.hypot(p.x - p.tx, p.y - p.ty);
          const a = p.alpha * Math.min(1, prog * 1.5);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${TRGB},${a * (d < 5 ? 1 : 0.7)})`; ctx.fill();
        });
        if (prog >= 1 && !convergeDoneFired.current) { convergeDoneFired.current = true; onConvergeDone(); }
      }

      if (stage === 'ring' || stage === 'check' || stage === 'receipt' || stage === 'stamp') {
        const fade = stage === 'receipt' ? Math.max(0, 1 - (elapsed / 600)) : stage === 'stamp' ? 0 : 1;
        ps.current.forEach(p => {
          ctx.beginPath(); ctx.arc(p.tx, p.ty, p.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${TRGB},${p.alpha * 0.5 * fade})`; ctx.fill();
        });
      }

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [stage]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />;
}

// ─── Ring SVG ───────────────────────────────────────────────────────
function RingSVG({ active }: { active: boolean }) {
  const r = 80, cx = 90, circ = 2 * Math.PI * r;
  return (
    <svg width={cx * 2} height={cx * 2} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)' }}>
      <style>{`@keyframes ringFill { from{stroke-dashoffset:${circ}} to{stroke-dashoffset:0} }`}</style>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={T} strokeWidth="3"
        strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
        style={{ animation: active ? 'ringFill 1s ease-out both' : 'none', opacity: active ? 1 : 0, filter: `drop-shadow(0 0 6px ${T})` }} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(111,255,233,0.3)" strokeWidth="1"
        strokeDasharray={`${circ * 0.5} ${circ * 0.5}`}
        style={{ transform: `rotate(180deg)`, transformOrigin: `${cx}px ${cx}px`, animation: active ? 'ringFill 1.4s 0.2s ease-out both' : 'none', opacity: active ? 1 : 0 }} />
    </svg>
  );
}

function CheckSVG({ active }: { active: boolean }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
      <style>{`@keyframes ck { to{stroke-dashoffset:0} }`}</style>
      <polyline points="12,30 24,42 44,16" stroke={T} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 100, strokeDashoffset: active ? 0 : 100, transition: active ? 'stroke-dashoffset 0.55s cubic-bezier(0.22,1,0.36,1) 0ms' : 'none', filter: `drop-shadow(0 0 8px ${T})` }} />
    </svg>
  );
}

const ROWS = [
  ['PAYMENT ID', 'pay_Q3rKxF9mNjL2A4', true],
  ['DATE & TIME', '03 May 2026 · 09:41:22 AM', false],
  ['PROPERTY', 'Koramangala 4B — Unit 204', false],
  ['TENANT', 'Ravi Krishnamurthy', false],
  ['RENT PERIOD', 'June 2026', false],
  ['METHOD', 'UPI · RAZORPAY SETTLEMENT', false],
] as [string, string, boolean][];

export function PaymentReceipt() {
  const [stage, setStage] = useState<Stage>('idle');

  const go = () => {
    setStage('scan');
    setTimeout(() => setStage('explode'), 700);
  };

  const onExplodeDone = () => setStage('converge');
  const onConvergeDone = () => {
    setStage('ring');
    setTimeout(() => setStage('check'), 800);
    setTimeout(() => setStage('receipt'), 1500);
    setTimeout(() => setStage('stamp'), 2200);
  };

  const replay = () => { setStage('idle'); setTimeout(go, 100); };

  useEffect(() => { setTimeout(go, 600); }, []);

  const showAmount = stage === 'check' || stage === 'receipt' || stage === 'stamp';
  const showReceipt = stage === 'receipt' || stage === 'stamp';
  const showStamp = stage === 'stamp';

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes scanV { 0%{top:-2px;opacity:0} 3%{opacity:1} 97%{opacity:1} 100%{top:100vh;opacity:0} }
        @keyframes amountIn { from{opacity:0;transform:scale(0.7) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes rowIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes stampIn { 0%{opacity:0;transform:rotate(-24deg) scale(0.4)} 60%{transform:rotate(-12deg) scale(1.05)} 100%{opacity:1;transform:rotate(-12deg) scale(1)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(111,255,233,0.3)} 50%{box-shadow:0 0 60px rgba(111,255,233,0.6),0 0 100px rgba(111,255,233,0.2)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Scan line */}
      {stage === 'scan' && (
        <div style={{ position: 'fixed', left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${T},#fff,${T},transparent)`, boxShadow: `0 0 20px 6px rgba(${TRGB},0.6)`, animation: 'scanV 0.7s ease-out forwards', zIndex: 5, pointerEvents: 'none' }} />
      )}

      <ParticleCanvas stage={stage} onExplodeDone={onExplodeDone} onConvergeDone={onConvergeDone} />

      {/* Central hub */}
      <div style={{ position: 'relative', zIndex: 10, width: 440 }}>
        {/* Ring + check */}
        <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 28px' }}>
          {stage !== 'idle' && stage !== 'scan' && stage !== 'explode' && (
            <>
              <RingSVG active={stage !== 'converge'} />
              <CheckSVG active={showAmount} />
              {(stage === 'ring' || stage === 'check') && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', animation: 'glow 2s ease-in-out infinite', pointerEvents: 'none' }} />
              )}
            </>
          )}
        </div>

        {/* Amount */}
        {showAmount && (
          <div style={{ textAlign: 'center', marginBottom: 6, animation: 'amountIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 700 }}>AMOUNT SETTLED</div>
            <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 72, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, textShadow: `0 0 40px rgba(${TRGB},0.3)` }}>
              ₹50,000
            </div>
          </div>
        )}

        {/* Stamp */}
        {showStamp && (
          <div style={{
            position: 'absolute', top: '4%', right: '4%', zIndex: 20,
            border: `2.5px solid ${T}`, padding: '4px 14px',
            fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.35em', color: T,
            transform: 'rotate(-12deg)',
            boxShadow: `inset 0 0 0 1px rgba(111,255,233,0.1), 0 0 24px rgba(111,255,233,0.2)`,
            animation: 'stampIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>SETTLED</div>
        )}

        {/* Receipt */}
        {showReceipt && (
          <div style={{ animation: 'rowIn 0.4s ease-out both' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '24px 0 20px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ROWS.map(([label, value, mono], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: `rowIn 0.35s ${i * 60}ms ease-out both` }}>
                  <span style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: mono ? 'monospace' : 'Inter,sans-serif', letterSpacing: mono ? '0.05em' : 0 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 24, paddingTop: 20, display: 'flex', gap: 10, animation: 'rowIn 0.35s 400ms ease-out both' }}>
              <button style={{ flex: 1, padding: '13px', background: T, color: '#000', border: 'none', fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'Inter,sans-serif', boxShadow: `0 0 20px rgba(${TRGB},0.25)` }}>
                DOWNLOAD PDF
              </button>
              <button onClick={replay} style={{ flex: 1, padding: '13px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                REPLAY ↺
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default PaymentReceipt;
