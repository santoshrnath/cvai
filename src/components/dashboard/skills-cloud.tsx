"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  skills: Array<{ skill: string; count: number }>;
  highlighted: Set<string>;
}

// Sizes scale with frequency.
export function SkillsCloud({ skills, highlighted }: Props) {
  if (skills.length === 0) return null;
  const max = Math.max(...skills.map((s) => s.count));
  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Talent pool skill cloud</h3>
        <span className="text-xs text-slate-500">
          Sized by frequency · highlighted by current search
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => {
          const scale = 0.85 + (s.count / max) * 0.6;
          const isMatch = highlighted.has(s.skill.toLowerCase());
          return (
            <motion.span
              key={s.skill}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              style={{ fontSize: `${0.75 * scale}rem` }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition",
                isMatch
                  ? "border-emerald-glow/50 bg-emerald-glow/15 text-emerald-200 shadow-glow-emerald"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20",
              )}
            >
              {s.skill}
              <span className="text-[10px] text-slate-500">{s.count}</span>
            </motion.span>
          );
        })}
      </div>
    </section>
  );
}
