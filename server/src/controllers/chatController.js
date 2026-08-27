const chatService = require('../services/chatService');

class ChatController {
  async query(req, res, next) {
    try {
      const { query, conversationId, departmentFilter } = req.body;
      const result = await chatService.processQuery({
        query,
        conversationId,
        user: req.user,
        departmentFilter,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getConversations(req.user._id);
      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  async getConversationById(req, res, next) {
    try {
      const result = await chatService.getConversationById(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const result = await chatService.deleteConversation(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const { feedback, comment } = req.body;
      const result = await chatService.submitFeedback(req.params.chatLogId, feedback, comment, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        chatLog: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSuggestedQuestions(req, res, next) {
    try {
      const questions = await chatService.getSuggestedQuestions();
      res.status(200).json({
        success: true,
        questions,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChatController();
