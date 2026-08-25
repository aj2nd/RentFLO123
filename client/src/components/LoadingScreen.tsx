import wordmarkImg from "@assets/IMG_8383_1787480222056.png";

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

      {/* New supplied RentFLO wordmark replaces the legacy icon + wordmark lockup. */}
      <div className="relative flex flex-col items-center gap-6">
        <img src={wordmarkImg} alt="RentFLO" style={{ width: 'min(72vw, 280px)' }} className="h-auto object-contain brightness-0 invert opacity-95" />

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
      `}</style>
    </div>
  );
}
