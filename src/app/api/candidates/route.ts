import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, tenantWhere } from "@/lib/auth-context";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);
  const status = url.searchParams.get("status");

  const where = {
    ...tenantWhere(ctx),
    ...(status ? { processingStatus: status as any } : {}),
  };
  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      fullName: true,
      currentTitle: true,
      currentCompany: true,
      location: true,
      yearsExperience: true,
      seniority: true,
      primarySkills: true,
      industries: true,
      processingStatus: true,
      aiConfidenceScore: true,
      createdAt: true,
    },
  });

  // Dashboard summary stats (spec §28)
  const scopeWhere = tenantWhere(ctx);
  const [total, byStatus] = await Promise.all([
    prisma.candidate.count({ where: scopeWhere }),
    prisma.candidate.groupBy({
      by: ["processingStatus"],
      where: scopeWhere,
      _count: { _all: true },
    }),
  ]);

  const ready = byStatus.find((s) => s.processingStatus === "READY")?._count._all ?? 0;
  const failed = byStatus.find((s) => s.processingStatus === "FAILED")?._count._all ?? 0;
  const inProgress = byStatus
    .filter((s) =>
      ["UPLOADED", "QUEUED", "EXTRACTING_TEXT", "CHUNKING", "EMBEDDING", "ANALYSING"].includes(
        s.processingStatus,
      ),
    )
    .reduce((sum, s) => sum + s._count._all, 0);

  // Top skills across all ready candidates.
  const skillCounts = new Map<string, number>();
  let totalExp = 0;
  let countExp = 0;
  for (const c of candidates) {
    if (Array.isArray(c.primarySkills)) {
      for (const s of c.primarySkills as string[]) {
        if (typeof s === "string" && s.trim()) {
          skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
        }
      }
    }
    if (typeof c.yearsExperience === "number") {
      totalExp += c.yearsExperience;
      countExp += 1;
    }
  }
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([skill, count]) => ({ skill, count }));

  const avgExperience = countExp > 0 ? totalExp / countExp : null;

  return NextResponse.json({
    candidates,
    stats: {
      total,
      ready,
      failed,
      inProgress,
      topSkills,
      avgExperience,
      // Expose to the client so the UI can show an admin badge.
      isSuperAdmin: ctx.isSuperAdmin,
    },
  });
}
