const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/overview', analyticsController.getOverview);

module.exports = router;
