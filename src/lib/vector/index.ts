// Vector-DB abstraction. Backends:
//   - "qdrant"   : Qdrant (production / Hetzner)
//   - "pgvector" : Postgres pgvector fallback (still useful for dev)
//
// Payload shape matches spec §12.

import { env } from "@/lib/env";

export interface VectorRecord {
  id: string;
  vector: number[];
  payload: VectorPayload;
}

export interface VectorPayload {
  tenantId: string;
  candidateId: string;
  documentId: string;
  chunkId: string;
  candidateName?: string | null;
  section?: string | null;
  page?: number | null;
  sourceFile?: string | null;
  skills?: string[];
  industries?: string[];
  roles?: string[];
  yearsExperience?: number | null;
  textPreview?: string;
}

export interface VectorSearchHit {
  id: string;
  score: number;
  payload: VectorPayload;
}

export interface VectorSearchFilter {
  /** Pin search to this tenant. Omit for super-admin cross-tenant search. */
  tenantId?: string;
  candidateIds?: string[];
  skills?: string[]; // any-of match
  minYears?: number;
  maxYears?: number;
}

export interface VectorService {
  ensureCollection(dimensions: number): Promise<void>;
  upsert(records: VectorRecord[]): Promise<void>;
  search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]>;
  deleteByCandidate(tenantId: string, candidateId: string): Promise<void>;
}

let _svc: VectorService | null = null;

export async function getVectorService(): Promise<VectorService> {
  if (_svc) return _svc;
  const provider = env.vector.provider();
  if (provider === "qdrant") {
    const { QdrantVectorService } = await import("./qdrant");
    _svc = new QdrantVectorService();
  } else {
    const { PgVectorService } = await import("./pgvector");
    _svc = new PgVectorService();
  }
  return _svc;
}
