import { useEffect, useRef, useState } from 'react';

const T = '#6FFFE9';
const TRGB = '111,255,233';

// ─── Animated Mesh Gradient Canvas ─────────────────────────────────
interface Light { x: number; y: number; vx: number; vy: number; hue: number; dh: number; r: number; }

function MeshCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lights = useRef<Light[]>([]);
  const raf = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const ripples = useRef<{ x: number; y: number; r: number; maxR: number; alpha: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    // 6 colored light sources
    lights.current = [
      { x: W * 0.15, y: H * 0.2, vx: 0.3, vy: 0.2, hue: 172, dh: 0.03, r: Math.max(W, H) * 0.55 },
      { x: W * 0.85, y: H * 0.8, vx: -0.25, vy: -0.18, hue: 190, dh: -0.02, r: Math.max(W, H) * 0.6 },
      { x: W * 0.5, y: H * 0.1, vx: 0.15, vy: 0.35, hue: 165, dh: 0.04, r: Math.max(W, H) * 0.45 },
      { x: W * 0.1, y: H * 0.85, vx: 0.28, vy: -0.22, hue: 200, dh: 0.02, r: Math.max(W, H) * 0.4 },
      { x: W * 0.7, y: H * 0.3, vx: -0.18, vy: 0.28, hue: 155, dh: -0.03, r: Math.max(W, H) * 0.5 },
      { x: W * 0.3, y: H * 0.6, vx: 0.22, vy: -0.15, hue: 210, dh: 0.025, r: Math.max(W, H) * 0.35 },
    ];

    const render = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) { raf.current = requestAnimationFrame(render); return; }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

      // Draw lights
      lights.current.forEach(l => {
        l.x += l.vx; l.y += l.vy; l.hue += l.dh;
        if (l.x < 0 || l.x > W) l.vx *= -1;
        if (l.y < 0 || l.y > H) l.vy *= -1;

        const grd = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        grd.addColorStop(0, `hsla(${l.hue},100%,45%,0.18)`);
        grd.addColorStop(0.4, `hsla(${l.hue},80%,40%,0.06)`);
        grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      });

      // Mouse cursor glow
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      if (mx > 0 && mx < W) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        mg.addColorStop(0, `rgba(${TRGB},0.12)`);
        mg.addColorStop(0.5, `rgba(${TRGB},0.03)`);
        mg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(mx, my, 180, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();
      }

      // Ripples
      ripples.current = ripples.current.filter(rp => rp.alpha > 0.01);
      ripples.current.forEach(rp => {
        rp.r += 3; rp.alpha *= 0.94;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${TRGB},${rp.alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
      });

      raf.current = requestAnimationFrame(render);
    };
    render();

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onClick = (e: MouseEvent) => { ripples.current.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 200, alpha: 0.5 }); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('mousemove', onMove); window.removeEventListener('click', onClick); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}

