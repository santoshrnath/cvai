// CV-aware chunker (spec §11).
//
// Strategy:
//   1. Split the text into sections using a regex over canonical CV headings.
//   2. For each section, emit one chunk if short. If long, split further by
//      paragraph/list boundaries, ~400 tokens per chunk with ~80 token overlap.
//   3. Always carry the section heading on every chunk so context is preserved.
//
// Token count is approximated as words * 1.33 — good enough for chunk sizing.

export interface CvChunk {
  chunkId: string;
  chunkIndex: number;
  section: string;
  text: string;
  tokenCount: number;
  page?: number;
}

const SECTION_HEADINGS: { name: string; patterns: RegExp[] }[] = [
  {
    name: "Contact Information",
    patterns: [/^contact\b/i, /^personal details?\b/i],
  },
  {
    name: "Professional Summary",
    patterns: [
      /^professional summary\b/i,
      /^summary\b/i,
      /^profile\b/i,
      /^about( me)?\b/i,
      /^objective\b/i,
    ],
  },
  {
    name: "Skills",
    patterns: [
      /^(technical |core |key )?skills\b/i,
      /^expertise\b/i,
      /^competenc(ies|y)\b/i,
    ],
  },
  {
    name: "Tools and Technologies",
    patterns: [
      /^tools( (and|&) (technologies|tech))?\b/i,
      /^technologies\b/i,
      /^tech stack\b/i,
    ],
  },
  {
    name: "Work Experience",
    patterns: [
      /^(work |professional |career |employment )?experience\b/i,
      /^work history\b/i,
      /^employment( history)?\b/i,
    ],
  },
  {
    name: "Projects",
    patterns: [/^projects?\b/i, /^key projects?\b/i, /^project (highlights|experience)\b/i],
  },
  {
    name: "Education",
    patterns: [/^education\b/i, /^academic( background)?\b/i, /^qualifications?\b/i],
  },
  {
    name: "Certifications",
    patterns: [/^certifications?\b/i, /^accreditations?\b/i, /^licenses?\b/i],
  },
  {
    name: "Achievements",
    patterns: [/^achievements?\b/i, /^awards?\b/i, /^accomplishments?\b/i],
  },
  {
    name: "Languages",
    patterns: [/^languages?\b/i],
  },
  {
    name: "Publications",
    patterns: [/^publications?\b/i, /^papers?\b/i, /^research\b/i],
  },
];

const MAX_TOKENS = 450;
const OVERLAP_TOKENS = 80;

export function chunkCv(text: string): CvChunk[] {
  if (!text.trim()) return [];

  const sections = splitIntoSections(text);
  const chunks: CvChunk[] = [];
  let idx = 0;

  for (const section of sections) {
    const pieces = splitLargeSection(section.body);
    for (const piece of pieces) {
      const chunkText = `${section.name}\n\n${piece.trim()}`.trim();
      chunks.push({
        chunkId: `chunk_${String(idx).padStart(4, "0")}`,
        chunkIndex: idx,
        section: section.name,
        text: chunkText,
        tokenCount: approxTokens(chunkText),
      });
      idx += 1;
    }
  }

  return chunks;
}

interface Section {
  name: string;
  body: string;
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split(/\n+/).map((l) => l.trim());
  const sections: Section[] = [];
  let current: Section = { name: "Other", body: "" };

  for (const line of lines) {
    if (!line) continue;
    const matched = matchHeading(line);
    if (matched) {
      if (current.body.trim()) sections.push(current);
      current = { name: matched, body: "" };
    } else {
      current.body += line + "\n";
    }
  }
  if (current.body.trim()) sections.push(current);

  // Fold "Other" before any heading into Professional Summary if first.
  if (sections[0]?.name === "Other") {
    sections[0].name = "Professional Summary";
  }
  return sections;
}

function matchHeading(line: string): string | null {
  // Headings are typically short, often in caps, sometimes followed by ":".
  if (line.length > 60) return null;
  const cleaned = line.replace(/[:•\-–—]+\s*$/g, "").trim();
  for (const { name, patterns } of SECTION_HEADINGS) {
    if (patterns.some((p) => p.test(cleaned))) return name;
  }
  return null;
}

function splitLargeSection(body: string): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (approxTokens(trimmed) <= MAX_TOKENS) return [trimmed];

  // Split on blank-line paragraphs, then accumulate up to MAX_TOKENS each.
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buffer = "";
  let bufferTokens = 0;

  for (const p of paragraphs) {
    const pTokens = approxTokens(p);
    if (bufferTokens + pTokens > MAX_TOKENS && buffer) {
      out.push(buffer);
      // Carry tail of buffer as overlap.
      const tail = tailWords(buffer, OVERLAP_TOKENS);
      buffer = tail ? tail + "\n\n" + p : p;
      bufferTokens = approxTokens(buffer);
    } else {
      buffer = buffer ? buffer + "\n\n" + p : p;
      bufferTokens += pTokens;
    }
  }
  if (buffer) out.push(buffer);
  return out;
}

function approxTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.33);
}

function tailWords(text: string, approxTokenCount: number): string {
  const wordsTarget = Math.ceil(approxTokenCount / 1.33);
  const words = text.trim().split(/\s+/);
  return words.slice(-wordsTarget).join(" ");
}
