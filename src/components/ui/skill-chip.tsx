"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  matched?: boolean;
  index?: number;
  className?: string;
}

export function SkillChip({ label, matched, index = 0, className }: Props) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
        matched
          ? "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-200 shadow-glow-emerald"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20",
        className,
      )}
    >
      {matched && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-glow" aria-hidden />
      )}
      {label}
    </motion.span>
  );
}
