// Storage abstraction. Two backends:
//   - "local" : ./storage-local (dev only)
//   - "s3"    : Hetzner Storage Box / any S3-compatible endpoint
//
// All callers go through `getStorage()` so we can swap freely at runtime.

import { env } from "@/lib/env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";

export interface StorageService {
  put(opts: PutOptions): Promise<PutResult>;
  get(key: string, bucket: BucketName): Promise<Buffer>;
  signedUrl(key: string, bucket: BucketName, expiresSeconds?: number): Promise<string>;
  delete(key: string, bucket: BucketName): Promise<void>;
}

export type BucketName = "originals" | "chunks";

export interface PutOptions {
  bucket: BucketName;
  key: string;
  body: Buffer;
  contentType: string;
}

export interface PutResult {
  key: string;
  bucket: BucketName;
  size: number;
}

let _storage: StorageService | null = null;

export function getStorage(): StorageService {
  if (_storage) return _storage;
  const provider = env.storage.provider();
  if (provider === "s3") {
    _storage = new S3Storage();
  } else {
    _storage = new LocalStorage();
  }
  return _storage;
}

// Standard key helpers (must match spec §10)
export function originalKey(opts: {
  tenantId: string;
  candidateId: string;
  uploadId: string;
  fileName: string;
}) {
  return `cv-originals/${opts.tenantId}/${opts.candidateId}/${opts.uploadId}/${opts.fileName}`;
}

export function chunksKey(opts: {
  tenantId: string;
  candidateId: string;
  documentId: string;
}) {
  return `cv-chunks/${opts.tenantId}/${opts.candidateId}/${opts.documentId}/chunks.json`;
}

export function textKey(opts: {
  tenantId: string;
  candidateId: string;
  documentId: string;
}) {
  return `cv-chunks/${opts.tenantId}/${opts.candidateId}/${opts.documentId}/text.txt`;
}
