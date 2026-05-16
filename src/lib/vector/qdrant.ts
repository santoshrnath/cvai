import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "@/lib/env";
import type {
  VectorRecord,
  VectorSearchFilter,
  VectorSearchHit,
  VectorService,
} from "./index";

export class QdrantVectorService implements VectorService {
  private client: QdrantClient;
  private collection = env.vector.collection();
  private ensured = false;

  constructor() {
    this.client = new QdrantClient({
      url: env.vector.qdrantUrl(),
      apiKey: env.vector.qdrantApiKey(),
    });
  }

  async ensureCollection(dimensions: number): Promise<void> {
    if (this.ensured) return;
    try {
      await this.client.getCollection(this.collection);
    } catch {
      await this.client.createCollection(this.collection, {
        vectors: { size: dimensions, distance: "Cosine" },
      });
    }
    // Useful payload indexes for filtering.
    const indexes = [
      { field: "tenantId", schema: "keyword" as const },
      { field: "candidateId", schema: "keyword" as const },
      { field: "skills", schema: "keyword" as const },
      { field: "yearsExperience", schema: "float" as const },
    ];
    for (const ix of indexes) {
      try {
        await this.client.createPayloadIndex(this.collection, {
          field_name: ix.field,
          field_schema: ix.schema,
        });
      } catch {
        // index probably already exists
      }
    }
    this.ensured = true;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.client.upsert(this.collection, {
      points: records.map((r) => ({
        id: r.id,
        vector: r.vector,
        payload: r.payload as unknown as Record<string, unknown>,
      })),
    });
  }

  async search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]> {
    const must: Record<string, unknown>[] = [
      { key: "tenantId", match: { value: opts.filter.tenantId } },
    ];
    if (opts.filter.candidateIds?.length) {
      must.push({ key: "candidateId", match: { any: opts.filter.candidateIds } });
    }
    if (opts.filter.skills?.length) {
      must.push({ key: "skills", match: { any: opts.filter.skills } });
    }
    if (opts.filter.minYears != null || opts.filter.maxYears != null) {
      const range: Record<string, number> = {};
      if (opts.filter.minYears != null) range.gte = opts.filter.minYears;
      if (opts.filter.maxYears != null) range.lte = opts.filter.maxYears;
      must.push({ key: "yearsExperience", range });
    }
    const res = await this.client.search(this.collection, {
      vector: opts.vector,
      limit: opts.limit,
      with_payload: true,
      filter: { must },
    });
    return res.map((r) => ({
      id: String(r.id),
      score: r.score ?? 0,
      payload: r.payload as unknown as VectorSearchHit["payload"],
    }));
  }

  async deleteByCandidate(tenantId: string, candidateId: string): Promise<void> {
    await this.client.delete(this.collection, {
      filter: {
        must: [
          { key: "tenantId", match: { value: tenantId } },
          { key: "candidateId", match: { value: candidateId } },
        ],
      },
    });
  }
}
