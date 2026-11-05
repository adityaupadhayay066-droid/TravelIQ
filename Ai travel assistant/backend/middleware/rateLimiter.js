const rateLimit = require('express-rate-limit');

// 3.5 minutes window in milliseconds (3-4 minutes)
const THREE_TO_FOUR_MINUTES_MS = 3.5 * 60 * 1000;

// Verified client IP extractor - binds to physical socket address unless behind trusted proxy
const getClientIp = (req) => {
    if (process.env.TRUST_PROXY === 'true') {
        return req.ip || req.socket?.remoteAddress || '127.0.0.1';
    }
    // Default: use socket address to prevent X-Forwarded-For spoofing and header rotation bypasses
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

// Optional bypass if explicitly disabled via environment variable
const shouldSkip = (req) => {
    return process.env.DISABLE_RATE_LIMIT === 'true';
};

// General API rate limiter (applied to /api)
const apiLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: process.env.NODE_ENV === 'production' ? 300 : 500,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many API requests. Please wait 3-4 minutes before trying again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Login limiter (prevents brute-force)
const loginLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 10, // 10 failed login attempts allowed in 3-4 minutes
    keyGenerator: getClientIp,
    skipSuccessfulRequests: true, // Successful logins are not counted
    message: { 
        success: false, 
        message: 'Too many failed login attempts. Please wait 3-4 minutes before trying again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Registration limiter
const registerLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 10,
    keyGenerator: getClientIp,
    skipSuccessfulRequests: true,
    message: { 
        success: false, 
        message: 'Too many registration attempts. Please wait 3-4 minutes before trying again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// OTP Limiter
const otpLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 8,
    keyGenerator: getClientIp,
    skipSuccessfulRequests: true,
    message: { 
        success: false, 
        message: 'Too many OTP requests. Please wait 3-4 minutes before requesting again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Profile Limiter (general profile read/update operations)
const profileLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 60,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many profile requests. Please slow down and try again in 3-4 minutes.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Sensitive Profile Actions Limiter (password change, avatar upload, deactivation, deletion)
const profileSensitiveLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 10,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many sensitive account modification attempts. Please try again in 3-4 minutes.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// AI & Chatbot Limiter (protects LLM tokens, embeddings, and RAG pipelines)
const aiLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 25,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many AI / Chatbot requests in a short window. Please wait 3-4 minutes.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Travel Search & Route Optimization Limiter
const travelLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 40,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many travel queries. Please wait 3-4 minutes before searching again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Payment & Checkout Limiter
const paymentLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 15,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many checkout transaction requests. Please wait 3-4 minutes before trying again.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// SOS Emergency Limiter
const sosLimiter = rateLimit({
    windowMs: THREE_TO_FOUR_MINUTES_MS, // ~3.5 minutes
    max: 10,
    keyGenerator: getClientIp,
    message: { 
        success: false, 
        message: 'Too many SOS emergency alerts triggered. Please contact authorities directly.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    otpLimiter,
    apiLimiter,
    profileLimiter,
    profileSensitiveLimiter,
    aiLimiter,
    travelLimiter,
    paymentLimiter,
    sosLimiter
};

