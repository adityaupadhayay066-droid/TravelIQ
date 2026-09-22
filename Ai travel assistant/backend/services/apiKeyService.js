const crypto = require('crypto');
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

  // Quota check
  if (organization.used_quota >= organization.monthly_quota) {
    return {
      valid: false,
      quotaExceeded: true,
      error: `Monthly quota of ${organization.monthly_quota} requests exceeded for plan '${organization.plan_tier}'. Please upgrade your subscription.`
    };
  }

  return { valid: true, apiKey, organization };
}

/**
 * Increment usage quota and log API usage
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

    // 2. Increment organization quota count
    await Organization.increment('used_quota', {
      by: 1,
      where: { id: orgId }
    });

    // 3. Update apiKey last_used_at
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
  recordUsage
};
