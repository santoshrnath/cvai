"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Briefcase, FileText, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge, type CandidateStatus } from "@/components/ui/status-badge";
import { formatYears, toArray, cn } from "@/lib/utils";

interface CandidateLike {
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

interface Match {
  rank?: number;
  overallScore: number;
  whyMatch: string;
  gaps: string[];
  evidence: Array<{ chunkId: string; section: string | null; quote: string }>;
  breakdown: {
    skills: number;
    experience: number;
    domain: number;
    seniority: number;
    certifications: number;
  };
}

interface Props {
  candidate: CandidateLike;
  match?: Match;
  matchedSkills?: string[];
}

export function CandidateCard({ candidate, match, matchedSkills }: Props) {
  const skills = toArray<string>(candidate.primarySkills).slice(0, match ? 8 : 6);
  const matchedSet = new Set((matchedSkills ?? []).map((s) => s.toLowerCase()));

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-5 transition",
        match
          ? "border-violet-glow/30 shadow-glow"
          : "border-white/5 hover:border-white/15",
      )}
    >
      {match && (
        <span className="absolute right-4 top-4 rounded-full border border-violet-glow/40 bg-violet-glow/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">
          Match #{match.rank ?? "—"}
        </span>
      )}

      <div className="flex items-start gap-4">
        <Avatar name={candidate.fullName ?? "?"} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-lg font-semibold text-white">
                {candidate.fullName ?? "Unnamed candidate"}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {candidate.currentTitle && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {candidate.currentTitle}
                    {candidate.currentCompany && (
                      <span className="text-slate-500">@ {candidate.currentCompany}</span>
                    )}
                  </span>
                )}
                {candidate.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {candidate.location}
                  </span>
                )}
                <span>{formatYears(candidate.yearsExperience)} experience</span>
                {candidate.seniority && (
                  <span className="text-slate-500">· {candidate.seniority}</span>
                )}
              </div>
            </div>
            {match ? (
              <ScoreRing
                score={match.overallScore}
                size={64}
                stroke={6}
                label="match"
                accent={match.overallScore >= 80 ? "emerald" : match.overallScore >= 60 ? "violet" : "amber"}
              />
            ) : (
              <StatusBadge status={candidate.processingStatus as CandidateStatus} />
            )}
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <SkillChip
                  key={s + i}
                  label={s}
                  matched={matchedSet.has(s.toLowerCase())}
                  index={i}
                />
              ))}
            </div>
          )}

          {match && (
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-relaxed text-slate-300">
                {match.whyMatch}
              </p>

              <ScoreBreakdown breakdown={match.breakdown} />

              {match.evidence.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                    <FileText className="h-3 w-3" /> Evidence from CV
                  </div>
                  <ul className="space-y-1.5">
                    {match.evidence.slice(0, 2).map((e, i) => (
                      <li key={e.chunkId + i} className="text-xs leading-relaxed text-slate-300">
                        <span className="text-violet-300">{e.section ?? "—"}:</span>{" "}
                        <span className="text-slate-400">“{e.quote}”</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {match.gaps.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-200">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Gaps:</span>
                  {match.gaps.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-[10px]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div />
            <Link
              href={`/candidates/${candidate.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 opacity-0 transition group-hover:opacity-100"
            >
              View profile
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ScoreBreakdown({ breakdown }: { breakdown: Match["breakdown"] }) {
  const items = [
    { label: "Skills", value: breakdown.skills, weight: "35%" },
    { label: "Experience", value: breakdown.experience, weight: "25%" },
    { label: "Domain", value: breakdown.domain, weight: "15%" },
    { label: "Seniority", value: breakdown.seniority, weight: "10%" },
    { label: "Certifications", value: breakdown.certifications, weight: "5%" },
  ];
  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>{it.label}</span>
            <span className="text-slate-400">{it.value}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className={cn(
                "h-full rounded-full",
                it.value >= 75
                  ? "bg-emerald-glow"
                  : it.value >= 50
                    ? "bg-violet-glow"
                    : "bg-amber-400",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${it.value}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
