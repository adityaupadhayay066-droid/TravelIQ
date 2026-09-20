const rateLimit = require('express-rate-limit');

// Helper to determine if the request is from a local development environment
const isLocalOrDev = (req) => {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        return true;
    }
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
};

// General API rate limiter (generous for active frontend sessions)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
    message: { message: 'Too many API requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalOrDev(req),
});

// Login limiter (prevents brute-force while allowing legitimate users & admins)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 30 : 1000,
    skipSuccessfulRequests: true, // Do not count successful logins
    message: { message: 'Too many login attempts. Please try again in a few minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalOrDev(req),
});

// Registration limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 30 : 1000,
    skipSuccessfulRequests: true,
    message: { message: 'Too many registration attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalOrDev(req),
});

// OTP Limiter
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 1000,
    skipSuccessfulRequests: true,
    message: { message: 'Too many OTP attempts. Please wait a few minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalOrDev(req),
});

module.exports = {
    loginLimiter,
    registerLimiter,
    otpLimiter,
    apiLimiter
};
