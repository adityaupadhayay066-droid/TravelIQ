const crypto = require('crypto');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');

// ─── Challenge In-Memory Store with TTL ───
// Map<challengeToken, { challenge, userId, email, expiresAt, type }>
const challengeStore = new Map();

// Periodic sweep for expired challenges (every 60s)
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of challengeStore.entries()) {
        if (now > data.expiresAt) {
            challengeStore.delete(token);
        }
    }
}, 60 * 1000).unref();

function storeChallenge(data, ttlMs = 5 * 60 * 1000) {
    const token = crypto.randomBytes(32).toString('hex');
    challengeStore.set(token, {
        ...data,
        expiresAt: Date.now() + ttlMs
    });
    return token;
}

function consumeChallenge(token) {
    if (!token || !challengeStore.has(token)) return null;
    const entry = challengeStore.get(token);
    challengeStore.delete(token); // Single-use: immediately prevent replay
    if (Date.now() > entry.expiresAt) {
        return null;
    }
    return entry;
}

function getRpId(req) {
    if (process.env.WEBAUTHN_RP_ID) {
        return process.env.WEBAUTHN_RP_ID;
    }
    const host = req ? (req.hostname || req.headers?.['host']?.split(':')[0]) : 'localhost';
    return host || 'localhost';
}

function getExpectedOrigins(req) {
    const origins = new Set();
    if (process.env.WEBAUTHN_ORIGIN) {
        origins.add(process.env.WEBAUTHN_ORIGIN);
    }
    // Standard local dev origins
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://localhost:5000');
    origins.add('http://127.0.0.1:5000');

    if (req) {
        const originHeader = req.headers['origin'];
        if (originHeader) {
            try {
                const u = new URL(originHeader);
                if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname.endsWith('devtunnels.ms')) {
                    origins.add(originHeader);
                }
            } catch (e) {
                // Ignore invalid origin
            }
        }
    }
    return Array.from(origins);
}

module.exports = {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    storeChallenge,
    consumeChallenge,
    getRpId,
    getExpectedOrigins
};
