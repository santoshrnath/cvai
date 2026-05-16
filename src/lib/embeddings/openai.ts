// OpenAI embeddings — optional fallback provider.

import { env } from "@/lib/env";
import type { EmbeddingService } from "./index";

const ENDPOINT = "https://api.openai.com/v1/embeddings";

export class OpenAIEmbeddings implements EmbeddingService {
  private model = env.embeddings.openaiModel();
  private apiKey() {
    const k = env.embeddings.openaiKey();
    if (!k) throw new Error("OPENAI_API_KEY is not set");
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
      body: JSON.stringify({ input: texts, model: this.model }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return json.data.map((d) => d.embedding);
  }
}
