import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  colorScheme?: "default" | "sage" | "gold" | "rose" | "violet";
}

const schemeMap = {
  default: { text: "var(--foreground)",               icon: "rgba(0,0,0,0.18)", bg: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.10)" },
  sage:    { text: "var(--color-sage,#064E3B)",         icon: "var(--color-sage-mid,#059669)", bg: "var(--color-sage-bg,#D1FAE5)", border: "var(--color-sage-border,rgba(5,150,105,0.28))" },
  gold:    { text: "var(--color-gold,#92400E)",         icon: "var(--color-gold-mid,#D97706)", bg: "var(--color-gold-bg,#FEF3C7)", border: "var(--color-gold-border,rgba(217,119,6,0.30))" },
  rose:    { text: "var(--color-rose,#9F1239)",         icon: "var(--color-rose-mid,#E11D48)", bg: "var(--color-rose-bg,#FFE4E6)", border: "var(--color-rose-border,rgba(225,29,72,0.28))" },
  violet:  { text: "var(--color-violet,#4C1D95)",       icon: "var(--color-violet-mid,#7C3AED)", bg: "var(--color-violet-bg,#EDE9FE)", border: "var(--color-violet-border,rgba(124,58,237,0.28))" },
};

export function StatCard({ label, value, subtext, colorScheme = "default" }: StatCardProps) {
  const s = schemeMap[colorScheme];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-8 border bg-zinc-950/50 backdrop-blur-sm hover:border-white/30 transition-colors duration-300"
      style={{
        background: `var(--surface-card)`,
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-zinc-500 font-medium tracking-wide text-sm uppercase">{label}</span>
        <ArrowUpRight style={{ color: s.icon, width: 20, height: 20 }} />
      </div>
      <div className="space-y-2">
        <h3
          className="text-4xl font-medium tracking-tighter"
          style={{ color: s.text }}
        >
          {value}
        </h3>
        {subtext && <p className="text-zinc-500 text-sm">{subtext}</p>}
      </div>
    </motion.div>
  );
}
