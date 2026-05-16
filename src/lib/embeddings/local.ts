// Local embeddings via @xenova/transformers. Downloads the model on first
// run (~30MB for MiniLM). No API key required — ideal for showcase repos.

import { env } from "@/lib/env";
import type { EmbeddingService } from "./index";

type Pipeline = (text: string, opts?: any) => Promise<{ data: Float32Array }>;

export class LocalEmbeddings implements EmbeddingService {
  private model = env.embeddings.model();
  private pipelinePromise: Promise<Pipeline> | null = null;
  private dims: number | null = null;

  private async pipeline(): Promise<Pipeline> {
    if (this.pipelinePromise) return this.pipelinePromise;
    this.pipelinePromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const p = (await pipeline("feature-extraction", this.model)) as unknown as Pipeline;
      return p;
    })();
    return this.pipelinePromise;
  }

  async dimensions(): Promise<number> {
    if (this.dims) return this.dims;
    const vec = (await this.embed(["probe"]))[0];
    this.dims = vec.length;
    return this.dims;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const p = await this.pipeline();
    const out: number[][] = [];
    for (const t of texts) {
      const result = await p(t, { pooling: "mean", normalize: true });
      out.push(Array.from(result.data));
    }
    return out;
  }
}
