const ChatLog = require('../models/ChatLog');
const Conversation = require('../models/Conversation');

class LoggingAgent {
  /**
   * Log an entire chat interaction turn
   */
  async logTurn({
    conversationId,
    owner,
    query,
    retrievedChunkIds = [],
    similarityScores = [],
    answer,
    sources = [],
    confidenceScore = 0.0,
    latencyMs = 0,
    isGrounded = true,
    providerUsed = 'extractive-synthesizer',
    ragPipeline = 'available',
  }) {
    try {
      const chatLog = await ChatLog.create({
        conversationId,
        owner,
        query,
        retrievedChunkIds,
        similarityScores,
        answer,
        sources,
        confidenceScore,
        latencyMs,
        isGrounded,
        providerUsed,
        ragPipeline,
        feedback: 'none',
      });

      // Update conversation lastMessageAt
      if (conversationId) {
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessageAt: new Date(),
        });
      }

      return chatLog;
    } catch (err) {
      console.error('⚠️ LoggingAgent failed to save ChatLog:', err.message);
      return null;
    }
  }
}

module.exports = new LoggingAgent();
