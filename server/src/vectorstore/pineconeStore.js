const BaseVectorStore = require('./baseVectorStore');
const env = require('../config/env');

class PineconeStore extends BaseVectorStore {
  constructor() {
    super('pinecone');
    this.client = null;
    this.index = null;
    this.initialized = false;
  }

  async _init() {
    if (this.initialized) return;
    try {
      const { Pinecone } = require('@pinecone-database/pinecone');
      this.client = new Pinecone({
        apiKey: env.PINECONE_API_KEY,
      });
      this.index = this.client.index(env.PINECONE_INDEX);
      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize Pinecone client:', err.message);
      throw err;
    }
  }

  async upsert(vectors = []) {
    await this._init();
    if (!vectors.length) return { upsertedCount: 0 };

    // Format for Pinecone
    const records = vectors.map((v) => ({
      id: v.id,
      values: v.values,
      metadata: v.metadata || {},
    }));

    // Batch upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.index.upsert(batch);
    }

    return { upsertedCount: records.length };
  }

  async query(queryVector, topK = 5, filter = null, minScore = 0.0) {
    await this._init();
    const queryOptions = {
      vector: queryVector,
      topK,
      includeMetadata: true,
    };

    if (filter && Object.keys(filter).length > 0) {
      queryOptions.filter = filter;
    }

    const response = await this.index.query(queryOptions);

    const matches = (response.matches || [])
      .filter((m) => m.score >= minScore)
      .map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata || {},
      }));

    return matches;
  }

  async deleteByDocumentId(documentId) {
    await this._init();
    try {
      // Pinecone metadata filter deletion
      await this.index.deleteMany({
        filter: { documentId: { $eq: String(documentId) } },
      });
      return { success: true };
    } catch (err) {
      console.warn(`Pinecone deleteMany by filter failed (${err.message}). Trying ID prefix delete.`);
      return { success: false, error: err.message };
    }
  }

  async healthCheck() {
    try {
      await this._init();
      const stats = await this.index.describeIndexStats();
      return {
        status: 'operational',
        provider: 'Pinecone Hosted Vector Store',
        totalVectors: stats.totalRecordCount || 0,
        dimension: stats.dimension,
      };
    } catch (err) {
      return {
        status: 'degraded',
        provider: 'Pinecone Hosted Vector Store',
        error: err.message,
      };
    }
  }

  async clear() {
    await this._init();
    await this.index.deleteAll();
    return { success: true };
  }
}

module.exports = PineconeStore;
