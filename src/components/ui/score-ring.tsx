"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  score: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string;
  accent?: "violet" | "cyan" | "emerald" | "amber";
  className?: string;
}

const accents: Record<NonNullable<Props["accent"]>, string> = {
  violet: "#a78bfa",
  cyan: "#22d3ee",
  emerald: "#34d399",
  amber: "#fbbf24",
};

export function ScoreRing({
  score,
  size = 96,
  stroke = 8,
  label,
  accent = "violet",
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const colour = accents[accent];
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${colour}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-2xl font-semibold tracking-tight text-white"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {Math.round(clamped)}%
        </motion.span>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
