const embeddingService = require('../services/embeddingService');
const { getVectorStore } = require('../config/vectorStore');
const Chunk = require('../models/Chunk');
const env = require('../config/env');

class RetrievalAgent {
  /**
   * Retrieves relevant chunks for a user query
   * @param {string} query 
   * @param {object} options { topK, filter, minScore }
   * @returns {Promise<Array<{chunkId: string, score: number, text: string, metadata: object}>>}
   */
  async retrieve(query, options = {}) {
    const topK = options.topK || env.SIMILARITY_TOP_K || 5;
    const minScore = options.minScore !== undefined ? options.minScore : (env.SIMILARITY_THRESHOLD || 0.25);
    const filter = options.filter || null;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // 1. Generate Query Vector Embedding
    const queryVector = await embeddingService.embedText(query);

    // 2. Query Vector Store
    const vectorStore = getVectorStore();
    const matches = await vectorStore.query(queryVector, topK * 2, filter, minScore);

    if (!matches || matches.length === 0) {
      // Fallback: Try regex text match on Chunk collection if vector search was empty
      return this._keywordFallbackSearch(query, topK, filter);
    }

    // 3. Enrich matches with Mongo Chunk data if needed
    const enriched = [];
    for (const match of matches) {
      // Match ID format: doc_<docId>_chunk_<chunkIndex>
      let chunkDoc = null;
      if (match.id) {
        chunkDoc = await Chunk.findOne({ vectorId: match.id });
      }

      enriched.push({
        chunkId: chunkDoc ? chunkDoc._id : match.id,
        score: match.score,
        text: match.metadata?.text || (chunkDoc ? chunkDoc.text : ''),
        metadata: {
          documentId: match.metadata?.documentId || (chunkDoc ? chunkDoc.documentId : null),
          documentTitle: match.metadata?.documentTitle || (chunkDoc ? chunkDoc.metadata?.documentTitle : 'Campus Document'),
          pageNumber: match.metadata?.pageNumber || (chunkDoc ? chunkDoc.pageNumber : 1),
          chunkIndex: match.metadata?.chunkIndex || (chunkDoc ? chunkDoc.chunkIndex : 0),
          department: match.metadata?.department || (chunkDoc ? chunkDoc.metadata?.department : 'General'),
          collectionTag: match.metadata?.collectionTag || (chunkDoc ? chunkDoc.metadata?.collectionTag : 'General'),
        },
      });
    }

    // Sort by score descending and take topK
    enriched.sort((a, b) => b.score - a.score);
    return enriched.slice(0, topK);
  }

  /**
   * Keyword fallback search in Chunk collection
   */
  async _keywordFallbackSearch(query, topK = 5, filter = null) {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (!terms.length) return [];

    const regexArray = terms.map((t) => new RegExp(t, 'i'));
    const mongoQuery = { text: { $in: regexArray } };

    if (filter && filter.department) {
      mongoQuery['metadata.department'] = filter.department;
    }

    const chunks = await Chunk.find(mongoQuery).limit(topK);
    return chunks.map((c) => ({
      chunkId: c._id,
      score: 0.5, // Standard fallback confidence
      text: c.text,
      metadata: {
        documentId: c.documentId,
        documentTitle: c.metadata?.documentTitle || 'Campus Document',
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        department: c.metadata?.department || 'General',
        collectionTag: c.metadata?.collectionTag || 'General',
      },
    }));
  }
}

module.exports = new RetrievalAgent();
