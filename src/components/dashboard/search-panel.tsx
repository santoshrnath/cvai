"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Power BI + Azure Data Factory + finance domain",
  "Senior data scientists with ML in healthcare",
  "Salesforce integration + reporting automation",
  "Consulting experience, client-facing delivery",
  "CFO dashboard build — BI manager level",
];

export function SearchPanel({
  onSearch,
  loading,
}: {
  onSearch: (query: string) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (q: string) => {
    setValue(q);
    onSearch(q);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(34,211,238,0.12),transparent_50%)]" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSearch(value.trim());
        }}
        className="flex flex-col gap-3 md:flex-row md:items-center"
      >
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3 transition focus-within:border-violet-glow/50 focus-within:shadow-glow">
          <Sparkles className="h-4 w-4 text-violet-300" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask the agent: find a Power BI + Azure Data Engineer with finance experience…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-violet-300" />}
        </div>
        <button type="submit" disabled={!value.trim() || loading} className="btn-primary">
          <Search className="h-4 w-4" />
          Search talent
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Try
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300 transition hover:border-violet-glow/30 hover:bg-violet-glow/[0.06] hover:text-violet-200"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.section>
  );
}
