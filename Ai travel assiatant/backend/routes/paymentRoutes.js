const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTransaction, getReceiptPDF } = require('../controllers/paymentController');

// Secure checkout routes
router.use(protect);

router.post('/transaction', createTransaction);
router.get('/ticket/:bookingId/pdf', getReceiptPDF);

module.exports = router;
