const { success, error } = require('../utils/response');

async function getTenantConfig(req, res) {
  try {
    const { village } = req;
    return success(res, {
      village_id: village.id,
      name: village.name,
      subdomain: village.subdomain,
      logo_url: village.logo_url,
      theme_color: village.theme_color,
      language_default: village.language_default,
    });
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { getTenantConfig };
