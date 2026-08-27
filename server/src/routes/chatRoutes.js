const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.use(verifyToken);

router.post(
  '/query',
  [
    body('query').trim().notEmpty().withMessage('Query text is required'),
    body('conversationId').optional().isString(),
    body('departmentFilter').optional().isString(),
    validateRequest,
  ],
  chatController.query
);

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversationById);
router.delete('/conversations/:id', chatController.deleteConversation);

router.post(
  '/:chatLogId/feedback',
  [
    body('feedback').isIn(['up', 'down', 'none']).withMessage('Feedback must be up, down, or none'),
    body('comment').optional().isString(),
    validateRequest,
  ],
  chatController.submitFeedback
);

router.get('/suggested-questions', chatController.getSuggestedQuestions);

module.exports = router;
