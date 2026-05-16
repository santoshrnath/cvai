// Local-storage download proxy. Only used when STORAGE_PROVIDER=local — in
// production (S3) the storage service returns real signed URLs.

import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { bucket: string } },
) {
  const bucket = params.bucket === "originals" ? "originals" : "chunks";
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  try {
    const buf = await getStorage().get(key, bucket);
    const isPdf = key.toLowerCase().endsWith(".pdf");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage error" },
      { status: 404 },
    );
  }
}
