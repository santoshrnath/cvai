"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Files, Database, Loader2, Users } from "lucide-react";
import { formatYears, toArray } from "@/lib/utils";

interface Props {
  total: number;
  ready: number;
  processing: number;
  recent: Array<{
    id: string;
    fullName: string | null;
    currentTitle: string | null;
    yearsExperience: number | null;
    primarySkills: unknown;
  }>;
}

export function LandingStats({ total, ready, processing, recent }: Props) {
  const cards = [
    { label: "Total CVs", value: total, icon: Files, accent: "text-violet-300" },
    { label: "Candidates ready", value: ready, icon: Users, accent: "text-emerald-300" },
    { label: "In pipeline", value: processing, icon: Loader2, accent: "text-cyan-300" },
    { label: "Vectors indexed", value: ready * 8 /* approx */, icon: Database, accent: "text-violet-300" },
  ];
  return (
    <section className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card !p-4"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">{c.label}</span>
                <Icon className={`h-3.5 w-3.5 ${c.accent}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {c.value.toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card !p-4 md:w-[320px]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            Recently scanned
          </span>
          <Link
            href="/candidates"
            className="text-xs text-violet-300 transition hover:text-violet-200"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="text-xs text-slate-500">
              No candidates yet. Upload CVs to populate the talent pool.
            </p>
          )}
          {recent.map((c, i) => {
            const skills = toArray<string>(c.primarySkills).slice(0, 2);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2"
              >
                <Avatar name={c.fullName ?? "Pending"} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {c.fullName ?? "Unnamed candidate"}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {[c.currentTitle, formatYears(c.yearsExperience)]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {skills[0] && (
                  <span className="hidden whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 md:inline">
                    {skills[0]}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
