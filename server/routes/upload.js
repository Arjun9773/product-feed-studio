const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

// ── Storage config ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/products');
    fs.mkdirSync(dir, { recursive: true }); 
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname);
    const unique   = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `product-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  },
});

// ── POST /api/upload-image ──────────────────────────────────
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Return public URL
  const url = `/uploads/products/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
