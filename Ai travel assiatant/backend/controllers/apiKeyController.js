const { Organization, ApiKey, ApiUsageLog } = require('../models');
const { generateKeySecret, PLAN_CONFIGS } = require('../services/apiKeyService');
const { Op, fn, col } = require('sequelize');

/**
 * Helper: Find or create organization for authenticated user.
 * Admin users automatically receive Full Premium / Enterprise access!
 */
async function getUserOrganization(userOrId, optionalName = 'My Organization', optionalRole = 'user') {
  let userId;
  let userName = optionalName;
  let userRole = optionalRole;

  if (typeof userOrId === 'object' && userOrId !== null) {
    userId = userOrId.id;
    userName = userOrId.name || optionalName;
    userRole = userOrId.role || optionalRole;
  } else {
    userId = userOrId;
  }

  if (!userId) {
    throw new Error('Missing user ID for organization lookup');
  }

  const isAdmin = userRole && userRole.toLowerCase() === 'admin';

  let org = await Organization.findOne({ where: { owner_id: userId } });
  
  if (!org) {
    org = await Organization.create({
      owner_id: userId,
      name: isAdmin ? `${userName} (Admin Enterprise)` : `${userName}'s Workspace`,
      plan_tier: isAdmin ? 'enterprise' : 'free',
      monthly_quota: isAdmin ? 1000000 : PLAN_CONFIGS.free.monthly_quota,
      used_quota: 0
    });
  } else if (isAdmin && org.plan_tier !== 'enterprise') {
    // Automatically elevate existing admin organization to Enterprise
    org.plan_tier = 'enterprise';
    org.monthly_quota = 1000000;
    await org.save();
  }

  return org;
}

/**
 * Get organization profile and active subscription details
 */
exports.getOrganizationDetails = async (req, res) => {
  try {
    const org = await getUserOrganization(req.user);
    const isAdmin = req.user?.role && req.user.role.toLowerCase() === 'admin';
    return res.status(200).json({
      success: true,
      is_admin: isAdmin,
      organization: {
        id: org.id,
        name: org.name,
        plan_tier: org.plan_tier,
        plan_info: PLAN_CONFIGS[org.plan_tier] || PLAN_CONFIGS.free,
        monthly_quota: org.monthly_quota,
        used_quota: org.used_quota,
        remaining_quota: Math.max(0, org.monthly_quota - org.used_quota),
        billing_cycle_start: org.billing_cycle_start,
        is_active: org.is_active,
        available_plans: PLAN_CONFIGS
      }
    });
  } catch (err) {
    console.error('[getOrganizationDetails Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to retrieve organization' });
  }
};

/**
 * List all API Keys for the current organization
 */
exports.listApiKeys = async (req, res) => {
  try {
    const org = await getUserOrganization(req.user);
    const keys = await ApiKey.findAll({
      where: { org_id: org.id },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'key_prefix', 'key_hint', 'rate_limit_per_minute', 'is_revoked', 'last_used_at', 'expires_at', 'created_at']
    });


    const formattedKeys = keys.map(k => ({
      id: k.id,
      name: k.name,
      masked_key: `${k.key_prefix}${'•'.repeat(20)}${k.key_hint}`,
      key_hint: k.key_hint,
      rate_limit: k.rate_limit_per_minute,
      is_revoked: k.is_revoked,
      last_used_at: k.last_used_at,
      expires_at: k.expires_at,
      created_at: k.created_at
    }));

    return res.status(200).json({ success: true, keys: formattedKeys });
  } catch (err) {
    console.error('[listApiKeys Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to list API keys' });
  }
};

/**
 * Create a new API Key (Returns full raw secret ONCE)
 */
