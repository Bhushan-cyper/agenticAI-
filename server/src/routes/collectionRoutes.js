const express = require('express');
const { body } = require('express-validator');
const collectionController = require('../controllers/collectionController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', collectionController.getAll);

router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Collection name is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    validateRequest,
  ],
  collectionController.create
);

router.put('/:id', requireAdmin, collectionController.update);
router.delete('/:id', requireAdmin, collectionController.delete);

module.exports = router;
