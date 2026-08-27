const fs = require('fs');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Collection = require('../models/Collection');
const ingestionQueue = require('../queues/ingestionQueue');
const { getVectorStore } = require('../config/vectorStore');

class DocumentService {
  /**
   * Create document record and queue for ingestion
   */
  async createDocument({ title, file, ownerId, department = 'General', collectionTag = 'General' }) {
    const doc = await Document.create({
      title: title || file.originalname,
      originalFilename: file.originalname,
      storagePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      owner: ownerId,
      department: department || 'General',
      collectionTag: collectionTag || department || 'General',
      status: 'UPLOADED',
    });

    // If collectionTag maps to an existing Collection, add doc to collection
    try {
      await Collection.findOneAndUpdate(
        { department },
        { $addToSet: { documentIds: doc._id } }
      );
    } catch (err) {
      console.warn('Could not auto-add document to collection:', err.message);
    }

    // Add to ingestion queue
    await ingestionQueue.addJob(doc._id);

    return doc;
  }

  /**
   * List all documents with optional filters
   */
  async getAllDocuments(filters = {}) {
    const query = {};
    if (filters.department && filters.department !== 'All') {
      query.department = filters.department;
    }
    if (filters.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    return Document.find(query).populate('owner', 'name email').sort({ createdAt: -1 });
  }

  /**
   * Get single document by ID with chunk summary
   */
  async getDocumentById(id) {
    const doc = await Document.findById(id).populate('owner', 'name email');
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const chunkCount = await Chunk.countDocuments({ documentId: doc._id });
    const sampleChunks = await Chunk.find({ documentId: doc._id }).limit(5).select('pageNumber chunkIndex text');

    return {
      document: doc,
      chunkCount,
      sampleChunks,
    };
  }

  /**
   * Update document metadata
   */
  async updateDocument(id, updates = {}) {
    const allowed = ['title', 'department', 'collectionTag'];
    const sanitized = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }

    const doc = await Document.findByIdAndUpdate(id, sanitized, { new: true });
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // Update chunks metadata as well
    if (sanitized.department || sanitized.collectionTag || sanitized.title) {
      const chunkUpdates = {};
      if (sanitized.title) chunkUpdates['metadata.documentTitle'] = sanitized.title;
      if (sanitized.department) chunkUpdates['metadata.department'] = sanitized.department;
      if (sanitized.collectionTag) chunkUpdates['metadata.collectionTag'] = sanitized.collectionTag;
      await Chunk.updateMany({ documentId: doc._id }, { $set: chunkUpdates });
    }

    return doc;
  }

  /**
   * Reindex a document
   */
  async reindexDocument(id) {
    const doc = await Document.findById(id);
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    doc.status = 'UPLOADED';
    doc.version += 1;
    await doc.save();

    await ingestionQueue.addJob(doc._id);

    return { message: 'Document queued for re-indexing', document: doc };
  }

  /**
   * Delete document and all associated chunks and vectors
   */
  async deleteDocument(id) {
    const doc = await Document.findById(id);
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // 1. Delete vectors from vector store
    try {
      const vectorStore = getVectorStore();
      await vectorStore.deleteByDocumentId(doc._id);
    } catch (vecErr) {
      console.warn(`Vector store delete error for doc ${id}:`, vecErr.message);
    }

    // 2. Delete Chunks from MongoDB
    await Chunk.deleteMany({ documentId: doc._id });

    // 3. Remove from collections
    await Collection.updateMany(
      { documentIds: doc._id },
      { $pull: { documentIds: doc._id } }
    );

    // 4. Remove physical file if exists
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try {
        fs.unlinkSync(doc.storagePath);
      } catch (fErr) {
        console.warn('File delete warning:', fErr.message);
      }
    }

    // 5. Delete document record
    await Document.findByIdAndDelete(id);

    return { success: true, message: 'Document and vectors deleted successfully' };
  }
}

module.exports = new DocumentService();
