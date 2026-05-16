"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Status =
  | "UPLOADED"
  | "QUEUED"
  | "EXTRACTING_TEXT"
  | "CHUNKING"
  | "EMBEDDING"
  | "ANALYSING"
  | "READY"
  | "FAILED"
  | "DUPLICATE"
  | "NEEDS_REVIEW";

const labels: Record<Status, string> = {
  UPLOADED: "Uploaded",
  QUEUED: "Queued",
  EXTRACTING_TEXT: "Extracting",
  CHUNKING: "Chunking",
  EMBEDDING: "Embedding",
  ANALYSING: "Analysing",
  READY: "Ready",
  FAILED: "Failed",
  DUPLICATE: "Duplicate",
  NEEDS_REVIEW: "Needs review",
};

const tones: Record<Status, string> = {
  UPLOADED: "border-white/10 bg-white/5 text-slate-300",
  QUEUED: "border-white/10 bg-white/5 text-slate-300",
  EXTRACTING_TEXT: "border-cyan-glow/30 bg-cyan-glow/10 text-cyan-200",
  CHUNKING: "border-cyan-glow/30 bg-cyan-glow/10 text-cyan-200",
  EMBEDDING: "border-violet-glow/30 bg-violet-glow/10 text-violet-200",
  ANALYSING: "border-violet-glow/30 bg-violet-glow/10 text-violet-200",
  READY: "border-emerald-glow/30 bg-emerald-glow/10 text-emerald-200",
  FAILED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  DUPLICATE: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  NEEDS_REVIEW: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

const isLive = (s: Status) =>
  s === "EXTRACTING_TEXT" || s === "CHUNKING" || s === "EMBEDDING" || s === "ANALYSING";

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[status],
        className,
      )}
    >
      {isLive(status) ? (
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {labels[status]}
    </span>
  );
}

export type CandidateStatus = Status;
