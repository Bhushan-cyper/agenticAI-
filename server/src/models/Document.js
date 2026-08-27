const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    collectionTag: {
      type: String,
      default: 'General',
      trim: true,
    },
    status: {
      type: String,
      enum: ['UPLOADED', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'INDEXED', 'FAILED'],
      default: 'UPLOADED',
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    errorReason: {
      type: String,
      default: null,
    },
    isOcrProcessed: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
