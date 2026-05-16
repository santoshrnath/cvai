import { NextRequest, NextResponse } from "next/server";
import { processCv } from "@/lib/processing/pipeline";
import { tenantFromRequest } from "@/lib/tenant";
import { requireSignedIn } from "@/lib/require-auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  const tenantId = await tenantFromRequest(req);
  const maxMb = env.uploads.maxSizeMb();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const results: Array<{
    fileName: string;
    ok: boolean;
    candidateId?: string;
    documentId?: string;
    chunkCount?: number;
    duplicate?: boolean;
    error?: string;
  }> = [];

  // Process in parallel with a small concurrency limit to avoid hammering Claude.
  const queue = [...files];
  const concurrency = 2;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const file = queue.shift();
        if (!file) break;
        if (file.size > maxMb * 1024 * 1024) {
          results.push({
            fileName: file.name,
            ok: false,
            error: `File exceeds ${maxMb}MB limit`,
          });
          continue;
        }
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const r = await processCv({
            tenantId,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            buffer,
          });
          results.push({
            fileName: file.name,
            ok: true,
            candidateId: r.candidateId,
            documentId: r.documentId,
            chunkCount: r.chunkCount,
            duplicate: r.duplicate,
          });
        } catch (err) {
          // Log the full stack server-side so docker compose logs has it,
          // and return a more informative message to the client.
          console.error(`[upload] ${file.name} failed:`, err);
          const message =
            err instanceof Error
              ? `${err.constructor.name}: ${err.message}`
              : String(err);
          results.push({ fileName: file.name, ok: false, error: message });
        }
      }
    }),
  );

  return NextResponse.json({ results });
}
