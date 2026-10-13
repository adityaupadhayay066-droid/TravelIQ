const crypto = require('crypto');
const { SecurityAlert } = require('../models');

// Shared salt/secret for client-shield HMAC verification
const SHIELD_SECRET = process.env.CLIENT_SHIELD_SECRET || 'traveliq_client_shield_sec_2026';

// Blacklist store in-memory: Map<IP, { reason, blockedAt, expiresAt }>
const blacklistedIPs = new Map();

// High-speed scraping velocity tracking: Map<IP, Array<timestamp>>
const requestVelocityMap = new Map();

// Scraper & Bot User-Agent Blacklist Patterns (similar to Flipkart / Cloudflare Bot Management)
const BOT_UA_PATTERNS = [
    /scrapy/i,
    /python-requests/i,
    /python-urllib/i,
    /aiohttp/i,
    /beautifulsoup/i,
    /httpclient/i,
    /apache-httpclient/i,
    /curl\//i,
    /wget\//i,
    /postmanruntime/i,
    /puppeteer/i,
    /playwright/i,
    /headlesschrome/i,
    /phantomjs/i,
    /selenium/i,
    /webdriver/i,
    /insomnia/i,
    /go-http-client/i,
    /java\//i,
    /libwww-perl/i,
    /mechanize/i,
    /casperjs/i,
    /sqlmap/i,
    /nikto/i,
    /zgrab/i,
    /node-fetch/i,
    /axios\//i // Blocks raw scripts using standalone node axios without browser User-Agent
];

// Routes excluded from anti-scraping checks (e.g., public developer B2B APIs, webhooks, health checks)
const EXCLUDED_PREFIXES = [
    '/api/health',
    '/api/v1/public',
    '/api/developer',
    '/api/n8n/webhook',
    '/uploads'
];

/**
 * Generate a client shield token (used on frontend or test scripts)
 * Format: `${timestamp}.${signature}`
 */
const generateClientShield = (timestamp = Date.now()) => {
    const payload = `${timestamp}:${SHIELD_SECRET}`;
    const hash = crypto.createHmac('sha256', SHIELD_SECRET).update(payload).digest('hex');
    return `${timestamp}.${hash}`;
};

/**
 * Verify client shield token
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

    const payload = `${timestamp}:${SHIELD_SECRET}`;
    const expectedHash = crypto.createHmac('sha256', SHIELD_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));
};

/**
 * Check if an IP is currently blacklisted
 */
const isIPBlacklisted = (ip) => {
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'test') return false;
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
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'test') return;
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

    const path = req.path || req.originalUrl || '';

    // Allow excluded routes (health checks, public B2B developer API with key)
    if (EXCLUDED_PREFIXES.some(prefix => path.startsWith(prefix))) {
        return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
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

    // 2. Detect Scraper / Bot User-Agents
    if (!userAgent || userAgent.trim() === '') {
        await blacklistIP(ip, 'Missing User-Agent Header (Headless Bot)', 30 * 60 * 1000, { userAgent, path });
        return res.status(403).json({
            success: false,
            error: 'Access Denied: Missing valid browser User-Agent header.'
        });
    }

    const isKnownBot = BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));
    if (isKnownBot) {
        await blacklistIP(ip, `Known Scraper Bot Detected (${userAgent.substring(0, 40)})`, 60 * 60 * 1000, { userAgent, path });
        return res.status(403).json({
            success: false,
            error: 'Access Denied: Automated data extraction & scraping tools are strictly prohibited by TravelIQ Bot Protection Policy.'
        });
    }

    // 3. Behavioral Velocity Scraping Detection for Catalog Endpoints
    // (e.g. Travel, Hotels, Trains, Destinations, Food)
    const isCatalogEndpoint = /^\/api\/(travel|hotels|food|station|trains|destinations)/i.test(path);
    if (isCatalogEndpoint && req.method === 'GET') {
        const now = Date.now();
        const timestamps = requestVelocityMap.get(ip) || [];
        // Keep timestamps in the last 4 seconds
        const recent = timestamps.filter(t => now - t < 4000);
        recent.push(now);
        requestVelocityMap.set(ip, recent);

        // If an IP triggers > 18 catalog requests within 4 seconds (impossible for human browsing)
        if (recent.length > 18) {
            await blacklistIP(ip, 'Excessive Catalog Crawling Velocity (Scraper Burst)', 15 * 60 * 1000, { userAgent, path });
            return res.status(429).json({
                success: false,
                error: 'Too Many Requests: Abnormal scraping activity detected. Catalog queries temporarily throttled.'
            });
        }
    }

    // 4. Client Shield Token Validation for protected stateful routes
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
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
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

module.exports = {
    antiScrapingShield,
    honeypotTrapHandler,
    generateClientShield,
    verifyClientShield,
    getAntiScrapingStats,
    unblockIP,
    blacklistIP,
    SHIELD_SECRET
};
