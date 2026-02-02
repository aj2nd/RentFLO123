import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-8 border border-white/10 bg-zinc-950/50 backdrop-blur-sm hover:border-white/30 transition-colors duration-300"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-zinc-500 font-medium tracking-wide text-sm uppercase">{label}</span>
        <ArrowUpRight className="text-zinc-700 w-5 h-5" />
      </div>
      <div className="space-y-2">
        <h3 className="text-4xl font-medium tracking-tighter text-white">{value}</h3>
        {subtext && <p className="text-zinc-500 text-sm">{subtext}</p>}
      </div>
    </motion.div>
  );
}
