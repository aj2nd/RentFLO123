import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";

export function LegalHeader() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <header className="flex items-center justify-between mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Back to Home</span>
      </Link>
      <Link href="/" className="flex items-center gap-3" data-testid="link-legal-logo">
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: isDark ? "transparent" : "#111111",
          overflow: isDark ? "visible" : "hidden",
        }}>
          <img
            src="/logo-icon.jpeg"
            alt="RentFLO"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              filter: isDark
                ? "contrast(2.2) brightness(0.88)"
                : "contrast(2.2) brightness(0.90)",
              WebkitMaskImage: isDark
                ? "radial-gradient(circle at 50% 50%, black 58%, transparent 76%)"
                : "none",
              maskImage: isDark
                ? "radial-gradient(circle at 50% 50%, black 58%, transparent 76%)"
                : "none",
            }}
          />
        </span>
        <img
          src="/logo-wordmark-transparent.png"
          alt="RentFLO"
          style={{
            height: 32,
            objectFit: "contain",
            filter: isDark
              ? "drop-shadow(0 0 8px rgba(192,192,192,0.12))"
              : "invert(1) drop-shadow(0 0 6px rgba(0,0,0,0.08))",
          }}
        />
      </Link>
    </header>
  );
}
