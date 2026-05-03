import { useEffect, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ display: 'block' }}>
      <style>{`@keyframes drawCheck { to { stroke-dashoffset: 0 } }`}</style>
      <circle cx="32" cy="32" r="28" stroke={`rgba(${TRGB},0.15)`} strokeWidth="2" />
      <circle cx="32" cy="32" r="28" stroke={T} strokeWidth="2"
        strokeDasharray="176" strokeDashoffset="0"
        style={{ animation: 'drawCheck 0.7s 0.1s ease-out both', filter: `drop-shadow(0 0 8px ${T})` }} />
      <polyline points="18,34 28,44 46,22" stroke={T} strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="45" strokeDashoffset="0"
        style={{ animation: 'drawCheck 0.5s 0.5s ease-out both', filter: `drop-shadow(0 0 6px ${T})` }} />
    </svg>
  );
}

const PENDING_ROWS = [
  ['PROPERTY', 'Koramangala 4B — Unit 204'],
  ['TENANT', 'Ravi Krishnamurthy'],
  ['DUE DATE', '01 June 2026'],
  ['METHOD', 'UPI / NEFT'],
];
const SETTLED_ROWS = [
  ['PAYMENT ID', 'pay_Q3rKxF9mNjL2'],
  ['SETTLED AT', '03 May 2026 · 09:41 AM'],
  ['PROPERTY', 'Koramangala 4B — Unit 204'],
  ['METHOD', 'UPI · RAZORPAY'],
];

export function PaymentReceipt() {
  const [flipped, setFlipped] = useState(false);
  const [canFlipBack, setCanFlipBack] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1400);
    const t2 = setTimeout(() => setCanFlipBack(true), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const toggle = () => {
    if (!canFlipBack && flipped) return;
    setFlipped(f => !f);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0px) rotateX(2deg)} 50%{transform:translateY(-8px) rotateX(2deg)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 40px rgba(111,255,233,0.15),0 30px 60px rgba(0,0,0,0.8)} 50%{box-shadow:0 0 80px rgba(111,255,233,0.35),0 30px 60px rgba(0,0,0,0.8)} }
        @keyframes rowStagger { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pendingPulse { 0%,100%{background:rgba(250,204,21,0.08)} 50%{background:rgba(250,204,21,0.15)} }
      `}</style>

      {/* Background ambient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: flipped
          ? `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(${TRGB},0.06), transparent 70%)`
          : 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(250,204,21,0.04), transparent 70%)',
        transition: 'background 1s',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 48, animation: 'fadeUp 0.6s ease-out both' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginBottom: 10 }}>RENTFLO — PAYMENT CARD</div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 200, color: '#fff', letterSpacing: '-0.04em' }}>
          Click card to <span style={{ color: T, fontWeight: 700 }}>{flipped ? 'reset' : 'settle'}</span>
        </h1>
      </div>

      {/* Card stage */}
      <div onClick={toggle} style={{ perspective: '1100px', perspectiveOrigin: '50% 50%', cursor: 'pointer', position: 'relative', zIndex: 5 }}>
        {/* Bloom */}
        <div style={{
          position: 'absolute', inset: '-30px', borderRadius: 48,
          background: flipped
            ? `radial-gradient(ellipse at 50% 50%, rgba(${TRGB},0.2), transparent 65%)`
            : 'radial-gradient(ellipse at 50% 50%, rgba(250,204,21,0.12), transparent 65%)',
          filter: 'blur(24px)', pointerEvents: 'none', transition: 'background 1s',
        }} />

        {/* Card flip wrapper */}
        <div style={{
          width: 420, height: 540,
          transformStyle: 'preserve-3d' as const,
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
          transition: 'transform 1s cubic-bezier(0.4,0,0.2,1)',
          animation: !flipped ? 'float 4s ease-in-out infinite' : 'none',
          position: 'relative',
        }}>

          {/* ── FRONT FACE — Pending ── */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden' as const,
            borderRadius: 24,
            background: 'linear-gradient(160deg, #0e0b00 0%, #070600 100%)',
            border: '1px solid rgba(250,204,21,0.25)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(250,204,21,0.08)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #facc15, transparent)', borderRadius: '24px 24px 0 0' }} />

            {/* Pending badge */}
            <div style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.3)',
              borderRadius: 100,
              padding: '4px 14px', fontSize: 8, letterSpacing: '0.2em', fontWeight: 700, color: '#facc15',
              animation: 'pendingPulse 2s ease-in-out infinite',
            }}>PENDING</div>

            <div style={{ padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 14 }}>RENT DUE</div>
                <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 64, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
                  ₹50,000
                </div>
                <div style={{ fontSize: 10, color: 'rgba(250,204,21,0.7)', letterSpacing: '0.1em' }}>DUE IN 7 DAYS — 01 JUN 2026</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(250,204,21,0.15), transparent)' }} />
                {PENDING_ROWS.map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em' }}>{k}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.18em' }}>↻ CLICK TO SETTLE PAYMENT</div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.15), transparent)', borderRadius: '0 0 24px 24px' }} />
          </div>

          {/* ── BACK FACE — Settled ── */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden' as const,
            transform: 'rotateY(180deg)',
            borderRadius: 24,
            background: 'linear-gradient(160deg, #001a12 0%, #000d09 100%)',
            border: `1px solid rgba(${TRGB},0.3)`,
            boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(${TRGB},0.1), inset 0 0 0 1px rgba(${TRGB},0.05)`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: flipped ? 'glowPulse 3s ease-in-out infinite' : 'none',
          }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${T}, transparent)`, boxShadow: `0 0 8px ${T}`, borderRadius: '24px 24px 0 0' }} />

            <div style={{ padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {flipped && <CheckIcon />}
                <div>
                  <div style={{ fontSize: 8, letterSpacing: '0.25em', color: `rgba(${TRGB},0.5)`, fontWeight: 700, marginBottom: 8 }}>SETTLED</div>
                  <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, textShadow: `0 0 30px rgba(${TRGB},0.3)` }}>
                    ₹50,000
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, rgba(${TRGB},0.2), transparent)` }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {SETTLED_ROWS.map(([k, v], i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    animation: flipped ? `rowStagger 0.35s ${0.6 + i * 0.07}s ease-out both` : 'none',
                    opacity: flipped ? 1 : 0,
                  }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em' }}>{k}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: k === 'PAYMENT ID' ? 'monospace' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Download button */}
              <button
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '13px', background: T, color: '#000', border: 'none',
                  borderRadius: 12,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif', boxShadow: `0 0 20px rgba(${TRGB},0.3)`,
                  animation: flipped ? 'fadeUp 0.4s 1.1s ease-out both' : 'none',
                  opacity: flipped ? 1 : 0,
                }}>
                DOWNLOAD RECEIPT →
              </button>
            </div>

            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, rgba(${TRGB},0.15), transparent)`, borderRadius: '0 0 24px 24px' }} />
          </div>
        </div>
      </div>

      {/* State indicator */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 44, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.5s 0.3s ease-out both' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: flipped ? T : '#facc15',
          boxShadow: flipped ? `0 0 12px ${T}` : '0 0 12px #facc15',
          transition: 'all 0.5s',
        }} />
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          {flipped ? 'PAYMENT SETTLED — CLICK TO RESET' : 'PAYMENT PENDING — CLICK TO SETTLE'}
        </span>
      </div>
    </div>
  );
}
export default PaymentReceipt;
