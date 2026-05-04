import houseLogoImg from "@assets/IMG_7223_1777731010120.jpeg";
import wordmarkImg from "@assets/IMG_7224_1777731010120.jpeg";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[9999]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(111,255,233,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Logo lockup */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Icon with liquid glass ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(111,255,233,0.6), rgba(111,255,233,0.05), rgba(111,255,233,0.6))',
              filter: 'blur(8px)',
              transform: 'scale(1.4)',
              animation: 'spin 3s linear infinite',
            }}
          />
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, rgba(111,255,233,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(111,255,233,0.08) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(111,255,233,0.3)',
              borderRadius: '18px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <img src={houseLogoImg} alt="RentFLO" style={{ width: 44, height: 44 }} className="object-contain" />
          </div>
        </div>

        {/* Wordmark */}
        <img src={wordmarkImg} alt="RentFLO" style={{ height: 28 }} className="object-contain opacity-90" />

        {/* Tagline */}
        <p className="text-xs uppercase tracking-[0.3em] text-[#6FFFE9]/40 mt-1">
          Fintech Operating System
        </p>

        {/* Animated progress bar */}
        <div
          className="relative overflow-hidden mt-4"
          style={{ width: 120, height: 1, background: 'rgba(111,255,233,0.12)' }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-40%',
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #6FFFE9, transparent)',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { left: -40%; }
          100% { left: 140%; }
        }
        @keyframes spin {
          from { transform: scale(1.4) rotate(0deg); }
          to   { transform: scale(1.4) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
