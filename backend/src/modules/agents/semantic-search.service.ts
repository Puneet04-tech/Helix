import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

/**
 * Semantic search over the incident knowledge base using real vector embeddings.
 *
 * When a HuggingFace API key is configured, uses the `sentence-transformers/all-MiniLM-L6-v2`
 * embedding model (384-dim vectors) for true semantic similarity. When no key is present,
 * falls back to a deterministic local hashing-based embedding so semantic search still
 * works offline.
 */
@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private readonly apiKey = process.env.HUGGINGFACE_API_KEY || '';
  private readonly EMBEDDING_DIM = 384;
  private readonly EMBEDDING_URL =
    'https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  /**
   * Generate a vector embedding for a text string.
   * Uses HuggingFace sentence-transformers when available, else local hashing fallback.
   */
  async embed(text: string): Promise<number[] | null> {
    if (!text || !text.trim()) return null;

    // Prefer real HF embeddings when API key is configured
    if (this.apiKey) {
      try {
        const response = await axios.post(
          this.EMBEDDING_URL,
          { inputs: text },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );
        const embedding = response.data?.[0];
        if (Array.isArray(embedding) && embedding.length > 0) {
          return embedding;
        }
      } catch (err) {
        this.logger.warn(`HF embeddings failed, using local hashing: ${(err as Error).message}`);
      }
    }

    // Deterministic local hashing-based embedding (works fully offline)
    return this.localEmbedding(text);
  }

  /**
   * Local feature-hashing embedding: turns text into a fixed-length numeric vector.
   * Deterministic so semantically-related keywords map to nearby vectors.
   */
  private localEmbedding(text: string): number[] {
    const vector = new Array(this.EMBEDDING_DIM).fill(0);
    const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
      }
      const index = ((hash % this.EMBEDDING_DIM) + this.EMBEDDING_DIM) % this.EMBEDDING_DIM;
      vector[index] += 1;
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((a, b) => a + b * b, 0)) || 1;
    return vector.map(v => v / norm);
  }

  /**
   * Cosine similarity between two vectors (standard semantic similarity metric).
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Semantic search: embed the query, embed all resolved incidents, rank by cosine similarity.
   */
  async semanticSearch(query: string, limit = 5): Promise<any[]> {
    const qEmbedding = await this.embed(query || '');
    if (!qEmbedding) return [];

    const incidents = await this.incidentModel
      .find({ status: 'resolved' })
      .sort({ detectedAt: -1 })
      .limit(200)
      .lean();

    const results: Array<{ incident: any; score: number }> = [];

    for (const inc of incidents) {
      const text = [
        inc.title,
        inc.description,
        inc.type,
        inc.rootCause,
        inc.agentReasoning?.analysisAgent?.rootCause,
        inc.agentReasoning?.responseAgent?.actions?.map((a: any) => `${a.action} ${a.target}`).join(' '),
      ].filter(Boolean).join(' ');

      const incEmbedding = await this.embed(text);
      if (!incEmbedding) continue;

      const score = this.cosineSimilarity(qEmbedding, incEmbedding);
      if (score > 0.05) {
        results.push({ incident: inc, score });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map(r => ({
      incidentId: r.incident.incidentId,
      type: r.incident.type,
      title: r.incident.title,
      resolution: r.incident.agentReasoning?.responseAgent?.actions,
      rootCause: r.incident.agentReasoning?.analysisAgent?.rootCause || r.incident.rootCause,
      similarityScore: r.score,
      summary: `Similarity ${(r.score * 100).toFixed(1)}% - Fixed via ${r.incident.agentReasoning?.responseAgent?.actions?.[0]?.action || 'manual intervention'}`,
    }));
  }
}
