const Village = require('../models/control/Village');
const { decrypt } = require('../utils/crypto');
const { error } = require('../utils/response');

async function resolveTenant(req, res, next) {
  try {
    // Accept village_id from JWT or header
    const villageId = req.user?.village_id || req.headers['x-village-id'];
    // Or resolve from subdomain
    const subdomain = req.headers['x-subdomain'];

    let village;
    if (villageId) {
      village = await Village.findByPk(villageId);
    } else if (subdomain) {
      village = await Village.findOne({ where: { subdomain, is_active: true } });
    }

    if (!village) {
      return error(res, 'Tenant not found', 404, 'TENANT_NOT_FOUND');
    }
    if (!village.is_active) {
      return error(res, 'Tenant is inactive', 403, 'TENANT_INACTIVE');
    }

    req.village = village;
    req.tenantConnectionString = decrypt(village.db_connection_string);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = resolveTenant;
