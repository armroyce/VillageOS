const { success, error } = require('../utils/response');
const { PLAN_FEATURES } = require('../config/planFeatures');

async function getTenantConfig(req, res) {
  try {
    const { village, plan } = req;

    // Build feature flags for the frontend based on current plan
    const features = Object.fromEntries(
      Object.entries(PLAN_FEATURES).map(([feature, plans]) => [feature, plans.includes(plan)])
    );

    return success(res, {
      village_id: village.id,
      name: village.name,
      subdomain: village.subdomain,
      logo_url: village.logo_url,
      theme_color: village.theme_color,
      language_default: village.language_default,
      plan,
      features,
    });
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { getTenantConfig };
