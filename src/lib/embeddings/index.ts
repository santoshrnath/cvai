// Embedding-provider abstraction.
//
// Anthropic Claude does NOT expose an embedding model. Voyage AI is
// Anthropic's officially recommended embedding partner. We default to a
// local model so the repo clones-and-runs with zero extra API keys.

import { env } from "@/lib/env";

export interface EmbeddingService {
  dimensions(): Promise<number>;
  embed(texts: string[]): Promise<number[][]>;
}

let _svc: EmbeddingService | null = null;

export async function getEmbeddings(): Promise<EmbeddingService> {
  if (_svc) return _svc;
  const provider = env.embeddings.provider();
  if (provider === "voyage") {
    const { VoyageEmbeddings } = await import("./voyage");
    _svc = new VoyageEmbeddings();
  } else if (provider === "openai") {
    const { OpenAIEmbeddings } = await import("./openai");
    _svc = new OpenAIEmbeddings();
  } else {
    const { LocalEmbeddings } = await import("./local");
    _svc = new LocalEmbeddings();
  }
  return _svc;
}
