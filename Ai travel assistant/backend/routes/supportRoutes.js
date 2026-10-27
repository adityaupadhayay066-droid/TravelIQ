const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, adminProtect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
        cb(null, `${crypto.randomUUID()}${safeExt}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
            return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF documents are allowed.'), false);
        }
        cb(null, true);
    }
});

// User routes
router.post('/', protect, upload.array('attachments', 3), supportController.createTicket);
router.get('/', protect, supportController.getUserTickets);
router.get('/attachment/:filename', protect, supportController.getAttachment);
router.get('/:id', protect, supportController.getTicketDetails);
router.post('/:id/reply', protect, supportController.replyToTicket);

// Admin routes
router.get('/admin/all', protect, adminProtect, supportController.getAllTickets);
router.put('/admin/:id', protect, adminProtect, supportController.updateTicket);

module.exports = router;
