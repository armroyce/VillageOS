const { success, error } = require('../utils/response');

async function listAudit(req, res) {
  try {
    const { TenantAuditLog } = req.models;
    const { page = 1, limit = 50, module, action } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    const { count, rows } = await TenantAuditLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });
    return success(res, rows, 'OK', 200, { total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listAudit };
