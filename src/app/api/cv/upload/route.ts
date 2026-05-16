import { NextRequest, NextResponse } from "next/server";
import { processCv } from "@/lib/processing/pipeline";
import { tenantFromRequest } from "@/lib/tenant";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const tenantId = tenantFromRequest(req);
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
          results.push({
            fileName: file.name,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }),
  );

  return NextResponse.json({ results });
}
