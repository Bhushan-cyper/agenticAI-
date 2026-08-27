const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    type: {
      type: String,
      enum: ['INGESTION_SUCCESS', 'INGESTION_FAILED', 'LOW_CONFIDENCE_QUERY', 'NEGATIVE_FEEDBACK', 'SYSTEM_ALERT'],
      required: true,
    },
    title: {
      type: String,
      default: 'System Notification',
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
