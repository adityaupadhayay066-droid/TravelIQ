const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrganizationDetails,
  listApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  getUsageAnalytics,
  upgradeSubscription,
  initiateDeveloperPayment,
  verifyDeveloperPayment
} = require('../controllers/apiKeyController');

// All developer management routes require active user login session
router.use(protect);

router.get('/organization', getOrganizationDetails);
router.get('/keys', listApiKeys);
router.post('/keys', createApiKey);
router.put('/keys/:keyId', updateApiKey);
router.delete('/keys/:keyId', revokeApiKey);
router.get('/usage', getUsageAnalytics);
router.post('/subscribe', upgradeSubscription);
router.post('/payment/initiate', initiateDeveloperPayment);
router.post('/payment/verify', verifyDeveloperPayment);

module.exports = router;

