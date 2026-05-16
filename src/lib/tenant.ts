// Tenant resolution.
//
// - Signed-in via Clerk:  tenantId = Clerk user id (`user_xxx`)
// - Anonymous:            tenantId = "default" (the public demo pool)
//
// Every row in Candidate / CandidateDocument / CandidateChunk / etc. and
// every vector in Qdrant carries this tenantId. Postgres queries filter
// by it. Qdrant search filter pins it. This gives us real multi-tenant
// isolation the moment a user signs in.

import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const DEFAULT_TENANT = "default";

export async function tenantFromRequest(_req: NextRequest): Promise<string> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch {
    // auth() may throw in non-request contexts — fall through to default.
  }
  return DEFAULT_TENANT;
}

