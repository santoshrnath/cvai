import { NextRequest, NextResponse } from "next/server";
import { generateInterviewKit } from "@/lib/ai/interview-kit";
import { prisma } from "@/lib/prisma";
import { getAuthContext, tenantWhere } from "@/lib/auth-context";
import { requireSignedIn } from "@/lib/require-auth";
import { toArray } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  const ctx = await getAuthContext();
  let body: { candidateId?: string; roleTitle?: string; roleDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const candidateId = body.candidateId;
  const roleTitle = (body.roleTitle ?? "").trim() || "General role";
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, ...tenantWhere(ctx) },
    include: {
      chunks: { orderBy: { chunkIndex: "asc" }, take: 12 },
    },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const kit = await generateInterviewKit({
    candidateId: candidate.id,
    candidateName: candidate.fullName,
    candidateSummary: candidate.summary,
    primarySkills: toArray<string>(candidate.primarySkills),
    yearsExperience: candidate.yearsExperience,
    roleTitle,
    roleDescription: body.roleDescription,
    evidence: candidate.chunks.map((c) => ({
      section: c.section,
      text: c.text.slice(0, 800),
    })),
  });
  return NextResponse.json({ kit });
}