exports.createApiKey = async (req, res) => {
  try {
    const { name = 'Default API Key', rate_limit } = req.body;
    const org = await getUserOrganization(req.user);

    // Limit maximum active keys per plan
    const activeKeyCount = await ApiKey.count({ where: { org_id: org.id, is_revoked: false } });
    const maxKeys = org.plan_tier === 'enterprise' ? 20 : (org.plan_tier === 'pro' ? 10 : 3);

    if (activeKeyCount >= maxKeys) {
      return res.status(400).json({
        success: false,
        error: `Active API key limit reached (${activeKeyCount}/${maxKeys}). Upgrade plan or revoke unused keys.`
      });
    }

    const { rawKey, keyPrefix, keyHint, keyHash } = generateKeySecret('tiq_live_');
    const planConfig = PLAN_CONFIGS[org.plan_tier] || PLAN_CONFIGS.free;

    const apiKey = await ApiKey.create({
      org_id: org.id,
      name: name.trim() || 'Default Key',
      key_prefix: keyPrefix,
      key_hint: keyHint,
      key_hash: keyHash,
      rate_limit_per_minute: rate_limit || planConfig.rate_limit_per_minute
    });

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Please copy it now; you will not be able to see it again!',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        raw_key: rawKey, // Shown once!
        key_hint: keyHint,
        created_at: apiKey.created_at
      }
    });
  } catch (err) {
    console.error('[createApiKey Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create API key' });
  }
};

/**
 * Revoke an API Key
 */
exports.revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const org = await getUserOrganization(req.user);

    const apiKey = await ApiKey.findOne({ where: { id: keyId, org_id: org.id } });
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    apiKey.is_revoked = true;
    await apiKey.save();

    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (err) {
    console.error('[revokeApiKey Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to revoke API key' });
  }
};

/**
 * Get Developer Usage Analytics and Metered Logs
 */
exports.getUsageAnalytics = async (req, res) => {
  try {
    const org = await getUserOrganization(req.user);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Recent logs
    const recentLogs = await ApiUsageLog.findAll({
      where: {
        org_id: org.id,
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      order: [['created_at', 'DESC']],
      limit: 50,
      include: [{ model: ApiKey, attributes: ['name', 'key_hint'] }]
    });

    // Endpoint breakdown
    const endpointStats = await ApiUsageLog.findAll({
      where: {
        org_id: org.id,
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        'endpoint',
        [fn('COUNT', col('id')), 'total_calls'],
        [fn('AVG', col('response_time_ms')), 'avg_latency']
      ],
      group: ['endpoint']
    });

    return res.status(200).json({
      success: true,
      analytics: {
        used_quota: org.used_quota,
        monthly_quota: org.monthly_quota,
        remaining_quota: Math.max(0, org.monthly_quota - org.used_quota),
        usage_percent: Math.min(100, Math.round((org.used_quota / (org.monthly_quota || 1)) * 100)),
        recent_logs: recentLogs,
        endpoint_stats: endpointStats
      }
    });
  } catch (err) {
    console.error('[getUsageAnalytics Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch usage analytics' });
  }
};

/**
 * Upgrade plan tier or buy credits
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const { plan_tier } = req.body;
    if (!PLAN_CONFIGS[plan_tier]) {
      return res.status(400).json({ success: false, error: 'Invalid plan tier selected' });
    }

    const org = await getUserOrganization(req.user);
    const targetPlan = PLAN_CONFIGS[plan_tier];

    org.plan_tier = plan_tier;
    org.monthly_quota = targetPlan.monthly_quota;
    // Keep existing used quota or reset if desired
    await org.save();

    // Adjust rate limits on existing active keys
    await ApiKey.update(
      { rate_limit_per_minute: targetPlan.rate_limit_per_minute },
      { where: { org_id: org.id, is_revoked: false } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name}!`,
      organization: {
        plan_tier: org.plan_tier,
        monthly_quota: org.monthly_quota,
        rate_limit: targetPlan.rate_limit_per_minute
      }
    });
  } catch (err) {
    console.error('[upgradeSubscription Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to process subscription upgrade' });
  }
};


/**
 * Update Key Name or Rate Limit
 */
