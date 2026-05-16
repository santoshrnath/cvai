"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, X, Loader2, Sparkles } from "lucide-react";
import type { InterviewKit } from "@/lib/ai/interview-kit";

const TYPE_TONES: Record<InterviewKit["questions"][number]["type"], string> = {
  technical: "border-violet-glow/30 bg-violet-glow/10 text-violet-200",
  behavioural: "border-cyan-glow/30 bg-cyan-glow/10 text-cyan-200",
  scenario: "border-emerald-glow/30 bg-emerald-glow/10 text-emerald-200",
  "cv-validation": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "red-flag": "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export function InterviewKitDialog({
  candidateId,
  candidateName,
  primarySkills,
}: {
  candidateId: string;
  candidateName: string | null;
  primarySkills: string[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [roleTitle, setRoleTitle] = useState(() =>
    primarySkills[0] ? `${primarySkills[0]} role` : "Role",
  );

  async function generate() {
    setLoading(true);
    setKit(null);
    try {
      const res = await fetch("/api/interview-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, roleTitle }),
      });
      const json = (await res.json()) as { kit?: InterviewKit; error?: string };
      if (json.kit) setKit(json.kit);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Wand2 className="h-4 w-4" />
        Generate interview kit
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-md p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="glass-strong relative max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-1">
                <span className="pill-accent">
                  <Sparkles className="h-3 w-3" /> Powered by Claude Sonnet 4.6
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-white">
                  Interview kit for {candidateName ?? "this candidate"}
                </h3>
                <p className="text-sm text-slate-400">
                  Grounded in the candidate's CV evidence and the target role.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Role title (e.g. Senior BI Engineer)"
                  className="flex-1 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-glow/50 focus:outline-none"
                />
                <button onClick={generate} disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" /> Generate
                    </>
                  )}
                </button>
              </div>

              {kit && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 space-y-4"
                >
                  <p className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
                    {kit.roleSummary}
                  </p>

                  <div className="space-y-2">
                    {kit.questions.map((q, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_TONES[q.type]}`}
                          >
                            {q.type.replace("-", " ")}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Q{i + 1}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{q.question}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Look for:</span>{" "}
                          {q.lookFor}
                        </p>
                        {q.cvEvidence && (
                          <p className="mt-1 text-xs italic text-violet-200">
                            CV evidence: {q.cvEvidence}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {kit.rubric.length > 0 && (
                    <div className="rounded-xl border border-emerald-glow/20 bg-emerald-glow/[0.04] p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-emerald-300">
                        Scoring rubric
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {kit.rubric.map((r, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-glow" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {!kit && !loading && (
                <p className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-xs text-slate-500">
                  Enter a role title and click Generate. Claude will produce 6-10
                  questions grounded in this candidate's CV.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
