// pgvector fallback. Not the primary path — kept minimal so the abstraction
// stays honest. Used when VECTOR_DB_PROVIDER=pgvector.
//
// Reuses the candidate.chunk table; vectors stored in a side table.

import { prisma } from "@/lib/prisma";
import type {
  VectorRecord,
  VectorSearchFilter,
  VectorSearchHit,
  VectorService,
} from "./index";

export class PgVectorService implements VectorService {
  private dim = 0;
  private ensured = false;

  async ensureCollection(dimensions: number): Promise<void> {
    if (this.ensured && this.dim === dimensions) return;
    this.dim = dimensions;
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "ChunkVector" (
         id TEXT PRIMARY KEY,
         tenant_id TEXT NOT NULL,
         candidate_id TEXT NOT NULL,
         document_id TEXT NOT NULL,
         payload JSONB NOT NULL,
         embedding vector(${dimensions})
       )`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS chunkvector_tenant_idx ON "ChunkVector" (tenant_id)`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS chunkvector_candidate_idx ON "ChunkVector" (candidate_id)`,
    );
    this.ensured = true;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      const vec = `[${r.vector.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ChunkVector" (id, tenant_id, candidate_id, document_id, payload, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, embedding = EXCLUDED.embedding`,
        r.id,
        r.payload.tenantId,
        r.payload.candidateId,
        r.payload.documentId,
        JSON.stringify(r.payload),
        vec,
      );
    }
  }

  async search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]> {
    const vec = `[${opts.vector.join(",")}]`;
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, payload, 1 - (embedding <=> $1::vector) AS score
         FROM "ChunkVector"
        WHERE tenant_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3`,
      vec,
      opts.filter.tenantId,
      opts.limit,
    )) as { id: string; payload: unknown; score: number }[];
    return rows.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as VectorSearchHit["payload"],
    }));
  }

  async deleteByCandidate(tenantId: string, candidateId: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "ChunkVector" WHERE tenant_id = $1 AND candidate_id = $2`,
      tenantId,
      candidateId,
    );
  }
}
