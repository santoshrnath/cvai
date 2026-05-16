"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, type CandidateStatus } from "@/components/ui/status-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { ScanningOrb } from "@/components/ui/scanning-orb";
import { cn, formatYears, toArray } from "@/lib/utils";

interface CandidateLive {
  id: string;
  fullName: string | null;
  currentTitle: string | null;
  processingStatus: CandidateStatus;
  yearsExperience: number | null;
  primarySkills: unknown;
  aiConfidenceScore: number | null;
}

const STAGES: Array<{
  key: CandidateStatus;
  label: string;
  icon: typeof FileText;
  colour: string;
}> = [
  { key: "UPLOADED", label: "Uploaded", icon: FileText, colour: "text-slate-300" },
  { key: "EXTRACTING_TEXT", label: "Extracting", icon: Layers, colour: "text-cyan-300" },
  { key: "CHUNKING", label: "Chunking", icon: Layers, colour: "text-cyan-300" },
  { key: "EMBEDDING", label: "Embedding", icon: Sparkles, colour: "text-violet-300" },
  { key: "ANALYSING", label: "Analysing", icon: Brain, colour: "text-violet-300" },
  { key: "READY", label: "Ready", icon: CheckCircle2, colour: "text-emerald-300" },
];

const STAGE_INDEX: Record<CandidateStatus, number> = {
  UPLOADED: 0,
  QUEUED: 0,
  EXTRACTING_TEXT: 1,
  CHUNKING: 2,
  EMBEDDING: 3,
  ANALYSING: 4,
  READY: 5,
  FAILED: 5,
  DUPLICATE: 5,
  NEEDS_REVIEW: 5,
};

export function LiveScanCenter({ candidateIds }: { candidateIds: string[] }) {
  const [candidates, setCandidates] = useState<CandidateLive[]>([]);

  useEffect(() => {
    if (candidateIds.length === 0) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(
          `/api/candidates/status?ids=${encodeURIComponent(candidateIds.join(","))}`,
        );
        const json = (await res.json()) as { statuses?: CandidateLive[] };
        if (!cancelled) setCandidates(json.statuses ?? []);
      } catch {
        /* ignore */
      }
    }
    void poll();
    const handle = window.setInterval(poll, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [candidateIds]);

  const activeCandidate = useMemo(() => {
    return (
      candidates.find(
        (c) =>
          c.processingStatus !== "READY" &&
          c.processingStatus !== "FAILED" &&
          c.processingStatus !== "DUPLICATE",
      ) ?? candidates[0]
    );
  }, [candidates]);

  const counts = useMemo(() => {
    const ready = candidates.filter((c) => c.processingStatus === "READY").length;
    const failed = candidates.filter((c) => c.processingStatus === "FAILED").length;
    const inflight = candidates.length - ready - failed;
    return { ready, failed, inflight };
  }, [candidates]);

  return (
    <div className="space-y-5">
      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.18),transparent_60%)]" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Live Scan Center
            </h3>
            <p className="text-xs text-slate-400">
              Claude Sonnet 4.6 is parsing your CVs. Vectors land in Qdrant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill-emerald">
              <CheckCircle2 className="h-3 w-3" />
              {counts.ready} ready
            </span>
            <span className="pill-cyan">
              <Loader2 className={cn("h-3 w-3", counts.inflight > 0 && "animate-spin")} />
              {counts.inflight} in pipeline
            </span>
            {counts.failed > 0 && (
              <span className="pill-amber">{counts.failed} failed</span>
            )}
          </div>
        </div>

        <div className="grid items-center gap-4 md:grid-cols-[260px_1fr]">
          <div className="relative flex items-center justify-center">
            <ScanningOrb size={220} />
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {activeCandidate ? (
                <ActiveCard key={activeCandidate.id} c={activeCandidate} />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400"
                >
                  Drop a CV on the left to wake the agent.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6">
          <PipelineRail status={activeCandidate?.processingStatus ?? "UPLOADED"} />
        </div>
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Candidates forming</h3>
          {candidates.length > 0 && (
            <Link
              href="/candidates"
              className="text-xs text-violet-300 transition hover:text-violet-200"
            >
              Open candidate dashboard →
            </Link>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {candidates.length === 0 && (
              <p className="md:col-span-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
                Parsed candidates will appear here as the agent finishes each CV.
              </p>
            )}
            {candidates.map((c) => (
              <CandidateMiniCard key={c.id} c={c} />
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function PipelineRail({ status }: { status: CandidateStatus }) {
  const active = STAGE_INDEX[status] ?? 0;
  return (
    <div className="relative">
      <div className="absolute left-6 right-6 top-6 h-px bg-white/5" />
      <motion.div
        className="absolute left-6 top-6 h-px"
        initial={{ width: 0 }}
        animate={{
          width: `calc(${(active / (STAGES.length - 1)) * 100}% - 0px)`,
        }}
        transition={{ duration: 0.5 }}
        style={{
          background:
            "linear-gradient(90deg, rgba(139,92,246,0.6), rgba(34,211,238,0.6), rgba(52,211,153,0.6))",
          maxWidth: "calc(100% - 48px)",
        }}
      />
      <div className="relative grid grid-cols-6">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const reached = i <= active;
          const isActive = i === active && status !== "READY";
          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-full border transition",
                  reached
                    ? "border-violet-glow/40 bg-ink-800 text-violet-200"
                    : "border-white/10 bg-ink-900 text-slate-500",
                )}
              >
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: "0 0 30px rgba(139,92,246,0.45)",
                    }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
                <Icon className={cn("h-4 w-4 relative", reached && s.colour)} />
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] uppercase tracking-wider",
                  reached ? "text-slate-300" : "text-slate-500",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveCard({ c }: { c: CandidateLive }) {
  const skills = toArray<string>(c.primarySkills).slice(0, 6);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative rounded-2xl border border-violet-glow/20 bg-gradient-to-br from-violet-glow/[0.06] to-transparent p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar name={c.fullName ?? "?"} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-white">
            {c.fullName ?? "Identifying candidate…"}
          </div>
          <div className="text-xs text-slate-400">
            {[c.currentTitle, formatYears(c.yearsExperience)].filter(Boolean).join(" · ") ||
              "Reading CV…"}
          </div>
        </div>
        <StatusBadge status={c.processingStatus} />
      </div>
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <SkillChip key={s + i} label={s} index={i} />
          ))}
        </div>
      )}
      {c.aiConfidenceScore != null && (
        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
          <Database className="h-3 w-3" />
          AI confidence
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-glow to-emerald-glow"
              style={{ width: `${Math.round(c.aiConfidenceScore * 100)}%` }}
            />
          </div>
          <span className="text-slate-300">
            {Math.round(c.aiConfidenceScore * 100)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

function CandidateMiniCard({ c }: { c: CandidateLive }) {
  const ready = c.processingStatus === "READY";
  const skills = toArray<string>(c.primarySkills).slice(0, 3);
  const inner = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "relative rounded-xl border p-3 transition",
        ready
          ? "border-emerald-glow/20 bg-emerald-glow/[0.03] hover:border-emerald-glow/40"
          : "border-white/5 bg-white/[0.02]",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={c.fullName ?? "?"} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">
            {c.fullName ?? "Processing…"}
          </div>
          <div className="truncate text-[11px] text-slate-400">
            {[c.currentTitle, formatYears(c.yearsExperience)].filter(Boolean).join(" · ") ||
              "—"}
          </div>
        </div>
        <StatusBadge status={c.processingStatus} className="!text-[10px]" />
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <SkillChip key={s + i} label={s} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
  return ready ? (
    <Link href={`/candidates/${c.id}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
