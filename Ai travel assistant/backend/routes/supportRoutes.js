const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

// Using multer for file uploads
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// User routes
router.post('/', protect, upload.array('attachments', 3), supportController.createTicket);
router.get('/', protect, supportController.getUserTickets);
router.get('/:id', protect, supportController.getTicketDetails);
router.post('/:id/reply', protect, supportController.replyToTicket);

// Admin routes
router.get('/admin/all', protect, adminProtect, supportController.getAllTickets);
router.put('/admin/:id', protect, adminProtect, supportController.updateTicket);

module.exports = router;
