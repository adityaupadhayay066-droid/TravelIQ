const { authenticateApiKey, recordUsage } = require('../services/apiKeyService');

/**
 * Middleware for authenticating B2B API Key requests
 * Header format:
 *   X-API-Key: tiq_live_abc...
 *   OR
 *   Authorization: Bearer tiq_live_abc...
 */
const requireApiKey = async (req, res, next) => {
  const startTime = Date.now();
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-api-token'];
  let rawKey = apiKeyHeader;

  if (!rawKey && req.headers.authorization && req.headers.authorization.startsWith('Bearer tiq_')) {
    rawKey = req.headers.authorization.split(' ')[1];
  }

  if (!rawKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing API key.',
      hint: 'Provide your API key in the X-API-Key header or Authorization: Bearer tiq_...'
    });
  }

  try {
    const authResult = await authenticateApiKey(rawKey);

    if (!authResult.valid) {
      if (authResult.quotaExceeded) {
        return res.status(429).json({
          success: false,
          error: 'Quota Exceeded',
          message: authResult.error,
          upgrade_url: '/developer/billing'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid API Key',
        message: authResult.error
      });
    }

    const { apiKey, organization } = authResult;
    req.apiKey = apiKey;
    req.organization = organization;

    // Attach response rate-limit and quota headers
    const remainingQuota = Math.max(0, organization.monthly_quota - organization.used_quota);
    res.setHeader('X-Quota-Limit', organization.monthly_quota);
    res.setHeader('X-Quota-Remaining', remainingQuota);
    res.setHeader('X-Plan-Tier', organization.plan_tier);

    // Track usage upon completion
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      recordUsage({
        orgId: organization.id,
        apiKeyId: apiKey.id,
        endpoint: req.originalUrl || req.baseUrl + req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTimeMs: durationMs,
        tokensUsed: 1,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : null
      });
    });

    return next();
  } catch (err) {
    console.error('[apiKeyMiddleware Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication server error'
    });
  }
};

module.exports = { requireApiKey };
