// Use Claude to extract structured candidate metadata from raw CV text.
// Spec §13, §38.1. The system prompt forbids invented facts.

import { anthropic, MODEL, extractJson } from "@/lib/anthropic";

export interface ParsedCv {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  seniority: string | null;
  summary: string | null;
  primarySkills: string[];
  secondarySkills: string[];
  tools: string[];
  industries: string[];
  certifications: string[];
  education: Array<{ degree?: string; institution?: string; year?: string }>;
  languages: string[];
  achievements: string[];
  riskFlags: string[];
  confidenceScore: number;
}

const SYSTEM_PROMPT = `You are an expert CV parser and talent intelligence analyst.

Hard rules:
- Extract ONLY facts explicitly present in the CV text.
- Do NOT infer, guess, or invent missing information.
- If a value is not present, return null or an empty array — never make one up.
- Return STRICT JSON matching the schema. No markdown, no commentary.
- Do not score on protected characteristics (age, gender, religion, nationality, ethnicity, marital status).

Schema:
{
  "fullName": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "currentTitle": string | null,
  "currentCompany": string | null,
  "yearsExperience": number | null,
  "seniority": "Intern" | "Junior" | "Mid" | "Senior" | "Lead" | "Manager" | "Director" | "VP" | "C-level" | null,
  "summary": string | null,
  "primarySkills": string[],
  "secondarySkills": string[],
  "tools": string[],
  "industries": string[],
  "certifications": string[],
  "education": [{ "degree": string, "institution": string, "year": string }],
  "languages": string[],
  "achievements": string[],
  "riskFlags": string[],
  "confidenceScore": number (0..1)
}

confidenceScore reflects how confident you are in the extraction — lower if the CV is sparse, poorly formatted, or ambiguous.

riskFlags should call out only OBJECTIVE concerns that affect parsing quality: missing dates, unverifiable claims, conflicting years of experience, formatting issues. Never include subjective judgements about the candidate.`;

export async function parseCvWithClaude(cvText: string): Promise<ParsedCv> {
  const message = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Parse the following CV text into the JSON schema. Return ONLY the JSON object, no other text.\n\n<cv>\n${cvText.slice(0, 60_000)}\n</cv>`,
      },
    ],
  });

  const parsed = extractJson<Partial<ParsedCv>>(message);
  return {
    fullName: parsed.fullName ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    location: parsed.location ?? null,
    currentTitle: parsed.currentTitle ?? null,
    currentCompany: parsed.currentCompany ?? null,
    yearsExperience: parsed.yearsExperience ?? null,
    seniority: parsed.seniority ?? null,
    summary: parsed.summary ?? null,
    primarySkills: parsed.primarySkills ?? [],
    secondarySkills: parsed.secondarySkills ?? [],
    tools: parsed.tools ?? [],
    industries: parsed.industries ?? [],
    certifications: parsed.certifications ?? [],
    education: parsed.education ?? [],
    languages: parsed.languages ?? [],
    achievements: parsed.achievements ?? [],
    riskFlags: parsed.riskFlags ?? [],
    confidenceScore: clamp01(parsed.confidenceScore ?? 0.5),
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
