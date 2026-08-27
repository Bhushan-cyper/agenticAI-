const BaseVectorStore = require('./baseVectorStore');

class LocalFallbackStore extends BaseVectorStore {
  constructor() {
    super('local-fallback');
    this.vectors = new Map(); // id -> { id, values, metadata }
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
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

  async upsert(vectors = []) {
    let count = 0;
    for (const vec of vectors) {
      if (vec && vec.id && Array.isArray(vec.values)) {
        this.vectors.set(vec.id, {
          id: vec.id,
          values: vec.values,
          metadata: vec.metadata || {},
        });
        count++;
      }
    }
    return { upsertedCount: count };
  }

  async query(queryVector, topK = 5, filter = null, minScore = 0.0) {
    if (!queryVector || queryVector.length === 0) {
      return [];
    }

    const scored = [];

    for (const item of this.vectors.values()) {
      // Check filter if provided
      if (filter) {
        let match = true;
        for (const [key, val] of Object.entries(filter)) {
          if (val && item.metadata[key] !== val) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const score = this._cosineSimilarity(queryVector, item.values);
      if (score >= minScore) {
        scored.push({
          id: item.id,
          score: Math.min(1.0, Math.max(0.0, score)),
          metadata: item.metadata,
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  async deleteByDocumentId(documentId) {
    let deletedCount = 0;
    for (const [id, item] of this.vectors.entries()) {
      if (item.metadata && String(item.metadata.documentId) === String(documentId)) {
        this.vectors.delete(id);
        deletedCount++;
      }
    }
    return { deletedCount };
  }

  async healthCheck() {
    return {
      status: 'operational',
      provider: 'Local In-Memory Vector Store',
      totalVectors: this.vectors.size,
    };
  }

  async clear() {
    const total = this.vectors.size;
    this.vectors.clear();
    return { clearedCount: total };
  }
}

module.exports = LocalFallbackStore;
