import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Gate for cost-bearing endpoints (Anthropic calls, vector upserts, etc.).
// Returns `null` if the visitor is signed in — handler proceeds.
// Returns a 401 JSON response if anonymous — handler should return it.
export async function requireSignedIn(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (userId) return null;
  return NextResponse.json(
    {
      error:
        "Sign in to use this feature. CV parsing, semantic search and interview-kit generation use Anthropic credits and are gated to signed-in users.",
      code: "auth_required",
    },
    { status: 401 },
  );
}