// ─── Word Blur Entrance ─────────────────────────────────────────────
function BlurWord({ word, delay, big, gradient }: { word: string; delay: number; big?: boolean; gradient?: boolean; }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <span style={{
      display: 'inline-block',
      opacity: visible ? 1 : 0,
      filter: visible ? 'blur(0px)' : 'blur(12px)',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
      transitionDelay: '0ms',
      marginRight: big ? '0.2em' : '0.18em',
      ...(gradient ? {
        background: `linear-gradient(90deg, #fff 0%, ${T} 50%, #fff 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        backgroundSize: '200% 100%',
      } : {}),
    }}>{word}</span>
  );
}

// ─── Slot Machine Counter ───────────────────────────────────────────
function SlotCounter({ to, prefix = '', suffix = '', delay = 0 }: { to: number; prefix?: string; suffix?: string; delay?: number }) {
  const [v, setV] = useState(0);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, [delay]);
  const s = useRef<number | null>(null);
  useEffect(() => {
    if (!go) return; s.current = null;
    const dur = 2000;
    const go2 = (ts: number) => {
      if (!s.current) s.current = ts;
      const p = Math.min((ts - s.current) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setV(Math.round(e * to));
      if (p < 1) requestAnimationFrame(go2);
    };
    requestAnimationFrame(go2);
  }, [go, to]);
  return (
    <div style={{ fontFamily: '"Courier New",monospace', letterSpacing: '-0.02em' }}>
      <span style={{ fontSize: 40, fontWeight: 700, color: '#fff' }}>{prefix}{v.toLocaleString('en-IN')}</span>
      <span style={{ fontSize: 20, color: T }}>{suffix}</span>
    </div>
  );
}

// ─── Social Proof Ticker ─────────────────────────────────────────────
const TICKER_ITEMS = ['500+ Landlords', '₹24 Cr Advanced', '99.2% On-Time', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Zero Defaults', '12,000+ Payments', 'Backed by Trust'];

function Ticker() {
  const [off, setOff] = useState(0);
  const iW = 175;
  useEffect(() => {
    let id: number; let last = 0;
    const go = (ts: number) => { if (!last) last = ts; setOff(o => (o + (ts - last) * 0.04) % (iW * TICKER_ITEMS.length)); last = ts; id = requestAnimationFrame(go); };
    id = requestAnimationFrame(go); return () => cancelAnimationFrame(id);
  }, []);
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0', position: 'relative' }}>
      <div style={{ display: 'flex', transform: `translateX(-${off}px)`, willChange: 'transform' }}>
        {items.map((item, i) => (
          <div key={i} style={{ minWidth: iW, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: T, opacity: 0.45, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phone Mockup ────────────────────────────────────────────────────
function Phone() {
  return (
    <div style={{
      width: 210, height: 420, borderRadius: 30,
      background: 'linear-gradient(160deg, rgba(20,20,24,0.95), rgba(8,8,10,0.98))',
      border: '1.5px solid rgba(255,255,255,0.12)',
      boxShadow: `0 40px 80px rgba(0,0,0,0.7), inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 0 40px rgba(${TRGB},0.08)`,
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 15, background: '#000', borderRadius: '0 0 12px 12px', zIndex: 2 }} />
      {/* Iridescent top edge */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T}, rgba(150,80,255,0.5), ${T}, transparent)`, zIndex: 3 }} />
      <div style={{ padding: '22px 14px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 9, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>RENTFLO</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T, boxShadow: `0 0 5px ${T}` }} />
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>LIVE</span>
          </div>
        </div>
        {/* Rent card */}
        <div style={{ background: `rgba(${TRGB},0.07)`, border: `1px solid rgba(${TRGB},0.18)`, padding: '14px 12px' }}>
          <div style={{ fontSize: 7, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>RENT DUE</div>
          <div style={{ fontSize: 22, fontWeight: 200, color: '#fff', marginBottom: 3 }}>₹32,000</div>
          <div style={{ fontSize: 7, color: T, letterSpacing: '0.08em' }}>DUE 1 JUN · 7 DAYS LEFT</div>
        </div>
        {/* Mini stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['PAID', '₹3.2L', T], ['BALANCE', '₹48K', '#fff']].map(([l, v, c]) => (
            <div key={String(l)} style={{ border: '1px solid rgba(255,255,255,0.07)', padding: '9px 8px' }}>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 14, color: String(c), fontWeight: 300 }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Action buttons */}
        {['PAY VIA UPI →', 'VIEW LEDGER →', 'AGREEMENTS →'].map((label) => (
          <div key={label} style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{label.slice(0, -2)}</span>
            <span style={{ fontSize: 8, color: T }}>→</span>
          </div>
        ))}
        {/* Bottom nav */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 6 }}>
          {[T, '#333', '#333', '#333', '#333'].map((c, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c, boxShadow: i === 0 ? `0 0 6px ${T}` : 'none' }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
export function HeroLanding() {
  const [hoverCta, setHoverCta] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes lineGrow { from{width:0;opacity:0} to{width:100%;opacity:1} }
        @keyframes fadein { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:perspective(900px) rotateX(3deg) rotateY(-8deg) translateY(0)} 50%{transform:perspective(900px) rotateX(3deg) rotateY(-8deg) translateY(-14px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 0 20px rgba(111,255,233,0.3)} 50%{box-shadow:0 0 50px rgba(111,255,233,0.7),0 0 80px rgba(111,255,233,0.2)} }
        @keyframes iridescent { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>

      <MeshCanvas />

      {/* Top iridescent bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${T}, rgba(160,80,255,0.5), rgba(80,160,255,0.4), ${T}, transparent)`, zIndex: 99 }} />

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 700, color: '#fff' }}>RENTFLO</div>
        <div style={{ display: 'flex', gap: 30 }}>
          {['How It Works', 'For Owners', 'Pricing', 'About'].map(l => (
            <span key={l} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', letterSpacing: '0.04em', transition: 'color 0.2s' }}>{l}</span>
          ))}
        </div>
        <button style={{ padding: '9px 22px', background: 'transparent', border: `1px solid rgba(${TRGB},0.4)`, color: T, fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}>
          LOG IN →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 40, alignItems: 'center', padding: '64px 48px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Left */}
        <div>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 28, border: `1px solid rgba(${TRGB},0.18)`, padding: '7px 16px', background: `rgba(${TRGB},0.04)`, backdropFilter: 'blur(10px)', animation: 'fadein 0.5s 0.1s both' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T, animation: 'pulse 2s infinite', boxShadow: `0 0 8px ${T}` }} />
            <span style={{ fontSize: 9, letterSpacing: '0.2em', color: T, fontWeight: 700 }}>INDIA'S LEADING RENT ADVANCE PLATFORM</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 6, lineHeight: 1.05 }}>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em', display: 'block' }}>
              {['Never', 'Chase'].map((w, i) => <BlurWord key={w} word={w} delay={400 + i * 180} big />)}
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em', display: 'block' }}>
              {['Rent.', 'Ever.'].map((w, i) => <BlurWord key={w} word={w} delay={760 + i * 180} big gradient />)}
            </div>
          </div>

          {/* Accent line */}
          <div style={{ height: 2, background: `linear-gradient(90deg,${T},rgba(${TRGB},0.2),transparent)`, marginBottom: 24, animation: 'lineGrow 0.9s 1.8s ease-out both', opacity: 0, animationFillMode: 'forwards' }} />

          {/* Sub */}
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.42)', maxWidth: 480, lineHeight: 1.7, margin: '0 0 36px', animation: 'fadein 0.5s 2s both' }}>
            Landlords get paid on the 1st — guaranteed. We advance rent instantly and collect from tenants, so you never wait, negotiate, or chase.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, animation: 'fadein 0.5s 2.2s both', marginBottom: 44 }}>
            <button
              onMouseEnter={() => setHoverCta(true)}
              onMouseLeave={() => setHoverCta(false)}
              style={{
                padding: '16px 36px', background: hoverCta ? '#fff' : T, color: '#000', border: 'none',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                animation: 'ctaGlow 2.5s ease-in-out infinite',
                transition: 'background 0.2s',
              }}>
              GET STARTED FREE →
            </button>
            <button style={{ padding: '16px 28px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Inter,sans-serif', backdropFilter: 'blur(8px)' }}>
              ▶ WATCH DEMO
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, animation: 'fadein 0.5s 2.4s both' }}>
            {[
              { to: 24, prefix: '₹', suffix: ' Cr+', label: 'TOTAL ADVANCED', delay: 2600 },
              { to: 500, suffix: '+', label: 'LANDLORDS', delay: 2700 },
              { to: 99, suffix: '.2%', label: 'ON-TIME RATE', delay: 2800 },
            ].map(s => (
              <div key={s.label} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 20 }}>
                <SlotCounter to={s.to} prefix={s.prefix || ''} suffix={s.suffix} delay={s.delay} />
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadein 0.6s 2.5s both', opacity: 0, animationFillMode: 'forwards' }}>
          <div style={{ animation: 'float 6s ease-in-out infinite' }}>
            <Phone />
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Ticker />
      </div>

      {/* Social proof */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 48px', display: 'flex', alignItems: 'center', gap: 0, animation: 'fadein 0.5s 2.8s both' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.18)', fontWeight: 700, marginRight: 24 }}>ACTIVE IN</span>
        {['Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai'].map((city, i) => (
          <span key={city} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '0 20px' }}>{city}</span>
        ))}
      </div>
    </div>
  );
}
export default HeroLanding;
