// Generate role-specific interview questions grounded in CV evidence.
// Spec §21, §38.3.

import { anthropic, MODEL, extractJson } from "@/lib/anthropic";

export interface InterviewKit {
  candidateId: string;
  roleSummary: string;
  questions: Array<{
    type: "technical" | "behavioural" | "scenario" | "cv-validation" | "red-flag";
    question: string;
    purpose: string;
    lookFor: string;
    cvEvidence?: string;
  }>;
  rubric: string[];
}

const SYSTEM_PROMPT = `You are an interview designer.

Generate role-specific interview questions grounded in BOTH the candidate's CV evidence and the target role.

Hard rules:
- Each question must connect to either the role requirement or specific CV evidence.
- Never ask about protected characteristics.
- "cv-validation" questions probe specific claims in the CV.
- "red-flag" questions surface gaps or risks identified in the candidate metadata.
- For each question, explain what the interviewer should look for in a strong answer.

Return STRICT JSON:
{
  "roleSummary": string,
  "questions": [
    {
      "type": "technical" | "behavioural" | "scenario" | "cv-validation" | "red-flag",
      "question": string,
      "purpose": string,
      "lookFor": string,
      "cvEvidence": string | null
    }
  ],
  "rubric": string[] (3-5 scoring rubric items)
}

Generate 6-10 questions, mix the types thoughtfully (at least 2 technical, 2 behavioural/scenario, 1-2 cv-validation).`;

export async function generateInterviewKit(opts: {
  candidateId: string;
  candidateName: string | null;
  candidateSummary: string | null;
  primarySkills: string[];
  yearsExperience: number | null;
  roleTitle: string;
  roleDescription?: string;
  evidence: Array<{ section: string | null; text: string }>;
}): Promise<InterviewKit> {
  const message = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Role: ${opts.roleTitle}\n${opts.roleDescription ?? ""}\n\nCandidate: ${opts.candidateName ?? "(unnamed)"}\nExperience: ${opts.yearsExperience ?? "unknown"} years\nPrimary skills: ${opts.primarySkills.join(", ")}\nSummary: ${opts.candidateSummary ?? "(not provided)"}\n\nCV evidence:\n${opts.evidence.map((e, i) => `[${i + 1}] (${e.section ?? "—"}) ${e.text}`).join("\n\n")}\n\nReturn ONLY the JSON.`,
      },
    ],
  });

  const parsed = extractJson<Omit<InterviewKit, "candidateId">>(message);
  return { candidateId: opts.candidateId, ...parsed };
}
