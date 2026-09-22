const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    adminLogin,
    adminVerifyOtp,
    registerAdmin,
    getCurrentUser,
    logoutUser,
    refreshSession,
    verify2FA,
    passkeyLoginChallenge,
    passkeyLoginVerify
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

router.post('/register', registerLimiter, validateRequest(schemas.register), registerUser);
router.post('/login', loginLimiter, validateRequest(schemas.login), loginUser);
router.post('/admin/login', loginLimiter, validateRequest(schemas.adminLogin), adminLogin);
router.post('/admin/register', registerLimiter, validateRequest(schemas.adminRegister), registerAdmin);
router.post('/refresh', refreshSession);

router.post('/verify-2fa', loginLimiter, verify2FA);
router.post('/admin/verify-2fa', loginLimiter, adminVerifyOtp);
router.post('/passkey/login-challenge', loginLimiter, passkeyLoginChallenge);
router.post('/passkey/login-verify', loginLimiter, passkeyLoginVerify);

router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
