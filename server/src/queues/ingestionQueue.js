const ingestionAgent = require('../agents/ingestionAgent');

class IngestionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.activeJob = null;
  }

  /**
   * Add a document ingestion task to queue
   * @param {string} documentId 
   */
  async addJob(documentId) {
    this.queue.push(documentId);
    console.log(`📥 Added document ${documentId} to ingestion queue (Queue size: ${this.queue.length})`);
    this._processNext();
  }

  async _processNext() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const documentId = this.queue.shift();
    this.activeJob = documentId;

    try {
      console.log(`⚙️ Processing ingestion job for document: ${documentId}`);
      await ingestionAgent.processDocument(documentId);
      console.log(`✅ Completed ingestion job for document: ${documentId}`);
    } catch (err) {
      console.error(`❌ Ingestion job failed for document ${documentId}:`, err);
    } finally {
      this.activeJob = null;
      this.processing = false;
      // Process next in queue
      if (this.queue.length > 0) {
        setImmediate(() => this._processNext());
      }
    }
  }

  getQueueStatus() {
    return {
      activeJob: this.activeJob,
      isProcessing: this.processing,
      pendingCount: this.queue.length,
    };
  }
}

module.exports = new IngestionQueue();
