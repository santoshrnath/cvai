// Take a natural-language query (or role requirement), find matching CV
// chunks via vector search, then have Claude reason over the retrieved
// evidence to score and explain each candidate.
//
// Spec §14 (scoring components), §18 (semantic search), §38.2 (matching prompt).

import { anthropic, MODEL, extractJson } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { getEmbeddings } from "@/lib/embeddings";
import { getVectorService, type VectorSearchHit } from "@/lib/vector";

export interface MatchResult {
  candidateId: string;
  candidateName: string | null;
  currentTitle: string | null;
  location: string | null;
  yearsExperience: number | null;
  primarySkills: string[];
  overallScore: number; // 0..100
  scoreBreakdown: {
    skills: number;
    experience: number;
    domain: number;
    seniority: number;
    certifications: number;
  };
  matchedSkills: string[];
  whyMatch: string;
  gaps: string[];
  evidence: Array<{
    chunkId: string;
    section: string | null;
    quote: string;
  }>;
}

export interface MatchOptions {
  /** Pin search to this tenant. Omit for cross-tenant search (super admin). */
  tenantId?: string;
  query: string;
  limit?: number; // final candidate count
  topChunks?: number; // vector hits to retrieve
}

interface ChunkWithCandidate {
  chunk: VectorSearchHit;
  candidate: {
    id: string;
    fullName: string | null;
    currentTitle: string | null;
    location: string | null;
    yearsExperience: number | null;
    primarySkills: unknown;
    summary: string | null;
  };
}

export async function matchCandidates(
  opts: MatchOptions,
): Promise<MatchResult[]> {
  const limit = opts.limit ?? 5;
  const topChunks = opts.topChunks ?? 40;

  // 1. Embed the query and search the vector DB.
  const embedder = await getEmbeddings();
  const [queryVec] = await embedder.embed([opts.query]);
  const vector = await getVectorService();
  const hits = await vector.search({
    vector: queryVec,
    limit: topChunks,
    filter: { tenantId: opts.tenantId },
  });
  // tenantId is intentionally optional on the filter — undefined = all tenants.
  if (hits.length === 0) return [];

  // 2. Group hits by candidate, keep top-3 chunks per candidate as evidence.
  const byCandidate = new Map<string, VectorSearchHit[]>();
  for (const h of hits) {
    const id = h.payload.candidateId;
    if (!byCandidate.has(id)) byCandidate.set(id, []);
    byCandidate.get(id)!.push(h);
  }
  const candidateIds = Array.from(byCandidate.keys()).slice(0, limit * 2);

  // 3. Hydrate candidate metadata in one round-trip. Tenant pinning here
  //    mirrors the vector filter — omit it when admins search all tenants.
  const candidates = await prisma.candidate.findMany({
    where: opts.tenantId
      ? { id: { in: candidateIds }, tenantId: opts.tenantId }
      : { id: { in: candidateIds } },
    select: {
      id: true,
      fullName: true,
      currentTitle: true,
      location: true,
      yearsExperience: true,
      primarySkills: true,
      summary: true,
    },
  });
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  // 4. Build the per-candidate payload for Claude.
  const candidatePayload = Array.from(byCandidate.entries())
    .map(([id, chunks]) => {
      const cand = candidateMap.get(id);
      if (!cand) return null;
      return {
        candidateId: id,
        candidateName: cand.fullName,
        currentTitle: cand.currentTitle,
        location: cand.location,
        yearsExperience: cand.yearsExperience,
        primarySkills: cand.primarySkills ?? [],
        summary: cand.summary,
        evidenceChunks: chunks.slice(0, 3).map((c, i) => ({
          chunkId: c.payload.chunkId ?? c.id,
          section: c.payload.section ?? null,
          textPreview: c.payload.textPreview ?? "",
          similarity: round(c.score, 3),
        })),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (candidatePayload.length === 0) return [];

  // 5. Ask Claude to score + explain.
  const message = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Query: "${opts.query}"\n\nCandidates with retrieved CV evidence:\n\n${JSON.stringify(candidatePayload, null, 2)}\n\nScore and rank up to ${limit} candidates. Return ONLY the JSON array.`,
      },
    ],
  });

  const raw = extractJson<MatchResult[]>(message);
  return raw
    .filter((r) => r && typeof r.candidateId === "string")
    .slice(0, limit)
    .map(normalize);
}

const SYSTEM_PROMPT = `You are a talent matching analyst.

Hard rules:
- Use ONLY the provided CV evidence and candidate metadata.
- Do NOT invent skills or experience not supported by the evidence.
- If evidence is thin, the score MUST be lower and gaps MUST list what is missing.
- Never score on protected characteristics (age, gender, religion, nationality, ethnicity, marital status).
- Provide a clear explanation grounded in specific evidence quotes.

Scoring (0..100) components, weighted:
- skills (35%): how well primary/secondary skills match the query
- experience (25%): relevance + depth of work experience
- domain (15%): industry / domain alignment
- seniority (10%): seniority match
- certifications (5%): relevant certifications/education

The remaining 10% is implicit (recency, location, custom) — fold into the
relevant components above based on what the query asks for.

Output STRICT JSON array of objects:
[
  {
    "candidateId": string,
    "candidateName": string | null,
    "currentTitle": string | null,
    "location": string | null,
    "yearsExperience": number | null,
    "primarySkills": string[],
    "overallScore": number (0..100, integer),
    "scoreBreakdown": {
      "skills": number, "experience": number, "domain": number,
      "seniority": number, "certifications": number
    },
    "matchedSkills": string[],
    "whyMatch": string (2-3 sentences, cite specific evidence),
    "gaps": string[] (missing skills / unclear evidence),
    "evidence": [{ "chunkId": string, "section": string | null, "quote": string }]
  }
]

Quotes must be drawn from the textPreview of the candidate's evidence chunks.
Rank by overallScore descending. Return at most the requested number.`;

function normalize(r: MatchResult): MatchResult {
  const breakdown = r.scoreBreakdown ?? ({} as MatchResult["scoreBreakdown"]);
  return {
    ...r,
    overallScore: clamp(Math.round(r.overallScore ?? 0), 0, 100),
    scoreBreakdown: {
      skills: clamp(Math.round(breakdown.skills ?? 0), 0, 100),
      experience: clamp(Math.round(breakdown.experience ?? 0), 0, 100),
      domain: clamp(Math.round(breakdown.domain ?? 0), 0, 100),
      seniority: clamp(Math.round(breakdown.seniority ?? 0), 0, 100),
      certifications: clamp(Math.round(breakdown.certifications ?? 0), 0, 100),
    },
    matchedSkills: r.matchedSkills ?? [],
    gaps: r.gaps ?? [],
    evidence: r.evidence ?? [],
    primarySkills: r.primarySkills ?? [],
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round(n: number, p: number): number {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}
