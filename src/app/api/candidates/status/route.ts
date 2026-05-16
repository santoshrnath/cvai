// Lightweight polling endpoint — returns the live processing status for a
// list of candidate IDs. Used by the Live Scan Center to animate the pipeline.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tenantId = await tenantFromRequest(req);
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ statuses: [] });
  }
  const ids = idsParam.split(",").filter(Boolean).slice(0, 200);
  const candidates = await prisma.candidate.findMany({
    where: { id: { in: ids }, tenantId },
    select: {
      id: true,
      fullName: true,
      processingStatus: true,
      processingError: true,
      yearsExperience: true,
      primarySkills: true,
      currentTitle: true,
      aiConfidenceScore: true,
    },
  });
  return NextResponse.json({ statuses: candidates });
}
