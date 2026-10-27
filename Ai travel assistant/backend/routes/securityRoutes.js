const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const {
    getLoginHistory,
    getActiveSessions,
    revokeSession,
    toggle2FA,
    getTrustedDevices,
    removeTrustedDevice,
    getSecurityAlerts,
    resolveAlert,
    getUserSecuritySettings,
    updateRecoveryOptions,
    generateBackupCodes,
    registerPasskeyChallenge,
    verifyPasskeyRegister,
    removePasskeys,
    markDeviceAsTrusted,
    triggerSOS,
    getScrapingSecurityOverview,
    unblockScrapingIP
} = require('../controllers/securityController');

router.get('/login-history', protect, getLoginHistory);
router.get('/active-sessions', protect, getActiveSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);
router.post('/2fa/toggle', protect, toggle2FA);
router.get('/trusted-devices', protect, getTrustedDevices);
router.delete('/trusted-devices/:deviceId', protect, removeTrustedDevice);
router.post('/trusted-devices', protect, markDeviceAsTrusted);

router.get('/alerts', protect, getSecurityAlerts);
router.post('/alerts/:alertId/resolve', protect, resolveAlert);
router.post('/sos', protect, triggerSOS);

// Anti-Scraping / Bot Protection Controls (Admin authorization required)
router.get('/anti-scraping/stats', adminProtect, getScrapingSecurityOverview);
router.post('/anti-scraping/unblock', adminProtect, unblockScrapingIP);

router.get('/settings', protect, getUserSecuritySettings);
router.post('/recovery', protect, updateRecoveryOptions);
router.post('/recovery/backup-codes', protect, generateBackupCodes);

// Passkey WebAuthn registration
router.get('/passkey/register-challenge', protect, registerPasskeyChallenge);
router.post('/passkey/register-verify', protect, verifyPasskeyRegister);
router.delete('/passkey', protect, removePasskeys);

module.exports = router;
