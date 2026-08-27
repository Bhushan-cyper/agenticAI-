const Conversation = require('../models/Conversation');
const ChatLog = require('../models/ChatLog');
const Notification = require('../models/Notification');
const ragService = require('./ragService');
const { streamAnswerToken, streamAnswerComplete, emitNotification } = require('../config/socket');

class ChatService {
  /**
   * List conversations for a user
   */
  async getConversations(userId) {
    return Conversation.find({ owner: userId }).sort({ lastMessageAt: -1 });
  }

  /**
   * Get single conversation with full message turn history
   */
  async getConversationById(conversationId, userId) {
    const conv = await Conversation.findOne({ _id: conversationId, owner: userId });
    if (!conv) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const messages = await ChatLog.find({ conversationId }).sort({ createdAt: 1 });

    return {
      conversation: conv,
      messages,
    };
  }

  /**
   * Delete a conversation and its turns
   */
  async deleteConversation(conversationId, userId) {
    const conv = await Conversation.findOneAndDelete({ _id: conversationId, owner: userId });
    if (!conv) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    await ChatLog.deleteMany({ conversationId });
    return { success: true, message: 'Conversation deleted' };
  }

  /**
   * Execute chat query and handle streaming or standard response
   */
  async processQuery({ query, conversationId, user, departmentFilter = 'All' }) {
    let conv;
    if (conversationId) {
      conv = await Conversation.findOne({ _id: conversationId, owner: user._id });
    }

    if (!conv) {
      // Create new conversation with title derived from query
      const title = query.slice(0, 45) + (query.length > 45 ? '...' : '');
      conv = await Conversation.create({
        owner: user._id,
        title,
        departmentFilter: departmentFilter || 'All',
      });
    }

    // Fetch previous messages for context history
    const previousLogs = await ChatLog.find({ conversationId: conv._id })
      .sort({ createdAt: -1 })
      .limit(6);

    const history = [];
    // Oldest to newest
    previousLogs.reverse().forEach((log) => {
      history.push({ role: 'user', content: log.query });
      history.push({ role: 'assistant', content: log.answer });
    });

    // Execute RAG pipeline with socket streaming callback
    const result = await ragService.executePipeline({
      query,
      conversationId: conv._id,
      user,
      departmentFilter: departmentFilter || conv.departmentFilter,
      history,
      onTokenCallback: (token) => {
        streamAnswerToken(conv._id.toString(), token);
      },
    });

    // Stream complete event
    streamAnswerComplete(conv._id.toString(), {
      conversationId: conv._id,
      chatLogId: result.chatLogId,
      answer: result.answer,
      sources: result.sources,
      confidenceScore: result.confidenceScore,
      latencyMs: result.latencyMs,
      providerUsed: result.providerUsed,
      ragPipeline: result.ragPipeline,
      isGrounded: result.isGrounded,
    });

    return {
      conversationId: conv._id,
      ...result,
    };
  }

  /**
   * Submit 👍 / 👎 feedback on a turn
   */
  async submitFeedback(chatLogId, feedback, comment = '', userId = null) {
    const log = await ChatLog.findById(chatLogId);
    if (!log) {
      const err = new Error('Chat log not found');
      err.statusCode = 404;
      throw err;
    }

    log.feedback = feedback;
    log.feedbackComment = comment || '';
    await log.save();

    // If negative feedback, alert admins
    if (feedback === 'down') {
      const notification = await Notification.create({
        type: 'NEGATIVE_FEEDBACK',
        title: 'Negative Feedback on Chat Answer',
        message: `A student gave a thumbs down to query: "${log.query}" (Comment: ${comment || 'None'})`,
        metadata: {
          chatLogId: log._id,
          query: log.query,
          answer: log.answer,
          comment,
        },
      });
      emitNotification(notification);
    }

    return log;
  }

  /**
   * Suggested questions for empty state / shortcuts
   */
  async getSuggestedQuestions() {
    return [
      {
        category: 'Admissions',
        department: 'Admissions',
        question: 'What is the eligibility criteria and application deadline for B.Tech CSE?',
      },
      {
        category: 'Hostel & Campus',
        department: 'Hostel',
        question: 'What are the hostel mess timings, curfew rules, and laundry facilities?',
      },
      {
        category: 'Placements',
        department: 'Placements',
        question: 'What was the highest and average placement package last year?',
      },
      {
        category: 'Fees & Scholarships',
        department: 'Accounts',
        question: 'Are there merit-based scholarships available for first-year students?',
      },
      {
        category: 'Academic Calendar',
        department: 'Academics',
        question: 'When do the mid-semester exams and winter vacations begin?',
      },
      {
        category: 'Library & Clubs',
        department: 'Library',
        question: 'How many books can a student borrow at a time and what are library hours?',
      },
    ];
  }
}

module.exports = new ChatService();