exports.updateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name, rate_limit_per_minute } = req.body;
    const org = await getUserOrganization(req.user);

    const apiKey = await ApiKey.findOne({ where: { id: keyId, org_id: org.id } });
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    if (name) apiKey.name = name.trim();
    if (rate_limit_per_minute !== undefined) apiKey.rate_limit_per_minute = parseInt(rate_limit_per_minute, 10);
    await apiKey.save();

    return res.status(200).json({
      success: true,
      message: 'API Key updated successfully',
      apiKey
    });
  } catch (err) {
    console.error('[updateApiKey Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to update API key' });
  }
};

/**
 * =========================================================================
 * ADMIN EXCLUSIVE CONTROLLERS (Full Super Admin Access over all keys & orgs)
 * =========================================================================
 */

/**
 * Admin: List all API Keys across entire platform
 */
exports.adminGetAllApiKeys = async (req, res) => {
  try {
    const { User } = require('../models');
    const keys = await ApiKey.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: Organization,
        include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }]
      }]
    });

    const formatted = keys.map(k => ({
      id: k.id,
      name: k.name,
      masked_key: `${k.key_prefix}${'•'.repeat(16)}${k.key_hint}`,
      key_prefix: k.key_prefix,
      key_hint: k.key_hint,
      rate_limit: k.rate_limit_per_minute,
      is_revoked: k.is_revoked,
      last_used_at: k.last_used_at,
      expires_at: k.expires_at,
      created_at: k.created_at,
      organization: k.Organization ? {
        id: k.Organization.id,
        name: k.Organization.name,
        plan_tier: k.Organization.plan_tier,
        owner: k.Organization.User ? {
          id: k.Organization.User.id,
          name: k.Organization.User.name,
          email: k.Organization.User.email,
          role: k.Organization.User.role
        } : null
      } : null
    }));

    return res.status(200).json({ success: true, keys: formatted });
  } catch (err) {
    console.error('[adminGetAllApiKeys Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch global API keys' });
  }
};

/**
 * Admin: Modify any API key's rate limit, status, or name
 */
exports.adminUpdateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name, rate_limit_per_minute, is_revoked, expires_at } = req.body;

    const apiKey = await ApiKey.findByPk(keyId);
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    if (name !== undefined) apiKey.name = name.trim();
    if (rate_limit_per_minute !== undefined) apiKey.rate_limit_per_minute = parseInt(rate_limit_per_minute, 10);
    if (is_revoked !== undefined) apiKey.is_revoked = Boolean(is_revoked);
    if (expires_at !== undefined) apiKey.expires_at = expires_at ? new Date(expires_at) : null;

    await apiKey.save();

    return res.status(200).json({
      success: true,
      message: 'API Key modified successfully by Admin',
      apiKey
    });
  } catch (err) {
    console.error('[adminUpdateApiKey Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to modify API key' });
  }
};

/**
 * Admin: List all Organizations across the platform
 */
exports.adminGetAllOrganizations = async (req, res) => {
  try {
    const { User } = require('../models');
    const orgs = await Organization.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }]
    });

    return res.status(200).json({ success: true, organizations: orgs });
  } catch (err) {
    console.error('[adminGetAllOrganizations Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
  }
};

/**
 * Admin: Modify any Organization (Quota, Plan Tier, Active Status)
 */
exports.adminUpdateOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { plan_tier, monthly_quota, used_quota, is_active } = req.body;

    const org = await Organization.findByPk(orgId);
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    if (plan_tier !== undefined) org.plan_tier = plan_tier;
    if (monthly_quota !== undefined) org.monthly_quota = parseInt(monthly_quota, 10);
    if (used_quota !== undefined) org.used_quota = parseInt(used_quota, 10);
    if (is_active !== undefined) org.is_active = Boolean(is_active);

    await org.save();

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully by Admin',
      organization: org
    });
  } catch (err) {
    console.error('[adminUpdateOrganization Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};

