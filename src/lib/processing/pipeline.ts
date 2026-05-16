// CV processing pipeline (spec §37).
//
//   1. Persist original file
//   2. Extract text
//   3. Chunk (CV-aware)
//   4. Embed chunks
//   5. Upsert to vector DB
//   6. Claude parses metadata → candidate profile
//   7. Status: READY
//
// Each step updates Candidate.processingStatus so the frontend can animate
// the pipeline in real time. Failures are caught and recorded.

import { prisma } from "@/lib/prisma";
import { extractDocument } from "@/lib/documents/extractor";
import { chunkCv } from "@/lib/documents/chunker";
import { sha256 } from "@/lib/documents/checksum";
import { parseCvWithClaude } from "@/lib/ai/parse-cv";
import { getEmbeddings } from "@/lib/embeddings";
import { getVectorService, type VectorRecord } from "@/lib/vector";
import {
  getStorage,
  originalKey,
  chunksKey,
  textKey,
} from "@/lib/storage";

export interface PipelineInput {
  tenantId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface PipelineResult {
  candidateId: string;
  documentId: string;
  chunkCount: number;
  duplicate: boolean;
}

export async function processCv(input: PipelineInput): Promise<PipelineResult> {
  const checksum = sha256(input.buffer);

  // Duplicate detection: same tenant + same file hash.
  const existing = await prisma.candidateDocument.findFirst({
    where: { tenantId: input.tenantId, checksum },
    select: { candidateId: true, id: true },
  });
  if (existing) {
    await prisma.candidate.update({
      where: { id: existing.candidateId },
      data: { processingStatus: "DUPLICATE" },
    });
    return {
      candidateId: existing.candidateId,
      documentId: existing.id,
      chunkCount: 0,
      duplicate: true,
    };
  }

  // Stage 0: create candidate + document rows (status UPLOADED → QUEUED).
  const candidate = await prisma.candidate.create({
    data: {
      tenantId: input.tenantId,
      processingStatus: "UPLOADED",
    },
  });

  const storage = getStorage();
  const oKey = originalKey({
    tenantId: input.tenantId,
    candidateId: candidate.id,
    uploadId: candidate.id,
    fileName: input.fileName,
  });
  await storage.put({
    bucket: "originals",
    key: oKey,
    body: input.buffer,
    contentType: input.mimeType || "application/octet-stream",
  });

  const document = await prisma.candidateDocument.create({
    data: {
      tenantId: input.tenantId,
      candidateId: candidate.id,
      originalName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      storageKey: oKey,
      checksum,
    },
  });

  try {
    // Stage 1: EXTRACTING_TEXT
    await setStatus(candidate.id, "EXTRACTING_TEXT");
    const extracted = await extractDocument({
      buffer: input.buffer,
      fileName: input.fileName,
      mimeType: input.mimeType,
    });
    if (!extracted.text.trim()) {
      throw new Error("Empty text extracted from CV.");
    }
    const tKey = textKey({
      tenantId: input.tenantId,
      candidateId: candidate.id,
      documentId: document.id,
    });
    await storage.put({
      bucket: "chunks",
      key: tKey,
      body: Buffer.from(extracted.text, "utf8"),
      contentType: "text/plain",
    });
    await prisma.candidateDocument.update({
      where: { id: document.id },
      data: {
        textStorageKey: tKey,
        pageCount: extracted.pageCount ?? undefined,
      },
    });

    // Stage 2: CHUNKING
    await setStatus(candidate.id, "CHUNKING");
    const chunks = chunkCv(extracted.text);
    if (chunks.length === 0) throw new Error("Chunker produced 0 chunks.");
    const cKey = chunksKey({
      tenantId: input.tenantId,
      candidateId: candidate.id,
      documentId: document.id,
    });
    await storage.put({
      bucket: "chunks",
      key: cKey,
      body: Buffer.from(
        JSON.stringify(
          {
            documentId: document.id,
            candidateId: candidate.id,
            sourceFile: input.fileName,
            chunks,
          },
          null,
          2,
        ),
        "utf8",
      ),
      contentType: "application/json",
    });
    await prisma.candidateDocument.update({
      where: { id: document.id },
      data: { chunkStorageKey: cKey },
    });

    const chunkRows = await prisma.$transaction(
      chunks.map((c) =>
        prisma.candidateChunk.create({
          data: {
            tenantId: input.tenantId,
            candidateId: candidate.id,
            documentId: document.id,
            chunkIndex: c.chunkIndex,
            section: c.section,
            text: c.text,
            tokenCount: c.tokenCount,
          },
        }),
      ),
    );

    // Stage 3 + 4: EMBEDDING (parallel with metadata extraction below)
    await setStatus(candidate.id, "EMBEDDING");
    const embedder = await getEmbeddings();
    const vectors = await embedder.embed(chunks.map((c) => c.text));
    const dims = vectors[0]?.length ?? (await embedder.dimensions());

    const vectorSvc = await getVectorService();
    await vectorSvc.ensureCollection(dims);

    // Stage 5: ANALYSING (Claude metadata extraction)
    await setStatus(candidate.id, "ANALYSING");
    const parsed = await parseCvWithClaude(extracted.text);

    // Now upsert vectors with rich payload that includes the parsed skills.
    const records: VectorRecord[] = chunkRows.map((row, i) => ({
      id: row.id,
      vector: vectors[i]!,
      payload: {
        tenantId: input.tenantId,
        candidateId: candidate.id,
        documentId: document.id,
        chunkId: row.id,
        candidateName: parsed.fullName,
        section: row.section,
        page: row.pageNumber,
        sourceFile: input.fileName,
        skills: parsed.primarySkills.concat(parsed.secondarySkills).slice(0, 30),
        industries: parsed.industries,
        roles: parsed.currentTitle ? [parsed.currentTitle] : [],
        yearsExperience: parsed.yearsExperience,
        textPreview: chunks[i]!.text.slice(0, 400),
      },
    }));
    await vectorSvc.upsert(records);

    await prisma.$transaction(
      chunkRows.map((row) =>
        prisma.candidateChunk.update({
          where: { id: row.id },
          data: { vectorId: row.id },
        }),
      ),
    );

    // Persist candidate metadata + READY.
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        location: parsed.location,
        currentTitle: parsed.currentTitle,
        currentCompany: parsed.currentCompany,
        yearsExperience: parsed.yearsExperience,
        seniority: parsed.seniority,
        summary: parsed.summary,
        primarySkills: parsed.primarySkills,
        secondarySkills: parsed.secondarySkills,
        tools: parsed.tools,
        industries: parsed.industries,
        certifications: parsed.certifications,
        education: parsed.education,
        languages: parsed.languages,
        achievements: parsed.achievements,
        riskFlags: parsed.riskFlags,
        aiConfidenceScore: parsed.confidenceScore,
        processingStatus: "READY",
        processingError: null,
      },
    });

    return {
      candidateId: candidate.id,
      documentId: document.id,
      chunkCount: chunks.length,
      duplicate: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { processingStatus: "FAILED", processingError: message },
    });
    throw err;
  }
}

async function setStatus(
  candidateId: string,
  status:
    | "UPLOADED"
    | "QUEUED"
    | "EXTRACTING_TEXT"
    | "CHUNKING"
    | "EMBEDDING"
    | "ANALYSING"
    | "READY"
    | "FAILED",
) {
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { processingStatus: status },
  });
}
