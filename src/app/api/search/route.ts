import { NextRequest, NextResponse } from "next/server";
import { matchCandidates } from "@/lib/ai/match-candidates";
import { tenantFromRequest } from "@/lib/tenant";
import { requireSignedIn } from "@/lib/require-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  const tenantId = await tenantFromRequest(req);
  let body: { query?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  const limit = Math.min(Math.max(Number(body.limit ?? 5), 1), 20);

  const results = await matchCandidates({ tenantId, query, limit });
  return NextResponse.json({ query, results });
}
