import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button
        className={className}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(192,192,192,0.12)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-label="Toggle theme"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: isDark
          ? "1px solid rgba(192,192,192,0.14)"
          : "1px solid rgba(0,0,0,0.12)",
        background: isDark
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.04)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.2s, border-color 0.2s",
        color: isDark ? "rgba(192,192,192,0.65)" : "rgba(40,40,40,0.70)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = isDark
          ? "rgba(192,192,192,0.28)"
          : "rgba(0,0,0,0.22)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = isDark
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = isDark
          ? "rgba(192,192,192,0.14)"
          : "rgba(0,0,0,0.12)";
      }}
    >
      {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
    </button>
  );
}
