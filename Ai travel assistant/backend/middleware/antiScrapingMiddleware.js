const crypto = require('crypto');
const { SecurityAlert } = require('../models');

// Salt/secret for client-shield HMAC verification (if configured in environment)
const SHIELD_SECRET = process.env.CLIENT_SHIELD_SECRET || null;

// Blacklist store in-memory: Map<IP, { reason, blockedAt, expiresAt }>
const blacklistedIPs = new Map();
const MAX_BLACKLIST_SIZE = 10000;

// High-speed scraping velocity tracking: Map<IP, Array<timestamp>>
const requestVelocityMap = new Map();

// Scraper & Bot User-Agent Blacklist Patterns (malicious scanners, exploit crawlers, automated scrapers)
// Note: Legitimate developer HTTP clients (curl, python-requests, node-fetch, axios, Go, Java) are NOT blanket-blocked.
const BOT_UA_PATTERNS = [
    /scrapy/i,
    /beautifulsoup/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
    /phantomjs/i,
    /headlesschrome/i,
    /sqlmap/i,
    /nikto/i,
    /zgrab/i,
    /masscan/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i
];

// Routes excluded from anti-scraping checks (e.g., health check, webhooks, public B2B developer APIs)
const EXCLUDED_PREFIXES = [
    '/api/health',
    '/api/payment/webhook',
    '/api/n8n/webhook',
    '/api/v1/public',
    '/api/developer',
    '/uploads'
];

/**
 * Determine trustworthy client IP without blindly trusting spoofed X-Forwarded-For headers
 */
const getClientIP = (req) => {
    // If running in test mode with explicit simulated IP header, honor it
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-client-ip']) {
        return String(req.headers['x-test-client-ip']).trim();
    }

    const directRemote = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
    const isLoopback = directRemote === '127.0.0.1' || directRemote === '::1' || directRemote === '::ffff:127.0.0.1';
    const trustedProxies = (process.env.TRUSTED_PROXY_IPS || '').split(',').map(s => s.trim()).filter(Boolean);

    // If socket connection is from loopback or configured trusted proxy reverse proxy, Express req.ip is trustworthy
    if (isLoopback || trustedProxies.includes(directRemote)) {
        return req.ip || directRemote || '127.0.0.1';
    }

    // Direct socket connection is untrusted: do not trust spoofed X-Forwarded-For header
    return directRemote || '127.0.0.1';
};

/**
 * Generate a client shield token (used for supplementary telemetry)
 * Format: `${timestamp}.${entropy}`
 */
const generateClientShield = (timestamp = Date.now()) => {
    if (SHIELD_SECRET) {
        const payload = `${timestamp}:${SHIELD_SECRET}`;
        const hash = crypto.createHmac('sha256', SHIELD_SECRET).update(payload).digest('hex');
        return `${timestamp}.${hash}`;
    }
    const entropy = crypto.randomBytes(16).toString('hex');
    return `${timestamp}.${entropy}`;
};

/**
 * Verify client shield token
 * Supplementary bot mitigation only - not a security boundary
 */
const verifyClientShield = (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestampStr, providedHash] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check freshness: token must be within 10 minutes of server time
    const now = Date.now();
    if (Math.abs(now - timestamp) > 10 * 60 * 1000) {
        return false;
    }

    if (SHIELD_SECRET) {
        const payload = `${timestamp}:${SHIELD_SECRET}`;
        const expectedHash = crypto.createHmac('sha256', SHIELD_SECRET).update(payload).digest('hex');
        if (providedHash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash))) {
            return true;
        }
        return false;
    }

    // Require valid cryptographic digest format (32 to 64 hex characters), never arbitrary 4-character strings
    return /^[a-f0-9]{32,64}$/i.test(providedHash);
};

/**
 * Check if an IP is currently blacklisted
 */
const isIPBlacklisted = (ip) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return false;
    if (!blacklistedIPs.has(ip)) return false;
    const entry = blacklistedIPs.get(ip);
    if (Date.now() > entry.expiresAt) {
        blacklistedIPs.delete(ip);
        return false;
    }
    return entry;
};

/**
 * Blacklist an offending IP address and log security alert
 */
const blacklistIP = async (ip, reason, durationMs = 24 * 60 * 60 * 1000, details = {}) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return;
    
    // Prune if map exceeds max size to prevent memory exhaustion
    if (blacklistedIPs.size >= MAX_BLACKLIST_SIZE) {
        const now = Date.now();
        for (const [key, val] of blacklistedIPs.entries()) {
            if (now > val.expiresAt) blacklistedIPs.delete(key);
        }
        if (blacklistedIPs.size >= MAX_BLACKLIST_SIZE) {
            const firstKey = blacklistedIPs.keys().next().value;
            blacklistedIPs.delete(firstKey);
        }
    }

    const expiresAt = Date.now() + durationMs;
    blacklistedIPs.set(ip, {
        reason,
        blockedAt: new Date().toISOString(),
        expiresAt
    });

    console.warn(`🛡️ [ANTI-SCRAPING] IP ${ip} blacklisted for: ${reason} (Duration: ${Math.round(durationMs / 60000)}m)`);

    try {
        if (SecurityAlert) {
            await SecurityAlert.create({
                user_id: 1, // System admin level alert
                alert_type: 'DATA_SCRAPING_ATTEMPT',
                ip_address: ip,
                location: details.country || 'Unknown',
                resolved: false,
                details: {
                    reason,
                    userAgent: details.userAgent || 'Unknown',
                    path: details.path || 'Unknown',
                    blockedUntil: new Date(expiresAt).toISOString()
                }
            });
        }
    } catch (err) {
        // Silently continue if DB logging fails
    }
};

/**
 * Anti-Scraping core middleware
 */
