const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    vectorId: {
      type: String,
      required: true,
      index: true,
    },
    embeddingModel: {
      type: String,
      default: 'local-tfidf',
    },
    metadata: {
      documentTitle: String,
      department: String,
      collectionTag: String,
      charLength: Number,
      tokenEstimate: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chunk', ChunkSchema);
