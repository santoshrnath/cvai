import { promises as fs } from "fs";
import path from "path";
import type { BucketName, PutOptions, PutResult, StorageService } from "./index";

const ROOT = path.resolve(process.cwd(), "storage-local");

function bucketDir(bucket: BucketName) {
  return path.join(ROOT, bucket === "originals" ? "cv-originals" : "cv-chunks");
}

export class LocalStorage implements StorageService {
  async put(opts: PutOptions): Promise<PutResult> {
    const full = path.join(bucketDir(opts.bucket), opts.key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, opts.body);
    return { key: opts.key, bucket: opts.bucket, size: opts.body.length };
  }

  async get(key: string, bucket: BucketName): Promise<Buffer> {
    const full = path.join(bucketDir(bucket), key);
    return fs.readFile(full);
  }

  async signedUrl(key: string, bucket: BucketName): Promise<string> {
    // Local backend has no signing — return an app route that streams the file.
    const which = bucket === "originals" ? "originals" : "chunks";
    return `/api/storage/${which}?key=${encodeURIComponent(key)}`;
  }

  async delete(key: string, bucket: BucketName): Promise<void> {
    const full = path.join(bucketDir(bucket), key);
    await fs.rm(full, { force: true });
  }
}
