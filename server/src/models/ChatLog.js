const mongoose = require('mongoose');

const SourceItemSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    documentTitle: String,
    pageNumber: Number,
    chunkIndex: Number,
    collectionTag: String,
    department: String,
    score: Number,
    snippet: String,
  },
  { _id: false }
);

const ChatLogSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    retrievedChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chunk',
      },
    ],
    similarityScores: [
      {
        type: Number,
      },
    ],
    answer: {
      type: String,
      required: true,
    },
    sources: [SourceItemSchema],
    confidenceScore: {
      type: Number,
      default: 0.0,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      enum: ['up', 'down', 'none'],
      default: 'none',
    },
    feedbackComment: {
      type: String,
      default: '',
    },
    isGrounded: {
      type: Boolean,
      default: true,
    },
    providerUsed: {
      type: String,
      default: 'extractive-synthesizer',
    },
    ragPipeline: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatLog', ChatLogSchema);