const antiScrapingShield = async (req, res, next) => {
    // Check if scraping protection is explicitly disabled
    if (process.env.DISABLE_ANTI_SCRAPING === 'true') {
        return next();
    }

    const originalUrl = req.originalUrl ? req.originalUrl.split('?')[0] : '';
    const baseUrl = req.baseUrl ? req.baseUrl.split('?')[0] : '';
    const reqPath = req.path ? req.path.split('?')[0] : '';
    const fullPath = originalUrl || (baseUrl + reqPath) || (req.url ? req.url.split('?')[0] : '');

    // Allow excluded routes (health checks, payment webhooks, n8n webhooks, public B2B developer API)
    const isExempt = EXCLUDED_PREFIXES.some(prefix => {
        if (fullPath.startsWith(prefix)) return true;
        if (reqPath.startsWith(prefix)) return true;
        if (prefix.startsWith('/api') && reqPath.startsWith(prefix.slice(4))) return true;
        return false;
    });

    if (isExempt) {
        return next();
    }

    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // 1. Check IP Blacklist
    const blacklistEntry = isIPBlacklisted(ip);
    if (blacklistEntry) {
        return res.status(403).json({
            success: false,
            error: 'Access Denied: Your IP address has been temporarily blocked for automated data scraping activity.',
            reason: blacklistEntry.reason,
            retryAfter: Math.ceil((blacklistEntry.expiresAt - Date.now()) / 1000)
        });
    }

    // 2. Detect Malicious Scraper / Bot User-Agents
    if (userAgent && userAgent.trim() !== '') {
        const isKnownBot = BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));
        if (isKnownBot) {
            await blacklistIP(ip, `Known Scraper Bot Detected (${userAgent.substring(0, 40)})`, 60 * 60 * 1000, { userAgent, path: fullPath });
            return res.status(403).json({
                success: false,
                error: 'Access Denied: Automated data extraction & scraping tools are strictly prohibited by TravelIQ Bot Protection Policy.'
            });
        }
    }

    // 3. Behavioral Velocity Scraping Detection for Catalog Endpoints
    // Evaluates both fullPath (/api/travel, /api/hotels, etc.) and relative path (/travel, /hotels, etc.)
    const isCatalogEndpoint = /^\/api\/(travel|hotels|food|station|trains|destinations)/i.test(fullPath) ||
                              /^\/(travel|hotels|food|station|trains|destinations)/i.test(reqPath);

    if (isCatalogEndpoint && req.method === 'GET') {
        const now = Date.now();
        const timestamps = requestVelocityMap.get(ip) || [];
        // Keep timestamps in the last 4 seconds
        const recent = timestamps.filter(t => now - t < 4000);
        recent.push(now);
        requestVelocityMap.set(ip, recent);

        // If an IP triggers > 18 catalog requests within 4 seconds (scraper burst)
        if (recent.length > 18) {
            await blacklistIP(ip, 'Excessive Catalog Crawling Velocity (Scraper Burst)', 15 * 60 * 1000, { userAgent, path: fullPath });
            return res.status(429).json({
                success: false,
                error: 'Too Many Requests: Abnormal scraping activity detected. Catalog queries temporarily throttled.'
            });
        }
    }

    // 4. Client Shield Token Validation for supplementary telemetry
    const clientShield = req.headers['x-client-shield'];
    if (clientShield) {
        if (!verifyClientShield(clientShield)) {
            console.warn(`🛡️ [ANTI-SCRAPING] Invalid or expired Client Shield token from IP: ${ip}`);
        }
    }

    next();
};

/**
 * Honeypot Trap Handler
 * Endpoints that legitimate users never access, but automated crawlers / spiders discover and hit.
 */
const honeypotTrapHandler = async (req, res) => {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const path = req.originalUrl || req.url;

    // Immediately ban the crawler for 24 hours
    await blacklistIP(ip, `Honeypot Trap Triggered (${path})`, 24 * 60 * 60 * 1000, { userAgent, path });

    res.status(403).json({
        success: false,
        error: 'Security Warning: Honeypot crawler trap triggered. Automated scraping activity logged and IP address blacklisted.'
    });
};

/**
 * Get Anti-Scraping Statistics & Blacklist (For Admin Security Dashboard)
 */
const getAntiScrapingStats = () => {
    const list = [];
    const now = Date.now();
    for (const [ip, entry] of blacklistedIPs.entries()) {
        if (now < entry.expiresAt) {
            list.push({
                ip,
                reason: entry.reason,
                blockedAt: entry.blockedAt,
                remainingSeconds: Math.ceil((entry.expiresAt - now) / 1000)
            });
        }
    }

    return {
        totalBlockedIPs: list.length,
        blockedIPs: list,
        protectionStatus: process.env.DISABLE_ANTI_SCRAPING === 'true' ? 'DISABLED' : 'ACTIVE',
        activeShieldAlgorithm: 'HMAC-SHA256',
        botSignaturesCount: BOT_UA_PATTERNS.length
    };
};

/**
 * Unblock an IP address manually
 */
const unblockIP = (ip) => {
    if (blacklistedIPs.has(ip)) {
        blacklistedIPs.delete(ip);
        return true;
    }
    return false;
};

/**
 * Test helper: clear in-memory blacklist
 */
const clearBlacklistForTest = () => {
    blacklistedIPs.clear();
    requestVelocityMap.clear();
};

module.exports = {
    antiScrapingShield,
    honeypotTrapHandler,
    generateClientShield,
    verifyClientShield,
    getAntiScrapingStats,
    unblockIP,
    blacklistIP,
    isIPBlacklisted,
    getClientIP,
    clearBlacklistForTest,
    SHIELD_SECRET
};
