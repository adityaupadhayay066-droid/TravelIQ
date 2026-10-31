const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { 
  createOrder, 
  createTransaction, 
  handlePaymentWebhook, 
  processRefund, 
  getPaymentStatus, 
  getReceiptPDF 
} = require('../controllers/paymentController');

// Webhook endpoint: Called by Payment Gateway servers (authenticated via HMAC signature)
router.post('/webhook', handlePaymentWebhook);

// User-facing checkout and ticket operations (Authenticated & rate-limited)
router.post('/order', protect, paymentLimiter, createOrder);
router.post('/transaction', protect, paymentLimiter, createTransaction);
router.post('/refund', protect, paymentLimiter, processRefund);
router.get('/status/:bookingId', protect, paymentLimiter, getPaymentStatus);
router.get('/ticket/:bookingId/pdf', protect, paymentLimiter, getReceiptPDF);

module.exports = router;
