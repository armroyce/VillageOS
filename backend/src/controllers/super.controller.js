const Village = require('../models/control/Village');
const Subscription = require('../models/control/Subscription');
const GlobalPermission = require('../models/control/GlobalPermission');
const { encrypt } = require('../utils/crypto');
const { getTenantDb } = require('../config/tenantDb');
const { defineTenantModels } = require('../models/tenant');
const { success, error } = require('../utils/response');

// GET /api/v1/super/villages
async function listVillages(req, res) {
  try {
    const villages = await Village.findAll({ include: [{ model: Subscription, as: 'subscription' }] });
    return success(res, villages);
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/super/villages
async function createVillage(req, res) {
  try {
    const { name, subdomain, db_connection_string, logo_url, theme_color, language_default, plan } = req.body;
    if (!name || !subdomain || !db_connection_string) {
      return error(res, 'name, subdomain, and db_connection_string are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await Village.findOne({ where: { subdomain } });
    if (existing) return error(res, 'Subdomain already taken', 409, 'DUPLICATE');

    const encryptedConn = encrypt(db_connection_string);
    const village = await Village.create({ name, subdomain, db_connection_string: encryptedConn, logo_url, theme_color, language_default });
    await Subscription.create({ village_id: village.id, plan: plan || 'free', status: 'active' });

    // Auto-provision tenant DB tables
    const db = getTenantDb(db_connection_string);
    const models = defineTenantModels(db);
    await db.sync({ alter: true });

    return success(res, village, 'Village created and tenant DB provisioned', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

// PUT /api/v1/super/villages/:id
async function updateVillage(req, res) {
  try {
    const village = await Village.findByPk(req.params.id);
    if (!village) return error(res, 'Village not found', 404, 'NOT_FOUND');

    const { name, logo_url, theme_color, language_default, is_active } = req.body;
    await village.update({ name, logo_url, theme_color, language_default, is_active });
    return success(res, village, 'Village updated');
  } catch (err) {
    return error(res, err.message);
  }
}

// GET /api/v1/super/permissions
async function listPermissions(req, res) {
  try {
    const perms = await GlobalPermission.findAll();
    return success(res, perms);
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/super/permissions
async function createPermission(req, res) {
  try {
    const { key, description } = req.body;
    if (!key) return error(res, 'key is required', 400, 'VALIDATION_ERROR');
    const perm = await GlobalPermission.create({ key, description });
    return success(res, perm, 'Permission created', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listVillages, createVillage, updateVillage, listPermissions, createPermission };
