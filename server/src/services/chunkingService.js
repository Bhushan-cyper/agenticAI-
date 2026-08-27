const env = require('../config/env');

class ChunkingService {
  constructor() {
    this.defaultChunkSize = env.CHUNK_SIZE || 600;
    this.defaultOverlap = env.CHUNK_OVERLAP || 100;
    this.separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
  }

  /**
   * Estimates token count (approx 4 chars per token in English)
   */
  estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
  }

  /**
   * Recursively splits text into chunks under chunkSize with overlap
   */
  _splitText(text, chunkSize, chunkOverlap, separators = this.separators) {
    const finalChunks = [];
    if (!text || text.trim().length === 0) return finalChunks;

    const trimmed = text.trim();
    if (trimmed.length <= chunkSize) {
      return [trimmed];
    }

    // Find the best separator available
    let separator = separators[separators.length - 1];
    let newSeparators = [];
    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '') {
        separator = '';
        break;
      }
      if (trimmed.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator ? trimmed.split(separator) : trimmed.split('');
    let currentChunk = '';

    for (let i = 0; i < splits.length; i++) {
      const piece = splits[i];
      const pieceWithSep = currentChunk.length > 0 && separator ? separator + piece : piece;

      if ((currentChunk + pieceWithSep).length <= chunkSize) {
        currentChunk += pieceWithSep;
      } else {
        if (currentChunk.trim().length > 0) {
          finalChunks.push(currentChunk.trim());
        }

        // Handle overlap: take trailing part of currentChunk
        if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
          const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
          currentChunk = currentChunk.slice(overlapStart) + (separator ? separator + piece : piece);
        } else {
          currentChunk = piece;
        }

        // If a single piece is bigger than chunkSize, split it with deeper separators
        if (currentChunk.length > chunkSize && newSeparators.length > 0) {
          const subChunks = this._splitText(currentChunk, chunkSize, chunkOverlap, newSeparators);
          finalChunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1] || '';
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      finalChunks.push(currentChunk.trim());
    }

    return finalChunks;
  }

  /**
   * Chunks pages of a document while preserving pageNumber
   * @param {Array<{pageNumber: number, text: string}>} pages 
   * @param {object} options 
   * @returns {Array<{pageNumber: number, chunkIndex: number, text: string, charLength: number, tokenEstimate: number}>}
   */
  chunkDocumentPages(pages = [], options = {}) {
    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const chunkOverlap = options.chunkOverlap !== undefined ? options.chunkOverlap : this.defaultOverlap;

    const allChunks = [];
    let globalIndex = 0;

    for (const page of pages) {
      const pageNum = page.pageNumber || 1;
      const pageText = page.text || '';

      const textChunks = this._splitText(pageText, chunkSize, chunkOverlap);

      for (const text of textChunks) {
        if (text.length >= 20) { // Discard negligible fragments
          allChunks.push({
            pageNumber: pageNum,
            chunkIndex: globalIndex++,
            text,
            charLength: text.length,
            tokenEstimate: this.estimateTokens(text),
          });
        }
      }
    }

    return allChunks;
  }
}

module.exports = new ChunkingService();
