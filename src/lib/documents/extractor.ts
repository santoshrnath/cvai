// Extract plain text + page count from CV bytes. Supports PDF, DOCX, TXT.

export interface ExtractedDocument {
  text: string;
  pageCount: number | null;
  mimeType: string;
}

export async function extractDocument(opts: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}): Promise<ExtractedDocument> {
  const ext = opts.fileName.toLowerCase().split(".").pop();
  const mime = (opts.mimeType ?? "").toLowerCase();

  if (ext === "pdf" || mime === "application/pdf") {
    return extractPdf(opts.buffer);
  }
  if (
    ext === "docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocx(opts.buffer);
  }
  if (ext === "txt" || mime.startsWith("text/")) {
    return {
      text: opts.buffer.toString("utf8"),
      pageCount: null,
      mimeType: "text/plain",
    };
  }
  throw new Error(`Unsupported file type: ${opts.fileName} (${mime})`);
}

async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  // pdf-parse is CJS; dynamic import avoids ESM friction.
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const fn = mod.default ?? mod;
  const result = await fn(buffer);
  return {
    text: (result.text ?? "").replace(/\r\n/g, "\n").trim(),
    pageCount: result.numpages ?? null,
    mimeType: "application/pdf",
  };
}

async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const mammoth: any = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return {
    text: (value ?? "").replace(/\r\n/g, "\n").trim(),
    pageCount: null,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}
