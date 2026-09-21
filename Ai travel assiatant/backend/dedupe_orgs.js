const { Organization, ApiKey, sequelize } = require('./models');

async function dedupeOrgs() {
  try {
    await sequelize.authenticate();
    const orgs = await Organization.findAll({ order: [['id', 'ASC']] });
    const seenOwners = new Map();

    for (const org of orgs) {
      if (!seenOwners.has(org.owner_id)) {
        seenOwners.set(org.owner_id, org);
      } else {
        const primaryOrg = seenOwners.get(org.owner_id);
        // If the current duplicate has enterprise plan or higher quota, upgrade the primary
        if (org.plan_tier === 'enterprise' || org.monthly_quota > primaryOrg.monthly_quota) {
          primaryOrg.plan_tier = org.plan_tier;
          primaryOrg.monthly_quota = org.monthly_quota;
          await primaryOrg.save();
        }
        // Move any api keys from duplicate to primary
        await ApiKey.update({ org_id: primaryOrg.id }, { where: { org_id: org.id } });
        // Remove duplicate
        await org.destroy();
        console.log(`Deleted duplicate organization #${org.id} for owner #${org.owner_id}`);
      }
    }
    console.log('✅ Deduplication complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during dedupe:', err);
    process.exit(1);
  }
}

dedupeOrgs();
