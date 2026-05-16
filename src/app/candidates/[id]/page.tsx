import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { CandidateProfile } from "@/components/profile/candidate-profile";
import { getAuthContext, tenantWhere } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getAuthContext();
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, ...tenantWhere(ctx) },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      chunks: {
        orderBy: { chunkIndex: "asc" },
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
  if (!candidate) return notFound();

  // Sign the original-document URL (S3) or fall back to local proxy.
  const doc = candidate.documents[0];
  let sourceUrl: string | null = null;
  if (doc) {
    try {
      sourceUrl = await getStorage().signedUrl(doc.storageKey, "originals");
    } catch {
      sourceUrl = null;
    }
  }

  // Strip raw chunk text from the wire — pages can be heavy. The component
  // gets section summaries + section headings; full text shown on demand.
  return <CandidateProfile candidate={candidate as any} sourceUrl={sourceUrl} />;
}
