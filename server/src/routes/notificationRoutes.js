const express = require('express');
const notificationController = require('../controllers/notificationController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/', notificationController.getAll);
router.put('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
