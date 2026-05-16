// Centralised env access. Reads at runtime so values can change between
// deploys without recompiling. Use the helpers below from server code only.

function get(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function required(name: string): string {
  const v = get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  anthropic: {
    apiKey: () => required("ANTHROPIC_API_KEY"),
    model: () => get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6",
  },
  db: {
    url: () => required("DATABASE_URL"),
  },
  vector: {
    provider: () =>
      (get("VECTOR_DB_PROVIDER") ?? "qdrant") as "qdrant" | "pgvector",
    qdrantUrl: () => get("QDRANT_URL") ?? "http://localhost:6333",
    qdrantApiKey: () => get("QDRANT_API_KEY"),
    collection: () => get("QDRANT_COLLECTION") ?? "cv_chunks",
  },
  storage: {
    provider: () => (get("STORAGE_PROVIDER") ?? "local") as "s3" | "local",
    s3Endpoint: () => get("S3_ENDPOINT"),
    s3Region: () => get("S3_REGION") ?? "fsn1",
    s3AccessKeyId: () => get("S3_ACCESS_KEY_ID"),
    s3SecretAccessKey: () => get("S3_SECRET_ACCESS_KEY"),
    bucketOriginals: () => get("S3_BUCKET_CV_ORIGINALS") ?? "cv-originals",
    bucketChunks: () => get("S3_BUCKET_CV_CHUNKS") ?? "cv-chunks",
    forcePathStyle: () => (get("S3_FORCE_PATH_STYLE") ?? "true") === "true",
  },
  embeddings: {
    provider: () =>
      (get("EMBEDDING_PROVIDER") ?? "local") as "local" | "voyage" | "openai",
    model: () => get("EMBEDDING_MODEL") ?? "Xenova/all-MiniLM-L6-v2",
    voyageKey: () => get("VOYAGE_API_KEY"),
    voyageModel: () => get("VOYAGE_MODEL") ?? "voyage-3-lite",
    openaiKey: () => get("OPENAI_API_KEY"),
    openaiModel: () => get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small",
  },
  uploads: {
    maxSizeMb: () => Number(get("MAX_UPLOAD_SIZE_MB") ?? "25"),
  },
};
