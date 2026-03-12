const { getTenantDb } = require('../config/tenantDb');
const { defineTenantModels } = require('../models/tenant');
const { error } = require('../utils/response');

async function connectTenantDB(req, res, next) {
  try {
    if (!req.tenantConnectionString) {
      return error(res, 'Tenant connection not resolved', 500, 'TENANT_DB_ERROR');
    }
    const db = getTenantDb(req.tenantConnectionString);
    req.tenantDb = db;
    req.models = defineTenantModels(db);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = connectTenantDB;
