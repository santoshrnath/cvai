"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Brain,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  Languages,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SkillChip } from "@/components/ui/skill-chip";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge, type CandidateStatus } from "@/components/ui/status-badge";
import { InterviewKitDialog } from "./interview-kit-dialog";
import { formatYears, toArray } from "@/lib/utils";

interface CandidateData {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  seniority: string | null;
  summary: string | null;
  primarySkills: unknown;
  secondarySkills: unknown;
  tools: unknown;
  industries: unknown;
  certifications: unknown;
  education: unknown;
  languages: unknown;
  achievements: unknown;
  riskFlags: unknown;
  aiConfidenceScore: number | null;
  processingStatus: CandidateStatus;
  documents: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number | null;
    uploadedAt: string | Date;
  }>;
  chunks: Array<{
    id: string;
    section: string | null;
    pageNumber: number | null;
    text: string;
    chunkIndex: number;
  }>;
}

export function CandidateProfile({
  candidate,
  sourceUrl,
}: {
  candidate: CandidateData;
  sourceUrl: string | null;
}) {
  const primary = toArray<string>(candidate.primarySkills);
  const secondary = toArray<string>(candidate.secondarySkills);
  const tools = toArray<string>(candidate.tools);
  const industries = toArray<string>(candidate.industries);
  const certifications = toArray<string>(candidate.certifications);
  const education = toArray<{ degree?: string; institution?: string; year?: string }>(
    candidate.education,
  );
  const languages = toArray<string>(candidate.languages);
  const achievements = toArray<string>(candidate.achievements);
  const riskFlags = toArray<string>(candidate.riskFlags);

  // Group chunks by section for the timeline.
  const sections = new Map<string, typeof candidate.chunks>();
  for (const c of candidate.chunks) {
    const key = c.section ?? "Other";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(c);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to candidates
      </Link>

      {/* Hero card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden !p-8"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.2),transparent_60%)]" />
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
          <Avatar name={candidate.fullName ?? "?"} size={96} />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={candidate.processingStatus} />
              {candidate.seniority && (
                <span className="pill-accent">{candidate.seniority}</span>
              )}
              {industries.slice(0, 2).map((i) => (
                <span key={i} className="pill">
                  {i}
                </span>
              ))}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {candidate.fullName ?? "Unnamed candidate"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {candidate.currentTitle && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {candidate.currentTitle}
                </span>
              )}
              {candidate.currentCompany && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {candidate.currentCompany}
                </span>
              )}
              {candidate.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {candidate.location}
                </span>
              )}
              <span>{formatYears(candidate.yearsExperience)} experience</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {candidate.aiConfidenceScore != null && (
              <ScoreRing
                score={Math.round(candidate.aiConfidenceScore * 100)}
                size={104}
                stroke={8}
                label="AI confidence"
                accent="violet"
              />
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <InterviewKitDialog
                candidateId={candidate.id}
                candidateName={candidate.fullName}
                primarySkills={primary}
              />
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  <ExternalLink className="h-4 w-4" />
                  Original CV
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr_320px]">
        {/* Left column — Skills & toolkit */}
        <div className="space-y-4">
          {primary.length > 0 && (
            <Panel title="Primary skills" icon={Sparkles}>
              <ChipList items={primary} accent />
            </Panel>
          )}
          {secondary.length > 0 && (
            <Panel title="Secondary skills" icon={Sparkles}>
              <ChipList items={secondary} />
            </Panel>
          )}
          {tools.length > 0 && (
            <Panel title="Tools & technologies" icon={Brain}>
              <ChipList items={tools} />
            </Panel>
          )}
          {industries.length > 0 && (
            <Panel title="Industries" icon={Building2}>
              <ChipList items={industries} />
            </Panel>
          )}
          {languages.length > 0 && (
            <Panel title="Languages" icon={Languages}>
              <ChipList items={languages} />
            </Panel>
          )}
        </div>

        {/* Center column — AI summary, experience timeline, achievements */}
        <div className="space-y-4">
          <Panel title="AI summary" icon={Brain}>
            <p className="text-sm leading-relaxed text-slate-300">
              {candidate.summary ?? "No summary extracted yet."}
            </p>
          </Panel>

          <Panel title="CV evidence by section" icon={Briefcase}>
            <div className="scrollbar-thin max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {Array.from(sections.entries()).map(([name, chunks]) => (
                <div
                  key={name}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-violet-300">{name}</span>
                    <span className="text-slate-500">{chunks.length} chunk{chunks.length === 1 ? "" : "s"}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 line-clamp-6 whitespace-pre-wrap">
                    {chunks
                      .map((c) => c.text)
                      .join("\n")
                      .slice(0, 1200)}
                  </p>
                </div>
              ))}
              {sections.size === 0 && (
                <p className="text-xs text-slate-500">No chunks indexed yet.</p>
              )}
            </div>
          </Panel>

          {achievements.length > 0 && (
            <Panel title="Achievements" icon={Lightbulb}>
              <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
                {achievements.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-glow" />
                    {a}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Right column — Education, certifications, source, risks */}
        <div className="space-y-4">
          {education.length > 0 && (
            <Panel title="Education" icon={GraduationCap}>
              <ul className="space-y-2 text-sm text-slate-300">
                {education.map((e, i) => (
                  <li key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                    <div className="font-medium text-white">{e.degree ?? "—"}</div>
                    <div className="text-xs text-slate-400">
                      {[e.institution, e.year].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {certifications.length > 0 && (
            <Panel title="Certifications" icon={Award}>
              <ChipList items={certifications} />
            </Panel>
          )}
          {candidate.documents.length > 0 && (
            <Panel title="Source documents" icon={Briefcase}>
              <ul className="space-y-2 text-xs">
                {candidate.documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2"
                  >
                    <span className="truncate text-slate-300">{d.originalName}</span>
                    <span className="ml-2 whitespace-nowrap text-slate-500">
                      {(d.sizeBytes / 1024).toFixed(0)} KB
                      {d.pageCount ? ` · ${d.pageCount}p` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {riskFlags.length > 0 && (
            <Panel title="Risk flags" icon={ShieldAlert} accent="amber">
              <ul className="space-y-1.5 text-xs leading-relaxed text-amber-200">
                {riskFlags.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  accent = "violet",
}: {
  title: string;
  icon: typeof Brain;
  children: React.ReactNode;
  accent?: "violet" | "amber";
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card !p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon
          className={
            accent === "amber" ? "h-4 w-4 text-amber-300" : "h-4 w-4 text-violet-300"
          }
        />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function ChipList({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <SkillChip key={s + i} label={s} matched={!!accent} index={i} />
      ))}
    </div>
  );
}
