"use client";

import { motion } from "framer-motion";
import { FileText, Scissors, Sparkles, Database, CheckCircle2, Brain } from "lucide-react";

const stages = [
  { icon: FileText, label: "Upload", colour: "text-violet-300", glow: "bg-violet-glow/15" },
  { icon: FileText, label: "Extract", colour: "text-cyan-300", glow: "bg-cyan-glow/15" },
  { icon: Scissors, label: "Chunk", colour: "text-cyan-300", glow: "bg-cyan-glow/15" },
  { icon: Sparkles, label: "Embed", colour: "text-violet-300", glow: "bg-violet-glow/15" },
  { icon: Brain, label: "Analyse", colour: "text-violet-300", glow: "bg-violet-glow/15" },
  { icon: Database, label: "Index", colour: "text-emerald-300", glow: "bg-emerald-glow/15" },
  { icon: CheckCircle2, label: "Ready", colour: "text-emerald-300", glow: "bg-emerald-glow/15" },
];

export function PipelineStrip() {
  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Agent activity
          </h3>
          <p className="text-xs text-slate-400">
            Every CV moves through the same deterministic pipeline.
          </p>
        </div>
        <span className="pill-emerald">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" />
          Live
        </span>
      </div>
      <div className="relative grid grid-cols-3 gap-y-6 md:grid-cols-7 md:gap-x-2">
        <div className="absolute inset-x-12 top-7 hidden h-px bg-gradient-to-r from-transparent via-violet-glow/30 to-transparent md:block" />
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${s.glow} blur-xl`} />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-ink-800/80 backdrop-blur-xl">
                  <Icon className={`h-5 w-5 ${s.colour}`} />
                </div>
              </div>
              <span className="mt-3 text-xs font-medium text-slate-300">{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
