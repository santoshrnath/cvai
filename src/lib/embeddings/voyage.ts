// Voyage AI embeddings. Anthropic's officially recommended embedding partner.
// Docs: https://docs.voyageai.com/reference/embeddings-api

import { env } from "@/lib/env";
import type { EmbeddingService } from "./index";

const ENDPOINT = "https://api.voyageai.com/v1/embeddings";

export class VoyageEmbeddings implements EmbeddingService {
  private model = env.embeddings.voyageModel();
  private apiKey() {
    const k = env.embeddings.voyageKey();
    if (!k) throw new Error("VOYAGE_API_KEY is not set");
    return k;
  }
  private dims: number | null = null;

  async dimensions(): Promise<number> {
    if (this.dims) return this.dims;
    const v = (await this.embed(["probe"]))[0];
    this.dims = v.length;
    return this.dims;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey()}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        input_type: "document",
      }),
    });
    if (!res.ok) {
      throw new Error(`Voyage embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return json.data.map((d) => d.embedding);
  }
}
