import fs from "fs";
import path from "path";
// Embeddings are imported dynamically within upsert/query to make stubbing easier in tests

import { scrubPII } from "./pii";

const STORAGE_DIR = path.resolve(process.cwd(), ".ai_vectors");
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

export interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  meta?: Record<string, unknown>;
}

export class FileVectorStore {
  basePath: string;

  constructor(private providerConfig?: any) {
    this.basePath = STORAGE_DIR;
  }

  private fileForCompany(companyId: string) {
    return path.join(this.basePath, `${companyId}.json`);
  }

  private async read(companyId: string): Promise<VectorEntry[]> {
    const file = this.fileForCompany(companyId);
    if (!fs.existsSync(file)) return [];
    try {
      const raw = fs.readFileSync(file, "utf8");
      return JSON.parse(raw) as VectorEntry[];
    } catch (err) {
      console.warn("VectorStore read failed", err);
      return [];
    }
  }

  private async write(companyId: string, docs: VectorEntry[]) {
    const file = this.fileForCompany(companyId);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
  }

  async upsert(
    companyId: string,
    docs: { id: string; text: string; meta?: Record<string, unknown> }[]
  ) {
    const existing = await this.read(companyId);

    // Scrub PII from texts before embedding/storage
    const scrubbedTexts = docs.map((d) => scrubPII(d.text));

    // dynamic import for embeddings so tests can stub easily
    const { callEmbeddings } = await import("./model-client");
    const embeddings = await callEmbeddings(scrubbedTexts, this.providerConfig);

    const mapping: Record<string, VectorEntry> = {};
    for (const e of existing) mapping[e.id] = e;

    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      mapping[d.id] = {
        id: d.id,
        text: scrubbedTexts[i],
        embedding: embeddings[i],
        meta: d.meta || {},
      };
    }

    const out = Object.values(mapping);
    await this.write(companyId, out);
  }

  // naive cosine similarity search
  private cosine(a: number[], b: number[]) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  async query(companyId: string, queryText: string, topK = 5) {
    const entries = await this.read(companyId);
    if (!entries || entries.length === 0) return [];
    const { callEmbeddings } = await import("./model-client");
    const qEmb = (
      await callEmbeddings([scrubPII(queryText)], this.providerConfig)
    )[0];
    const scored = entries.map((e) => ({
      entry: e,
      score: this.cosine(e.embedding, qEmb),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => ({
      id: s.entry.id,
      text: s.entry.text,
      score: s.score,
      meta: s.entry.meta,
    }));
  }
}

// singleton for easy import
export const vectorStore = new FileVectorStore();
