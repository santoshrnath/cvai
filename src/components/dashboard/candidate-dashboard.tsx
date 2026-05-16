"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SearchPanel } from "./search-panel";
import { CandidateCard } from "./candidate-card";
import { StatsStrip } from "./stats-strip";
import { SkillsCloud } from "./skills-cloud";
import type { MatchResult } from "@/lib/ai/match-candidates";
import { Users, Loader2 } from "lucide-react";

interface CandidateListItem {
  id: string;
  fullName: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
  yearsExperience: number | null;
  seniority: string | null;
  primarySkills: unknown;
  industries: unknown;
  processingStatus: string;
  aiConfidenceScore: number | null;
}

interface Stats {
  total: number;
  ready: number;
  failed: number;
  inProgress: number;
  topSkills: Array<{ skill: string; count: number }>;
  avgExperience: number | null;
}

export function CandidateDashboard() {
  const [list, setList] = useState<CandidateListItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/candidates?limit=200");
        const json = (await res.json()) as { candidates: CandidateListItem[]; stats: Stats };
        if (cancelled) return;
        setList(json.candidates);
        setStats(json.stats);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const handle = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setMatchResults(null);
      return;
    }
    setMatchResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 6 }),
      });
      const json = (await res.json()) as { results?: MatchResult[]; error?: string };
      setMatchResults(json.results ?? []);
    } catch {
      setMatchResults([]);
    }
  };

  const matchedSkills = useMemo(
    () => new Set(matchResults?.flatMap((m) => m.matchedSkills.map((s) => s.toLowerCase())) ?? []),
    [matchResults],
  );

  return (
    <div className="space-y-6">
      <SearchPanel onSearch={handleSearch} loading={matchResults !== null && matchResults.length === 0 && !!searchQuery} />

      {matchResults !== null && (
        <MatchResultsSection
          query={searchQuery}
          results={matchResults}
          onClear={() => {
            setMatchResults(null);
            setSearchQuery("");
          }}
        />
      )}

      <StatsStrip stats={stats} />

      {stats && stats.topSkills.length > 0 && (
        <SkillsCloud skills={stats.topSkills} highlighted={matchedSkills} />
      )}

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4 text-violet-300" />
            <h3 className="text-sm font-semibold">All candidates</h3>
            <span className="text-xs text-slate-500">({list.length})</span>
          </div>
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> syncing
            </span>
          )}
        </div>
        {list.length === 0 && !loading ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            No candidates yet. Upload CVs to populate the talent pool.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
              >
                <CandidateCard candidate={c} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MatchResultsSection({
  query,
  results,
  onClear,
}: {
  query: string;
  results: MatchResult[];
  onClear: () => void;
}) {
  const pending = results.length === 0;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_60%)]" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="pill-accent">AI match · Claude Sonnet 4.6</span>
          <h3 className="text-base font-semibold tracking-tight text-white">
            {query}
          </h3>
        </div>
        <button onClick={onClear} className="btn-ghost !px-3 !py-1.5 text-xs">
          Clear
        </button>
      </div>
      {pending ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-violet-glow/30 bg-violet-glow/[0.04] p-6 text-sm text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Embedding query, searching Qdrant, scoring matches…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.map((r, i) => (
            <MatchCard key={r.candidateId + i} result={r} rank={i + 1} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function MatchCard({ result, rank }: { result: MatchResult; rank: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <CandidateCard
        candidate={{
          id: result.candidateId,
          fullName: result.candidateName,
          currentTitle: result.currentTitle,
          currentCompany: null,
          location: result.location,
          yearsExperience: result.yearsExperience,
          seniority: null,
          primarySkills: result.primarySkills,
          industries: null,
          processingStatus: "READY",
          aiConfidenceScore: null,
        }}
        matchedSkills={result.matchedSkills}
        match={{
          rank,
          overallScore: result.overallScore,
          whyMatch: result.whyMatch,
          gaps: result.gaps,
          evidence: result.evidence,
          breakdown: result.scoreBreakdown,
        }}
      />
    </motion.div>
  );
}
