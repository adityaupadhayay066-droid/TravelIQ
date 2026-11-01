const crypto = require('crypto');
const { Op, literal } = require('sequelize');
const { ApiKey, Organization, ApiUsageLog } = require('../models');

// Plan tier quota configurations
const PLAN_CONFIGS = {
  free: {
    name: 'Free Starter',
    monthly_quota: 100,
    rate_limit_per_minute: 20,
    price_usd: 0
  },
  starter: {
    name: 'Developer Starter',
    monthly_quota: 2500,
    rate_limit_per_minute: 60,
    price_usd: 29
  },
  pro: {
    name: 'Business Pro',
    monthly_quota: 15000,
    rate_limit_per_minute: 180,
    price_usd: 99
  },
  enterprise: {
    name: 'Enterprise Scale',
    monthly_quota: 100000,
    rate_limit_per_minute: 600,
    price_usd: 499
  }
};

// In-memory sliding window rate-limiter per API key
const keyRateLimitWindows = new Map(); // keyId -> [timestamps]

function checkKeyRateLimit(apiKeyId, limitPerMinute) {
  const now = Date.now();
  let window = keyRateLimitWindows.get(apiKeyId);
  if (!window) {
    window = [];
    keyRateLimitWindows.set(apiKeyId, window);
  }
  // Evict timestamps older than 60 seconds
  const cutoff = now - 60000;
  while (window.length > 0 && window[0] <= cutoff) {
    window.shift();
  }
  if (window.length >= limitPerMinute) {
    const oldest = window[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + 60000 - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      currentCount: window.length,
      limit: limitPerMinute
    };
  }
  window.push(now);
  return {
    allowed: true,
    currentCount: window.length,
    limit: limitPerMinute
  };
}

/**
 * Generate a cryptographically secure API key
 * Prefix: "tiq_live_"
 * Total length ~ 48 chars
 */
function generateKeySecret(prefix = 'tiq_live_') {
  const randomBytes = crypto.randomBytes(24).toString('base64url'); // 32 chars
  const rawKey = `${prefix}${randomBytes}`;
  const keyHash = hashApiKey(rawKey);
  const keyHint = rawKey.slice(-4);
  return { rawKey, keyPrefix: prefix, keyHint, keyHash };
}

/**
 * Hash an API key with SHA-256
 */
function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Find and validate API Key from incoming raw string
 */
async function authenticateApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'API key is missing or invalid format' };
  }

  const cleanKey = rawKey.trim().replace(/^Bearer\s+/i, '');
  const hashed = hashApiKey(cleanKey);

  const apiKey = await ApiKey.findOne({
    where: { key_hash: hashed, is_revoked: false },
    include: [{
      model: Organization,
      where: { is_active: true }
    }]
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid or revoked API key' };
  }

  if (apiKey.expires_at && new Date() > new Date(apiKey.expires_at)) {
    return { valid: false, error: 'API key has expired' };
  }

  const organization = apiKey.Organization;
  if (!organization) {
    return { valid: false, error: 'Associated organization is not active' };
  }

  // 1. Enforce monthly billing cycle reset (30 days)
  const now = new Date();
  const cycleStart = organization.billing_cycle_start ? new Date(organization.billing_cycle_start) : null;
  if (!cycleStart || (now - cycleStart) >= 30 * 24 * 60 * 60 * 1000) {
    await Organization.update(
      { used_quota: 0, billing_cycle_start: now },
      { where: { id: organization.id } }
    );
    organization.used_quota = 0;
    organization.billing_cycle_start = now;
  }

  // 2. Strict Per-Minute Rate Limiting
  const rateLimit = apiKey.rate_limit_per_minute || PLAN_CONFIGS[organization.plan_tier]?.rate_limit_per_minute || 20;
  const rateCheck = checkKeyRateLimit(apiKey.id, rateLimit);
  if (!rateCheck.allowed) {
    return {
      valid: false,
      rateLimited: true,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      limit: rateCheck.limit,
      error: `Rate limit of ${rateCheck.limit} requests per minute exceeded.`
    };
  }

  // 3. Concurrency-Safe Atomic Quota Check & Decrement
  // UPDATE organizations SET used_quota = used_quota + 1 WHERE id = :id AND used_quota < monthly_quota
  const [affectedRows] = await Organization.update(
    { used_quota: literal('used_quota + 1') },
    {
      where: {
        id: organization.id,
        used_quota: { [Op.lt]: organization.monthly_quota }
      }
    }
  );

  if (affectedRows === 0) {
    return {
      valid: false,
      quotaExceeded: true,
      error: `Monthly quota of ${organization.monthly_quota} requests exceeded for plan '${organization.plan_tier}'. Please upgrade your subscription.`
    };
  }

  // Update local organization in-memory count to reflect the increment
  organization.used_quota += 1;

  return { valid: true, apiKey, organization, rateCheck };
}

/**
 * Log API telemetry without double-incrementing quota
 */
async function recordUsage({ orgId, apiKeyId, endpoint, method, statusCode, responseTimeMs, tokensUsed = 1, ipAddress }) {
  try {
    // 1. Asynchronously log telemetry
    await ApiUsageLog.create({
      org_id: orgId,
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      tokens_used: tokensUsed,
      ip_address: ipAddress
    });

    // 2. Update apiKey last_used_at
    if (apiKeyId) {
      await ApiKey.update({ last_used_at: new Date() }, { where: { id: apiKeyId } });
    }
  } catch (err) {
    console.error('[apiKeyService:recordUsage Error]:', err.message);
  }
}

module.exports = {
  PLAN_CONFIGS,
  generateKeySecret,
  hashApiKey,
  authenticateApiKey,
  recordUsage,
  checkKeyRateLimit
};
