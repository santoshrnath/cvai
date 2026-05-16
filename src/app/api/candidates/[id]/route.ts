import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tenantFromRequest } from "@/lib/tenant";
import { getStorage } from "@/lib/storage";
import { getVectorService } from "@/lib/vector";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const tenantId = await tenantFromRequest(req);
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, tenantId },
    include: {
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      chunks: {
        orderBy: { chunkIndex: "asc" },
        take: 50,
        select: {
          id: true,
          section: true,
          pageNumber: true,
          text: true,
          chunkIndex: true,
        },
      },
    },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Signed URL for the original document.
  const storage = getStorage();
  const doc = candidate.documents[0];
  const sourceUrl = doc ? await storage.signedUrl(doc.storageKey, "originals") : null;

  return NextResponse.json({ candidate, sourceUrl });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const tenantId = await tenantFromRequest(req);
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, tenantId },
    include: { documents: true },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from vector DB first.
  try {
    const vec = await getVectorService();
    await vec.deleteByCandidate(tenantId, candidate.id);
  } catch {
    // best-effort
  }

  // Delete storage objects.
  const storage = getStorage();
  for (const d of candidate.documents) {
    await storage.delete(d.storageKey, "originals").catch(() => {});
    if (d.textStorageKey) await storage.delete(d.textStorageKey, "chunks").catch(() => {});
    if (d.chunkStorageKey) await storage.delete(d.chunkStorageKey, "chunks").catch(() => {});
  }

  // Cascade deletes via Prisma relations.
  await prisma.candidate.delete({ where: { id: candidate.id } });
  return NextResponse.json({ ok: true });
}
