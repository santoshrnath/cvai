"use client";

import { motion } from "framer-motion";
import { Database, Files, Layers, Loader2, Sparkles, Users } from "lucide-react";
import { formatYears } from "@/lib/utils";

interface Stats {
  total: number;
  ready: number;
  failed: number;
  inProgress: number;
  topSkills: Array<{ skill: string; count: number }>;
  avgExperience: number | null;
}

export function StatsStrip({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const cards = [
    { label: "Total CVs", value: stats.total.toLocaleString(), icon: Files },
    { label: "Ready", value: stats.ready.toLocaleString(), icon: Users },
    { label: "In pipeline", value: stats.inProgress.toLocaleString(), icon: Loader2 },
    {
      label: "Avg. experience",
      value: formatYears(stats.avgExperience),
      icon: Layers,
    },
    {
      label: "Top skills",
      value: String(stats.topSkills.length),
      icon: Sparkles,
    },
    {
      label: "Vectors indexed",
      value: (stats.ready * 8).toLocaleString(),
      hint: "approx",
      icon: Database,
    },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card !p-4"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase tracking-wider">{c.label}</span>
              <Icon className="h-3.5 w-3.5 text-violet-300" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {c.value}
              {c.hint && (
                <span className="ml-1 text-[10px] font-normal text-slate-500">
                  {c.hint}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}
