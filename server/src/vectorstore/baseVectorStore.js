/**
 * Base Abstract Vector Store Interface
 * All vector store implementations (Pinecone, Local In-Memory, etc.) must implement these methods.
 */
class BaseVectorStore {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Upsert an array of vector records
   * @param {Array<{id: string, values: number[], metadata: object}>} vectors 
   * @returns {Promise<{upsertedCount: number}>}
   */
  async upsert(vectors) {
    throw new Error('Method upsert() must be implemented by subclass');
  }

  /**
   * Query vectors by similarity
   * @param {number[]} queryVector 
   * @param {number} topK 
   * @param {object} [filter] 
   * @param {number} [minScore] 
   * @returns {Promise<Array<{id: string, score: number, metadata: object}>>}
   */
  async query(queryVector, topK = 5, filter = null, minScore = 0.0) {
    throw new Error('Method query() must be implemented by subclass');
  }

  /**
   * Delete all vectors belonging to a specific document
   * @param {string} documentId 
   * @returns {Promise<{deletedCount: number}>}
   */
  async deleteByDocumentId(documentId) {
    throw new Error('Method deleteByDocumentId() must be implemented by subclass');
  }

  /**
   * Health check and stats
   * @returns {Promise<{status: string, provider: string, totalVectors?: number}>}
   */
  async healthCheck() {
    throw new Error('Method healthCheck() must be implemented by subclass');
  }

  /**
   * Clear all records
   */
  async clear() {
    throw new Error('Method clear() must be implemented by subclass');
  }
}

module.exports = BaseVectorStore;
