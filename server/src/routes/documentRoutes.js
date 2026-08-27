const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, TXT, MD, and image files are supported for document upload.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter,
});

// All document routes require authentication
router.use(verifyToken);

// Read routes accessible to authenticated users (admin/student)
router.get('/', documentController.getAll);
router.get('/:id', documentController.getById);

// Admin-only mutation routes
router.post('/', requireAdmin, upload.single('file'), documentController.upload);
router.put('/:id', requireAdmin, documentController.update);
router.post('/:id/reindex', requireAdmin, documentController.reindex);
router.delete('/:id', requireAdmin, documentController.delete);

module.exports = router;
