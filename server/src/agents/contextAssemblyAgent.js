class ContextAssemblyAgent {
  /**
   * Assembles context from retrieved chunks and prepares citation metadata
   * @param {Array} retrievedChunks 
   * @param {number} maxTokensBudget 
   * @returns {{ contextText: string, sources: Array, averageConfidence: number, topConfidence: number }}
   */
  assemble(retrievedChunks = [], maxTokensBudget = 2500) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        contextText: '',
        sources: [],
        averageConfidence: 0,
        topConfidence: 0,
      };
    }

    // Deduplicate identical or near-identical text
    const seenTexts = new Set();
    const uniqueChunks = [];

    for (const chunk of retrievedChunks) {
      const normalized = chunk.text.trim().toLowerCase().slice(0, 100);
      if (!seenTexts.has(normalized)) {
        seenTexts.add(normalized);
        uniqueChunks.push(chunk);
      }
    }

    let currentTokens = 0;
    const includedChunks = [];
    const sources = [];

    for (const chunk of uniqueChunks) {
      const estimatedTokens = Math.ceil(chunk.text.length / 4);
      if (currentTokens + estimatedTokens > maxTokensBudget) {
        break;
      }

      includedChunks.push(chunk);
      currentTokens += estimatedTokens;

      // Extract a representative snippet (up to 200 chars)
      const snippet = chunk.text.replace(/\s+/g, ' ').slice(0, 220) + (chunk.text.length > 220 ? '...' : '');

      sources.push({
        documentId: chunk.metadata?.documentId,
        documentTitle: chunk.metadata?.documentTitle || 'Campus Document',
        pageNumber: chunk.metadata?.pageNumber || 1,
        chunkIndex: chunk.metadata?.chunkIndex || 0,
        department: chunk.metadata?.department || 'General',
        collectionTag: chunk.metadata?.collectionTag || 'General',
        score: Math.round(chunk.score * 100) / 100,
        snippet,
      });
    }

    // Build markdown structured context string
    const contextBlocks = includedChunks.map((chunk, idx) => {
      const meta = chunk.metadata || {};
      return `--- CONTEXT SOURCE [${idx + 1}]: "${meta.documentTitle}" (Page ${meta.pageNumber}, Dept: ${meta.department}) ---\n${chunk.text}\n`;
    });

    const contextText = contextBlocks.join('\n');

    const scores = includedChunks.map((c) => c.score);
    const topConfidence = scores.length > 0 ? Math.max(...scores) : 0;
    const averageConfidence = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      contextText,
      sources,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      topConfidence: Math.round(topConfidence * 100) / 100,
      chunkCount: includedChunks.length,
    };
  }
}

module.exports = new ContextAssemblyAgent();
